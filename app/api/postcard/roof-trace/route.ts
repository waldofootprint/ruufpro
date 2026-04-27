import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-5";

const SYSTEM_PROMPT = `You are an expert at reading top-down satellite imagery of residential roofs in Florida. You trace the roof of the primary house using the provided tool. Trace only the primary building. Ignore neighbors, sheds, screened pool enclosures (translucent diamond-grid structures), driveways, and landscaping.`;

const TOOL_SCHEMA = {
  name: "report_roof_trace",
  description: "Report the traced geometry of the primary house's roof in the satellite image.",
  input_schema: {
    type: "object",
    required: [
      "image_size",
      "primary_building_visible",
      "footprint",
      "planes",
      "pitch_estimate",
      "roof_type",
      "roof_color_hex",
      "notes",
    ],
    properties: {
      image_size: {
        type: "array",
        description: "[width_px, height_px] of the source image",
        items: { type: "integer" },
        minItems: 2,
        maxItems: 2,
      },
      primary_building_visible: { type: "boolean" },
      footprint: {
        type: "array",
        description: "Outer eave outline polygon, clockwise as seen from above. Image-pixel coords, top-left origin.",
        items: {
          type: "array",
          items: { type: "number" },
          minItems: 2,
          maxItems: 2,
        },
        minItems: 3,
      },
      planes: {
        type: "array",
        description:
          "Each flat tilted roof plane as an ordered (clockwise) polygon. Every plane must include at least one 'ridge' or 'hip_end' vertex and at least two 'eave' vertices. Simple gable = 2 planes; simple hip = 4 planes; L-shape hip = 6-8 planes.",
        items: {
          type: "object",
          required: ["id", "vertices"],
          properties: {
            id: { type: "string" },
            vertices: {
              type: "array",
              minItems: 3,
              items: {
                type: "object",
                required: ["x", "y", "kind"],
                properties: {
                  x: { type: "number" },
                  y: { type: "number" },
                  kind: { type: "string", enum: ["eave", "ridge", "hip_end"] },
                },
              },
            },
          },
        },
      },
      pitch_estimate: {
        type: "string",
        enum: ["low", "medium", "high"],
        description: "low ≈ 3:12 (nearly flat), medium ≈ 5:12 (typical FL hip), high ≈ 8:12 (steep)",
      },
      roof_type: {
        type: "string",
        enum: ["hip", "gable", "complex", "flat"],
      },
      roof_color_hex: { type: "string" },
      notes: { type: "string", description: "One sentence on what's distinctive about this roof." },
    },
  },
};

const USER_PROMPT = `Trace the roof of the primary house in this satellite image. Use the report_roof_trace tool.`;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address")?.trim();
  if (!address) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  const gKey = process.env.GOOGLE_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const aKey = process.env.ANTHROPIC_API_KEY;
  if (!gKey) return NextResponse.json({ error: "GOOGLE_API_KEY not set" }, { status: 500 });
  if (!aKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });

  const zoom = searchParams.get("zoom") ?? "20";
  const satUrl =
    `https://maps.googleapis.com/maps/api/staticmap?` +
    `center=${encodeURIComponent(address)}` +
    `&zoom=${zoom}&size=640x640&maptype=satellite&scale=2&key=${gKey}`;

  const satResp = await fetch(satUrl, { cache: "no-store" });
  if (!satResp.ok) {
    return NextResponse.json(
      { error: "satellite_fetch_failed", status: satResp.status },
      { status: 502 }
    );
  }
  const satBytes = Buffer.from(await satResp.arrayBuffer());
  const satB64 = satBytes.toString("base64");
  const mediaType = satResp.headers.get("content-type") ?? "image/png";

  const claudeResp = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": aKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: [TOOL_SCHEMA],
      tool_choice: { type: "tool", name: TOOL_SCHEMA.name },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: satB64,
              },
            },
            { type: "text", text: USER_PROMPT },
          ],
        },
      ],
    }),
  });

  if (!claudeResp.ok) {
    const body = await claudeResp.text();
    return NextResponse.json(
      { error: "claude_call_failed", status: claudeResp.status, body: body.slice(0, 500) },
      { status: 502 }
    );
  }

  const claudeJson = await claudeResp.json();
  const toolUse = claudeJson?.content?.find((c: any) => c.type === "tool_use");
  const trace = toolUse?.input ?? null;

  if (!trace) {
    return NextResponse.json(
      {
        address,
        model: MODEL,
        usage: claudeJson?.usage ?? null,
        trace: null,
        error: "no_tool_use_in_response",
        stop_reason: claudeJson?.stop_reason,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    address,
    model: MODEL,
    usage: claudeJson?.usage ?? null,
    trace,
  });
}
