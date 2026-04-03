#!/usr/bin/env node

// Higgsfield AI Tool — Generate images (Nano Banana 2/Pro) and videos (Kling)
// via the Higgsfield platform API.
//
// Usage:
//   # Text-to-image with Nano Banana 2
//   node tools/higgsfield.mjs image "A beautiful completed roof with architectural shingles, studio lighting, white background" --name hero-modern
//
//   # Text-to-image with Nano Banana Pro (higher quality)
//   node tools/higgsfield.mjs image "prompt here" --model nano-banana-pro --size 2K --name hero-forge
//
//   # Image-to-image (edit/reference) with Nano Banana 2
//   node tools/higgsfield.mjs edit "Make this an exploded X-ray view showing all layers" --ref ./output/hero-modern.png --name hero-modern-exploded
//
//   # Image-to-video with Kling (for scroll animations)
//   node tools/higgsfield.mjs video "Smooth transition from assembled to deconstructed" --image ./output/hero-modern.png --end-image ./output/hero-modern-exploded.png --name hero-transition
//
//   # Check status of a generation
//   node tools/higgsfield.mjs status <request_id>
//
//   # List recent generations
//   node tools/higgsfield.mjs list

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import { resolve, basename } from "path";
import "dotenv/config";

// ─── Config ───────────────────────────────────────────────────────────────────

const API_BASE = "https://platform.higgsfield.ai";
const API_KEY = process.env.HF_API_KEY;
const API_SECRET = process.env.HF_API_SECRET;
const OUTPUT_DIR = resolve(new URL(".", import.meta.url).pathname, "../.tmp/higgsfield");
const LOG_FILE = resolve(OUTPUT_DIR, "generations.json");

// Model IDs — V1 API paths (confirmed working against platform.higgsfield.ai)
const MODELS = {
  // Text-to-image (V1 API — body format: { params: { prompt, input_images, aspect_ratio } })
  "nano-banana": "v1/text2image/nano-banana",
  // Image-to-video (V1 API — body format: { params: { input_image, prompt, ... } })
  "kling": "v1/image2video/kling",
  "soul": "v1/image2video/dop",
};

// V1 API wraps body in { params: {...} }
const V1_MODELS = new Set(Object.values(MODELS));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ensureOutputDir() {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
}

function authHeader() {
  if (!API_KEY || !API_SECRET) {
    console.error("ERROR: HF_API_KEY and HF_API_SECRET must be set in .env");
    process.exit(1);
  }
  return `Key ${API_KEY}:${API_SECRET}`;
}

function loadLog() {
  if (!existsSync(LOG_FILE)) return [];
  return JSON.parse(readFileSync(LOG_FILE, "utf-8"));
}

function saveLog(entries) {
  ensureOutputDir();
  writeFileSync(LOG_FILE, JSON.stringify(entries, null, 2));
}

function logGeneration(entry) {
  const log = loadLog();
  log.push({ ...entry, timestamp: new Date().toISOString() });
  saveLog(log);
}

async function apiPost(modelId, body) {
  // V1 API wraps input in { params: {...} }
  const wrappedBody = V1_MODELS.has(modelId) ? { params: body } : body;

  const resp = await fetch(`${API_BASE}/${modelId}`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(wrappedBody),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`API ${resp.status}: ${text}`);
  }

  return resp.json();
}

async function checkStatus(requestId) {
  const resp = await fetch(`${API_BASE}/requests/${requestId}/status`, {
    headers: {
      Authorization: authHeader(),
      Accept: "application/json",
    },
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Status check ${resp.status}: ${text}`);
  }

  return resp.json();
}

async function pollUntilDone(requestId, maxWait = 300000) {
  const start = Date.now();
  let lastStatus = "";

  while (Date.now() - start < maxWait) {
    const status = await checkStatus(requestId);
    const state = status.status || status.state || "unknown";

    if (state !== lastStatus) {
      console.log(`  Status: ${state}`);
      lastStatus = state;
    }

    if (state === "completed" || state === "done") {
      return status;
    }
    if (state === "failed" || state === "error") {
      throw new Error(`Generation failed: ${JSON.stringify(status)}`);
    }
    if (state === "nsfw") {
      throw new Error("Content rejected (NSFW). Credits refunded. Try a different prompt.");
    }

    // Poll every 5 seconds
    await new Promise((r) => setTimeout(r, 5000));
  }

  throw new Error(`Timed out after ${maxWait / 1000}s. Request ID: ${requestId} — check with: node tools/higgsfield.mjs status ${requestId}`);
}

async function downloadFile(url, filepath) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Download failed: ${resp.status}`);
  const buffer = Buffer.from(await resp.arrayBuffer());
  writeFileSync(filepath, buffer);
  return filepath;
}

function imageToDataUrl(filepath) {
  const data = readFileSync(filepath);
  const ext = filepath.split(".").pop().toLowerCase();
  const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  return `data:${mime};base64,${data.toString("base64")}`;
}

// ─── Commands ─────────────────────────────────────────────────────────────────

async function generateImage(prompt, options = {}) {
  const model = options.model || "nano-banana";
  const modelId = MODELS[model] || model;
  const name = options.name || `image-${Date.now()}`;

  console.log(`\nGenerating image with ${model}...`);
  console.log(`  Prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? "..." : ""}"`);

  const body = {
    prompt,
    input_images: [],
    aspect_ratio: options.aspectRatio || "16:9",
  };
  if (options.resolution) body.resolution = options.resolution;
  if (options.seed) body.seed = options.seed;

  const result = await apiPost(modelId, body);
  const requestId = result.request_id || result.id || result.requestId;

  if (!requestId) {
    console.log("  Response:", JSON.stringify(result, null, 2));
    logGeneration({ type: "image", model, name, prompt, result });
    return result;
  }

  console.log(`  Request ID: ${requestId}`);
  console.log("  Polling for completion...");

  const final = await pollUntilDone(requestId);

  // Try to extract and download the image URL
  const imageUrl =
    final.output?.url ||
    final.result?.url ||
    final.results?.raw?.url ||
    final.output?.image_url ||
    final.url ||
    (final.output?.images && final.output.images[0]?.url) ||
    (final.results && final.results[0]?.url);

  if (imageUrl) {
    ensureOutputDir();
    const ext = imageUrl.includes(".png") ? "png" : "jpg";
    const filepath = resolve(OUTPUT_DIR, `${name}.${ext}`);
    await downloadFile(imageUrl, filepath);
    console.log(`  Saved: ${filepath}`);
    logGeneration({ type: "image", model, name, prompt, requestId, imageUrl, filepath });
    return { ...final, localPath: filepath };
  }

  console.log("  Completed but could not extract image URL. Full response:");
  console.log(JSON.stringify(final, null, 2));
  logGeneration({ type: "image", model, name, prompt, requestId, result: final });
  return final;
}

async function editImage(prompt, options = {}) {
  const model = options.model || "nano-banana";
  const modelId = MODELS[model] || model;
  const name = options.name || `edit-${Date.now()}`;
  const refPath = options.ref;

  if (!refPath || !existsSync(refPath)) {
    console.error("ERROR: --ref <path> is required for edit mode and must point to an existing file.");
    process.exit(1);
  }

  console.log(`\nEditing image with ${model}...`);
  console.log(`  Reference: ${refPath}`);
  console.log(`  Prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? "..." : ""}"`);

  const body = {
    prompt,
    input_images: [imageToDataUrl(resolve(refPath))],
    aspect_ratio: options.aspectRatio || "16:9",
  };

  const result = await apiPost(modelId, body);
  const requestId = result.request_id || result.id || result.requestId;

  if (!requestId) {
    console.log("  Response:", JSON.stringify(result, null, 2));
    logGeneration({ type: "edit", model, name, prompt, ref: refPath, result });
    return result;
  }

  console.log(`  Request ID: ${requestId}`);
  console.log("  Polling for completion...");

  const final = await pollUntilDone(requestId);

  const imageUrl =
    final.output?.url ||
    final.result?.url ||
    final.results?.raw?.url ||
    final.url ||
    (final.output?.images && final.output.images[0]?.url);

  if (imageUrl) {
    ensureOutputDir();
    const ext = imageUrl.includes(".png") ? "png" : "jpg";
    const filepath = resolve(OUTPUT_DIR, `${name}.${ext}`);
    await downloadFile(imageUrl, filepath);
    console.log(`  Saved: ${filepath}`);
    logGeneration({ type: "edit", model, name, prompt, ref: refPath, requestId, imageUrl, filepath });
    return { ...final, localPath: filepath };
  }

  console.log("  Completed. Full response:");
  console.log(JSON.stringify(final, null, 2));
  logGeneration({ type: "edit", model, name, prompt, ref: refPath, requestId, result: final });
  return final;
}

async function generateVideo(prompt, options = {}) {
  const model = options.model || "kling";
  const modelId = MODELS[model] || model;
  const name = options.name || `video-${Date.now()}`;
  const imagePath = options.image;
  const endImagePath = options.endImage;

  if (!imagePath || !existsSync(imagePath)) {
    console.error("ERROR: --image <path> is required for video mode.");
    process.exit(1);
  }

  console.log(`\nGenerating video with ${model}...`);
  console.log(`  Start image: ${imagePath}`);
  if (endImagePath) console.log(`  End image: ${endImagePath}`);
  console.log(`  Prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? "..." : ""}"`);

  const body = {
    prompt,
    input_image: imageToDataUrl(resolve(imagePath)),
  };

  if (endImagePath && existsSync(endImagePath)) {
    body.end_image = imageToDataUrl(resolve(endImagePath));
  }
  if (options.duration) body.duration = parseInt(options.duration);

  const result = await apiPost(modelId, body);
  const requestId = result.request_id || result.id || result.requestId;

  if (!requestId) {
    console.log("  Response:", JSON.stringify(result, null, 2));
    logGeneration({ type: "video", model, name, prompt, image: imagePath, result });
    return result;
  }

  console.log(`  Request ID: ${requestId}`);
  console.log("  Polling for completion (videos take longer — up to 5 min)...");

  const final = await pollUntilDone(requestId, 600000); // 10 min timeout for video

  const videoUrl =
    final.output?.url ||
    final.result?.url ||
    final.results?.raw?.url ||
    final.url ||
    (final.output?.video_url) ||
    (final.output?.videos && final.output.videos[0]?.url);

  if (videoUrl) {
    ensureOutputDir();
    const filepath = resolve(OUTPUT_DIR, `${name}.mp4`);
    await downloadFile(videoUrl, filepath);
    console.log(`  Saved: ${filepath}`);
    logGeneration({ type: "video", model, name, prompt, image: imagePath, requestId, videoUrl, filepath });
    return { ...final, localPath: filepath };
  }

  console.log("  Completed. Full response:");
  console.log(JSON.stringify(final, null, 2));
  logGeneration({ type: "video", model, name, prompt, image: imagePath, requestId, result: final });
  return final;
}

async function showStatus(requestId) {
  console.log(`\nChecking status for ${requestId}...`);
  const status = await checkStatus(requestId);
  console.log(JSON.stringify(status, null, 2));
  return status;
}

function listGenerations() {
  const log = loadLog();
  if (log.length === 0) {
    console.log("\nNo generations yet.");
    return;
  }
  console.log(`\n${log.length} generation(s):\n`);
  for (const entry of log.slice(-20)) {
    const status = entry.filepath ? "SAVED" : entry.requestId ? "SUBMITTED" : "UNKNOWN";
    console.log(`  [${status}] ${entry.type} | ${entry.model} | ${entry.name}`);
    if (entry.filepath) console.log(`           ${entry.filepath}`);
    if (entry.requestId) console.log(`           Request: ${entry.requestId}`);
    console.log(`           ${entry.timestamp}`);
  }
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

function parseArgs(args) {
  const flags = {};
  const positional = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      // Check if next arg is a value (not another flag)
      if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        flags[key] = args[i + 1];
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(args[i]);
    }
  }

  return { flags, positional };
}

async function main() {
  const { flags, positional } = parseArgs(process.argv.slice(2));
  const command = positional[0];
  const prompt = positional.slice(1).join(" ");

  const options = {
    model: flags.model || flags.m,
    name: flags.name || flags.n,
    aspectRatio: flags.aspect || flags.a,
    resolution: flags.size || flags.s || flags.resolution,
    seed: flags.seed,
    ref: flags.ref || flags.r,
    image: flags.image || flags.i,
    endImage: flags["end-image"] || flags.e,
    duration: flags.duration || flags.d,
  };

  switch (command) {
    case "image":
    case "img":
      if (!prompt) { console.error("Usage: higgsfield.mjs image \"prompt\" [--model nano-banana] [--name filename] [--aspect 16:9]"); process.exit(1); }
      await generateImage(prompt, options);
      break;

    case "edit":
      if (!prompt) { console.error("Usage: higgsfield.mjs edit \"prompt\" --ref input.png [--model nano-banana] [--name filename]"); process.exit(1); }
      await editImage(prompt, options);
      break;

    case "video":
    case "vid":
      if (!prompt) { console.error("Usage: higgsfield.mjs video \"prompt\" --image start.png [--end-image end.png] [--model kling] [--name filename]"); process.exit(1); }
      await generateVideo(prompt, options);
      break;

    case "status":
      if (!prompt && !positional[1]) { console.error("Usage: higgsfield.mjs status <request_id>"); process.exit(1); }
      await showStatus(positional[1] || prompt);
      break;

    case "list":
    case "ls":
      listGenerations();
      break;

    case "models":
      console.log("\nAvailable models:\n");
      console.log("  Text-to-image / Image-to-image:");
      console.log("    nano-banana  (default) Nano Banana — fast, great quality, edit with references");
      console.log("");
      console.log("  Image-to-video:");
      console.log("    kling        (default) Kling — cinematic animations");
      console.log("    soul         Higgsfield Soul/DOP — their native video model");
      break;

    default:
      console.log(`
Higgsfield AI Tool — Generate images & videos for 3D scroll animations

Commands:
  image <prompt>   Generate image with Nano Banana 2 (or --model nano-banana-pro)
  edit <prompt>    Edit image with reference (--ref input.png)
  video <prompt>   Generate video from image (--image start.png [--end-image end.png])
  status <id>      Check generation status
  list             Show recent generations
  models           List available models

Options:
  --model, -m      Model to use (see 'models' command)
  --name, -n       Output filename (without extension)
  --aspect, -a     Aspect ratio (16:9, 9:16, 1:1, 4:3, etc.)
  --size, -s       Resolution (512, 1K, 2K, 4K)
  --ref, -r        Reference image path (for edit mode)
  --image, -i      Start image path (for video mode)
  --end-image, -e  End image path (for video mode)
  --duration, -d   Video duration in seconds
  --seed           Seed for reproducibility

Examples:
  # Generate START frame for scroll animation
  node tools/higgsfield.mjs image "Photorealistic cross-section of a complete residential roof system, white background, studio lighting" --name roof-assembled --size 2K

  # Generate END frame (deconstructed) using START as reference
  node tools/higgsfield.mjs edit "Exploded view showing all layers separated and floating" --ref .tmp/higgsfield/roof-assembled.jpg --name roof-exploded

  # Create transition video for scroll animation
  node tools/higgsfield.mjs video "Smooth transition from assembled to exploded view" --image .tmp/higgsfield/roof-assembled.jpg --end-image .tmp/higgsfield/roof-exploded.jpg --name roof-transition

Output saved to: .tmp/higgsfield/
      `);
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
