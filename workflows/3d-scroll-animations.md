# 3D Scroll Animation Workflow

> **Purpose:** Step-by-step process for creating scroll-driven 3D animations using Nano Banana 2.0 (image generation) + Kling (video generation) + Claude Code (frame extraction + scroll component). This doc evolves with every generation — treat it as the playbook.

---

## The Pipeline

```
1. Nano Banana → Generate START frame
2. Nano Banana → Generate END frame (using START as reference)
3. Kling → Create transition video (START → END or END → START)
4. FFmpeg → Extract frames (30fps → ~150 frames for 5sec video)
5. Claude Code → Build scroll-driven canvas component
6. Integrate into template → Test + polish
```

**Tools:**
- `tools/higgsfield.mjs` — CLI for Higgsfield API (image, edit, video, status, list)
- FFmpeg — frame extraction (`ffmpeg -i video.mp4 -vf "fps=30" frames/frame-%04d.jpg`)
- cwebp — optional WEBP conversion (not always smaller than JPG)
- Scroll component — `components/scroll-animation.tsx`

**Output location:** `.tmp/higgsfield/` for working files, `public/animations/` for production frames

**HARD RULE #1:** Never fire any Higgsfield API call without Hannah's explicit approval. Show prompt + settings first, wait for "go."

**HARD RULE #2:** Never request a batch size greater than 1. Always generate exactly ONE image or video per API call. No batch generation, no variations, no num_images > 1. One at a time, always.

---

## Prompt Component Library

Every prompt is assembled from interchangeable modules. When one module improves, every future prompt benefits. Swap components to adapt for different templates/backgrounds/moods.

### STYLE modules (pick one)
| ID | Component | Best for |
|---|---|---|
| S1 | `Clean 3D architectural render` | Light backgrounds, clean product-shot feel. Our proven winner. |
| S2 | `Isometric 3D architectural model` | Could work for more technical/blueprint feel. UNTESTED. |
| S3 | `Soft clay render with subtle material textures` | Trendy minimal look, very scroll-animation friendly. UNTESTED. |
| S4 | `Dark cinematic 3D render with rim lighting` | Dark backgrounds (Chalkboard, Forge). UNTESTED. |
| S5 | `Technical architectural illustration` | Blueprint/schematic feel for educational animations. UNTESTED. |

### SUBJECT modules (pick one)
| ID | Component | Notes |
|---|---|---|
| SB1 | `beautiful single-story Florida-style home with a dark charcoal hip roof, stucco exterior in warm cream, arched entryway` | Our proven Florida house. Works for FL market. |
| SB2 | `modern two-story home with dark architectural shingle roof, stone and siding exterior` | Northeast/Midwest look. For future markets. |
| SB3 | `Spanish-style home with terracotta barrel tile roof, white stucco walls` | Southwest/SoCal market. UNTESTED. |

### LIGHTING modules (pick one)
| ID | Component | Best for |
|---|---|---|
| L1 | `Soft diffused studio lighting, gentle shadow beneath the home` | Light backgrounds. Our proven winner. |
| L2 | `Dramatic side lighting with soft shadows, subtle rim light on edges` | Dark backgrounds — makes the house pop. UNTESTED. |
| L3 | `Warm golden hour lighting from the left, long soft shadows` | Aspirational/emotional feel. Risk: may look harsh. UNTESTED. |

### BACKGROUND modules (pick one)
| ID | Component | Template |
|---|---|---|
| BG1 | `Solid flat light gray (#F7F8FA) background` | Modern Clean |
| BG2 | `Solid flat dark charcoal (#2A2D2A) background` | Chalkboard |
| BG3 | `Solid flat near-black (#0D0D0D) background` | Forge |

### COMPOSITION modules (pick one)
| ID | Component | Notes |
|---|---|---|
| C1 | `Slightly elevated 3/4 camera angle so the roof is prominently visible. The home is centered with breathing room on both sides.` | Our proven winner. |
| C2 | `Direct front-facing elevation view, symmetrical composition` | Architectural drawing feel. UNTESTED. |
| C3 | `Bird's-eye 3/4 angle looking down at the roofline` | Maximum roof visibility. UNTESTED. |

### ENVIRONMENT modules (always include)
| ID | Component | Notes |
|---|---|---|
| E1 | `No landscaping, no driveway, no environment. The home floats cleanly.` | Always use. Proven. |

### NEGATIVE modules (always include)
| ID | Component | Notes |
|---|---|---|
| N1 | `Absolutely no text, no numbers, no letters, no symbols, no watermarks anywhere in the image. No people.` | Always use. Prevents artifacts. |

### QUALITY modules (always include)
| ID | Component | Notes |
|---|---|---|
| Q1 | `Architectural visualization quality, soft materials, clean geometry.` | Works for all styles. |

### How to assemble a prompt
```
[STYLE] of a [SUBJECT]. [LIGHTING] [ENVIRONMENT] on a [BACKGROUND]. [COMPOSITION] [QUALITY] [NEGATIVE]
```

**Example (Modern Clean assembled house):**
```
[S1] of a [SB1]. [L1] [E1] on a [BG1]. [C1] [Q1] [N1]
```

Expands to:
```
Clean 3D architectural render of a beautiful single-story Florida-style home with a dark charcoal hip roof, stucco exterior in warm cream, arched entryway. Soft diffused studio lighting, gentle shadow beneath the home. No landscaping, no driveway, no environment. The home floats cleanly on a solid flat light gray (#F7F8FA) background. Slightly elevated 3/4 camera angle so the roof is prominently visible. The home is centered with breathing room on both sides. Architectural visualization quality, soft materials, clean geometry. Absolutely no text, no numbers, no letters, no symbols, no watermarks anywhere in the image. No people.
```

**For Chalkboard, swap only what changes:**
```
[S4] of a [SB1]. [L2] [E1] on a [BG2]. [C1] [Q1] [N1]
```

---

## Generation Scoring Rubric

Score every generation 1-10 on each dimension. Track scores in the generation log.

| Dimension | 1 (Fail) | 5 (Acceptable) | 10 (Perfect) |
|---|---|---|---|
| **Style Consistency** | Looks nothing like the reference | Same general vibe but noticeable differences | Indistinguishable style from reference |
| **Background Cleanliness** | Sky, trees, gradients bleeding in | Mostly clean with minor color drift | Perfectly solid, exact hex match |
| **Composition** | House fills/overflows frame, cut off | Centered but tight, minor breathing room | Perfectly centered, generous breathing room, roof prominent |
| **Artifact-Free** | Text, numbers, symbols visible | Minor imperfections on close inspection | Completely clean at full resolution |
| **Scroll-Animation-Ready** | Objects would confuse Kling (ambiguous shapes, too many pieces) | Workable but some objects may misplace | Clean, distinct objects with obvious placement positions |
| **Emotional Impact** | Looks generic, forgettable | Professional, would work on a website | Genuinely impressive, scroll-stopping, "how did they do this?" |

**Scoring shorthand for log entries:** `[S:8 B:9 C:7 A:10 R:8 E:9] = 8.5 avg`
- S = Style, B = Background, C = Composition, A = Artifacts, R = Scroll-Ready, E = Emotional Impact

---

## Creative Decision Framework

For every animation, document the strategic reasoning — not just what we did, but WHY. This transfers across templates.

### Questions to answer before generating:

1. **What is this animation saying?** (What message does the homeowner receive?)
2. **Where does it live in the page flow?** (What comes before and after it?)
3. **What emotion should the scroll trigger?** (Trust? Awe? Curiosity? Confidence?)
4. **What should the visitor do after seeing it?** (Request estimate? Keep scrolling? Call?)
5. **Why this direction over the reverse?** (Assembly vs explosion, reveal vs build)

### Creative reasoning log:

**Modern Clean — "Assembly" animation:**
- **Message:** "We know exactly what goes into your roof, layer by layer."
- **Flow:** Services → Animation → Estimate Widget. The animation bridges "here's what we do" and "now give us your info."
- **Emotion:** Trust through transparency. The homeowner watches complexity resolve into simplicity — chaos becomes order. That's what a good roofer does.
- **Post-animation action:** Request an estimate. They just saw the craftsmanship, now they want the price.
- **Direction (deconstructed → assembled):** Starts with attention-grabbing chaos (floating materials = "what is this?"), ends on aspirational completion (beautiful home = "I want that"). Ending on the finished product is psychologically satisfying and primes the CTA. The reverse (explosion) would end on destruction — wrong emotion before asking for money.

**Chalkboard — TBD:**
- Dark background changes the psychology. Floating materials on dark = dramatic, almost theatrical. Could lean into the "craft" metaphor — "roofing is an art."
- Consider: Does the same house work on dark? Or does the mood shift demand a different subject/angle?
- Hypothesis: Rim-lit materials on dark background would look like a movie poster. Could be even more scroll-stopping than the light version.

**Forge — TBD:**
- Near-black, blue accent. Industrial, bold. The animation should feel powerful, not delicate.
- Consider: Could materials assemble with more force/speed? Or does slow-and-steady work universally?
- Hypothesis: Same assembly concept but with dramatic lighting could feel like a product launch video.

---

## Nano Banana — Proven Patterns

### What produces clean results

| Pattern | Example | Why it works |
|---|---|---|
| **"Clean 3D architectural render"** | Opens every prompt | Sets the style consistently — soft materials, clean geometry, no photorealism uncanny valley |
| **"Soft diffused studio lighting"** | Lighting instruction | Prevents harsh shadows that look out of place on flat backgrounds. "Dramatic" or "Florida sunlight" = harsh |
| **"Solid flat light gray (#F7F8FA) background"** | Background color | Hex code + "solid flat" prevents gradient skies or environmental bleed |
| **"Same style and camera angle as reference image"** | Reference consistency | Nano Banana respects reference images well for angle/style but needs explicit instruction |
| **"No text, no numbers, no letters, no symbols, no watermarks"** | Artifact prevention | MUST include — Nano Banana will render random numbers/text without this |
| **Remove environment entirely** | "No landscaping, no driveway, no environment" | Realistic landscaping on flat backgrounds = bad Photoshop look. Floating house = intentional |
| **"Breathing room on both sides"** | Composition | Prevents house from touching frame edges |
| **"The home floats cleanly"** | Explicit float instruction | Reinforces no-ground-plane look |

### What causes problems

| Problem | Cause | Fix |
|---|---|---|
| **Random "1 1 1" or numbers appear** | Nano Banana renders text artifacts if not explicitly told not to | Add "Absolutely no text, no numbers, no letters, no symbols, no watermarks" |
| **House fills entire frame / touches edges** | "Tight camera angle" or "fills most of the frame" | Use "centered with breathing room" instead. Don't say "tight." |
| **Harsh lighting / looks hot** | "Bright warm Florida sunlight" or any directional lighting | Use "soft diffused studio lighting" always |
| **Landscaping looks photoshopped** | Plants + driveway on flat background = uncanny | Remove ALL environment. Floating house looks intentional. |
| **Background isn't matching** | Sky/trees bleed in | Include hex code AND "solid flat" AND "no sky, no trees behind" |
| **Too plain/boxy architecture** | Simple prompt = simple house | Add specific architectural details (multi-hip roofline, arched entry, etc.) but don't overload |

### Style discovery: 3D render > photorealistic

**Key learning (April 2 2026):** Photorealistic houses isolated on flat backgrounds look like bad cutouts. 3D architectural renders look *intentional* and premium. The style mismatch between "real photo" and "flat background" creates uncanny valley. "Clean 3D render" avoids this entirely.

For scroll animations specifically, 3D renders also transition better in Kling because the consistent material/lighting style gives Kling less to hallucinate about.

### Reference image behavior

- Nano Banana strongly follows reference images for: camera angle, house proportions, overall style, color palette
- It does NOT perfectly follow: fine architectural details, exact window placement, material textures
- Best practice: generate START frame first (no reference), then use START as reference for END frame to maintain consistency

---

## Kling — Proven Patterns

### What produces clean transitions

| Pattern | Example | Why it works |
|---|---|---|
| **Simple directional movement** | "drift inward", "dissolve from front to back" | Kling handles linear/directional motion well |
| **"No camera movement, no rotation"** | Every prompt | Prevents Kling from adding cinematic camera sweeps that break scroll feel |
| **Explicit "walls remain solid"** | Structural instruction | Prevents Kling from morphing the entire house |
| **"Steady and satisfying"** | Pacing instruction | Prevents jerky or rushed transitions |
| **"No text, no numbers, no artifacts"** | Cleanup | Prevents Kling from introducing its own artifacts |

### What causes problems

| Problem | Cause | Fix |
|---|---|---|
| **Materials go to wrong positions** | Kling doesn't understand construction/architecture | Don't remove materials — find a better representation. See "Insulation lesson" below. |
| **Pink insulation becomes a pipe** | Kling saw pink object + house = pipe | DON'T just remove insulation — it's a real roofing component. Instead: (1) show insulation as flat sheets/layers instead of rolls, (2) pre-place insulation on the decking in the START frame so only shingles need to move, or (3) use a simpler shape Kling can place intuitively. Removing real components undermines the "we know roofing" message. |
| **Objects morph instead of moving** | Too many objects OR complex shapes | Fewer, simpler floating objects. Quality > quantity. |
| **Camera slowly rotates** | Kling's default cinematic tendency | Add "No camera movement, no rotation" explicitly |

### Settings

- **Duration:** 5 seconds (optimal — 150 frames at 30fps, ~7.5MB JPG)
- **Multi-shot:** Always OFF (creates cuts that break scroll continuity)
- **Resolution:** Default 1080p (sufficient for scroll animation)
- **Start/End frames:** Always provide BOTH for controlled transitions

### Direction matters

**Deconstructed → Assembled** works better than Assembled → Deconstructed because:
1. More visually interesting to START on (attention-grabbing chaos)
2. Ends on aspirational image (completed home) → leads naturally into CTA
3. Kling is better at "things coming together" than "things flying apart" (assembly has a natural endpoint; explosion is open-ended)

---

## Frame Extraction — Process

```bash
# Extract at 30fps as JPG (smaller than WEBP in our tests)
mkdir -p .tmp/higgsfield/frames
ffmpeg -i .tmp/higgsfield/video.mp4 -vf "fps=30" .tmp/higgsfield/frames/frame-%04d.jpg

# Copy to public for serving
mkdir -p public/animations/{animation-name}
cp .tmp/higgsfield/frames/frame-*.jpg public/animations/{animation-name}/
```

**File size benchmarks (5sec video, 30fps):**
- 151 JPG frames: ~7.5MB total (~50KB/frame)
- 151 WEBP frames: ~8.6MB total (WEBP was NOT smaller in our test — skip conversion)
- Stick with JPG unless future tests show otherwise

---

## Scroll Component — Design Notes

**Component:** `components/scroll-animation.tsx`

**Architecture:**
- Preloads all frames into Image objects
- Uses HTML5 Canvas to render current frame (faster than swapping img.src)
- requestAnimationFrame + scroll listener maps scroll position → frame index
- Sticky container keeps canvas centered during scroll
- First 10 frames loaded with high priority for fast initial render

**Design (per high-end-visual-design + design-taste-frontend skills):**
- Macro whitespace section (300vh scroll height = slow, deliberate)
- Sora display font + DM Sans body font (matches Modern Clean theme)
- Opening headline fades out as animation begins (opacity tied to scroll progress)
- Closing subheadline fades in near end of animation
- Thin progress bar at top of section (accent color, 50% opacity)
- Minimal loading state: thin bar + percentage in small uppercase text
- All transitions use cubic-bezier easing, no linear

**Placement in template:**
- Between Services and Estimate Widget (the "trust bridge")
- Educates homeowner about roof construction before asking for their info
- Opening text: "See what goes into your roof."
- Closing text: "Quality you can trust. Layer by layer."

**Props:**
```tsx
framePath: string      // "/animations/roof-build"
frameCount: number     // 151
scrollHeight: string   // "300vh"
bgColor: string        // Match template section bg
headline: string       // Opening text
subheadline: string    // Closing text
accentColor: string    // Match template accent
fontDisplay: string    // Match template display font
fontBody: string       // Match template body font
```

---

## Generation Log

### Generation 1 — "Assembled house, photorealistic"
- **Modules:** Photorealistic (no style module) + SB2-ish + harsh lighting + BG1 attempt + landscaping
- **Prompt:** Photorealistic exterior, dark gray shingle roof, 3/4 angle, copper accents, well-maintained landscaping, light gray background
- **Result:** Beautiful house BUT real sky/trees bled in, heavy landscaping, looked like Midwest not Florida
- **Score:** `[S:— B:3 C:6 A:8 R:4 E:5] = 5.2 avg`
- **Learning:** Photorealistic + flat background = bad Photoshop feel. Need to specify "no sky, no trees behind"
- **Decision:** Pivot to Florida-specific architecture for market fit

### Generation 2 — "Florida house, photorealistic"
- **Modules:** Photorealistic + SB1 (first Florida attempt) + "bright warm Florida sunlight" + BG1 + partial environment
- **Prompt:** Added Florida-specific (hip roof, stucco, palms, pavers), "solid flat light gray background", "no sky, no trees behind"
- **Result:** Great Florida house, background mostly clean. BUT plants + driveway still look out of place on flat bg. Lighting too harsh.
- **Score:** `[S:— B:6 C:7 A:8 R:5 E:6] = 6.4 avg`
- **Learning:** Removing sky isn't enough — all ground-level environment also fights with flat backgrounds. Soft lighting >> directional lighting.
- **Decision:** Hannah identified the core issue — environment + flat bg = uncanny. Led to "what style should this be?" conversation → 3D render breakthrough.

### Generation 3 — "Florida house, 3D render" ⭐ WINNER (Assembled frame)
- **Modules:** S1 + SB1 + L1 + BG1 + E1 + C1 + Q1 + N1
- **Prompt:** "Clean 3D architectural render", removed ALL environment, "soft diffused studio lighting", "no landscaping, no driveway, no environment", "the home floats cleanly"
- **Result:** Clean, intentional, premium. No uncanny valley. Roof prominent. Looks like architectural visualization.
- **Score:** `[S:9 B:8 C:8 A:9 R:9 E:8] = 8.5 avg`
- **Learning:** 3D render style is the answer for flat-background animations. Floating house = intentional design choice, not bad cutout.
- **Decision:** This is our base house. All future frames reference this. Saved as `Version 3.png`.

### Generation 4 — "X-ray reveal" (END frame variant)
- **Modules:** S1 + SB1 (reference) + L1 + BG1 + C1 + Q1 + N1 + custom X-ray instruction
- **Prompt:** Used V3 as reference. "Roof is now transparent X-ray style revealing structural system — rafters, OSB decking, underlayment, insulation"
- **Result:** Strong consistency with V3. Front section exposed, sides retain shingles. Educational and impressive.
- **Score:** `[S:9 B:8 C:8 A:8 R:7 E:8] = 8.0 avg`
- **Learning:** Nano Banana maintains style/angle well from reference images. Partial reveal (not full exposure) actually looks better. 
- **Decision:** Good result but pivoted away from X-ray concept toward exploded materials for more dynamic scroll animation.

### Generation 5 — "Exploded materials" (START frame for assembly animation)
- **Modules:** S1 + SB1 (reference, no roof) + L1 + BG1 + C1 + Q1 + N1 + floating materials
- **Prompt:** "Bare walls and no roof. Dozens of roofing components float suspended in the air — shingles, rafters, OSB decking, insulation, flashing, ridge cap"
- **Result:** Not yet scored — prompt refined to remove insulation based on Kling Generation 1 learning
- **Score:** Pending
- **Decision:** Remove insulation from floating materials — Kling can't place it correctly

### Kling Generation 1 — "Assembly transition"
- **Start:** Exploded materials frame (with insulation)
- **End:** V3 (assembled house)
- **Prompt:** Materials drift inward and assemble onto house. No camera movement.
- **Result:** Good overall assembly BUT pink insulation became a pipe along the side of the house. Other materials settled reasonably.
- **Score:** `[S:7 B:8 C:8 A:6 R:— E:7] = 7.2 avg` (A docked for insulation-pipe artifact)
- **Learning:** Kling doesn't understand building construction. Places objects by visual intuition, not structural logic. Materials with obvious "home" positions (shingles → roof surface, rafters → angled structure) work. Ambiguous materials (insulation → could go anywhere) get misplaced.
- **Decision:** Don't remove insulation — find better representation. Flat sheets instead of rolls.

### Nano Banana Generation 6 — "Hero scattered materials" ⭐ Frame A
- **Modules:** S1 + modified SB1 (no roof) + L1 + BG (#FFFFFF) + modified C1 (below center) + Q1 + N1
- **Prompt:** 15-20 components floating above house, scattered at varying heights, house below center
- **Result:** Excellent. ~15 distinct pieces clearly separated. House below center. Materials in tight halo above roofline. Interior rooms visible through open top.
- **Score:** `[S:9 B:9 C:8 A:10 R:9 E:9] = 9.0 avg`
- **Decision:** This is our Frame A. Generate Frame B using this as reference.

### Nano Banana Generation 7 — "Hero complete house" ⭐ Frame B
- **Prompt:** "Same home, same exact position, roof fully complete" using Frame A as reference
- **Result:** Excellent match. Same position, same angle. Complete roof with dark charcoal shingles, hip lines, copper accents.
- **Score:** `[S:9 B:9 C:9 A:10 R:9 E:8] = 9.0 avg`
- **Decision:** Frame pair is ready for Kling.

### Kling Generation 2 — "Hero assembly with ordered sequence"
- **Start:** hero-scattered-v1.png (Frame A)
- **End:** hero-complete-v1.png (Frame B)
- **Prompt:** Materials descend, rafters first → decking → shingles bottom-to-top → ridge caps last. Quick but precise.
- **Result:** Overall quality is good. THREE specific problems:
  1. **Insulation lands flat, pierced by rafters** — 3 tiny pink pieces land horizontally in the middle of the roof, ignoring the slope. They sit ON TOP of rafters/panels instead of between them.
  2. **Random wood pieces only cover some rafters** — 2 pieces of decking land over a few rafters but leave others exposed. Inconsistent coverage.
  3. **Shingles still build from bottom up** — despite asking for them to "appear from above and land below," Kling defaulted to its own interpretation of shingling (which happens to be physically correct for real roofing, but looks like materializing not flying in).
- **Score:** `[S:8 B:9 C:9 A:5 R:— E:7] = 7.6 avg` (A docked hard for misplaced insulation and partial decking)
- **Learning:** 
  1. Kling does NOT follow construction-order choreography. Describing "rafters first, then decking, then shingles" doesn't work — it places things simultaneously or in its own order.
  2. Kling interprets "tile into rows from bottom to top" as a materializing/growing effect, not pieces flying in from above.
  3. We need to understand the REAL roofing build sequence deeply and describe the VISUAL MOTION we want, not the construction order. Kling thinks in motion, not in construction logic.
- **Decision:** Go to plan mode. Research actual roof construction sequence. Rewrite Kling prompt to describe VISUAL MOVEMENT precisely, not construction terminology.

---

## Template-Specific Plans

### Modern Clean (light bg #F7F8FA)
- **Status:** In progress
- **Animation:** Exploded materials → Assembled home
- **Placement:** Between Services and Estimate Widget
- **Text:** "See what goes into your roof." → "Quality you can trust. Layer by layer."
- **Fonts:** Sora display, DM Sans body
- **Accent:** #1E3A5F (navy)

### Chalkboard (dark bg #2A2D2A)
- **Status:** Not started
- **Concept:** TBD — dark background opens different possibilities (glowing edges, dramatic lighting on materials)
- **Note:** Background hex must change to match. Lighting in Nano Banana prompt needs adjustment for dark theme.

### Forge (dark bg #0D0D0D)
- **Status:** Not started
- **Concept:** TBD — near-black background, blue accent (#2E5090). Could do dramatic spotlight on materials.

---

## Prompt Templates (Copy-Paste Ready)

### Base START frame (assembled house)
```
Clean 3D architectural render of a beautiful single-story Florida-style home with a dark charcoal hip roof, stucco exterior in warm cream, arched entryway. Soft diffused studio lighting, gentle shadow beneath the home. No landscaping, no driveway, no environment. The home floats cleanly on a solid flat light gray (#F7F8FA) background. Slightly elevated 3/4 camera angle so the roof is prominently visible. Architectural visualization quality, soft materials, clean geometry. Absolutely no text, no numbers, no letters, no symbols, no watermarks anywhere in the image. No people.
```

### Base END frame — exploded (upload assembled as reference)
```
Same 3D rendered Florida-style home, same angle, same soft lighting, same light gray (#F7F8FA) background. The roof is completely missing — bare walls with open top. Roofing components float suspended in the air around the house — dark charcoal shingles, wooden rafters, sheets of OSB decking, copper flashing pieces, and ridge cap sections. Materials are scattered at varying distances and angles around the home as if frozen mid-explosion. Same style as reference image. Absolutely no text, no numbers, no letters, no symbols, no watermarks anywhere in the image. No people. No insulation.
```

### Base Kling prompt — assembly (exploded → assembled)
```
All floating roofing materials — shingles, rafters, decking, flashing — smoothly drift inward and assemble onto the house, building a complete roof layer by layer. Movement is steady and satisfying, each piece settling into its correct position with purpose. Walls remain solid and unchanged throughout. No camera movement, no rotation. No text, no numbers, no letters, no symbols, no watermarks, no artifacts.
```

### Base Kling prompt — explosion (assembled → exploded)
```
The completed roof suddenly begins to separate — shingles, rafters, decking, and flashing lift off the house and float outward in all directions, scattering into the air as if frozen mid-explosion. Movement starts slow then accelerates slightly. Walls remain solid and unchanged throughout. No camera movement, no rotation. No text, no numbers, no letters, no symbols, no watermarks, no artifacts.
```

---

## Reference Videos — Key Techniques Learned

### Video 1 (ZfYvv-0l9NA) — "4 websites in 15 minutes"
- Uses a "taste skill" (Leon's repo) for high-end design principles — one-shot premium websites
- Kling 3.0 on Higgsfield for video generation — 16:9 aspect ratio, 5 seconds, 1080p
- Videos used as **hero background** with inward masking gradient so edges blend with site
- Multiple animations per site (rotating globes, exploded products, interior panning)
- Key technique: **background video hero** — animation fills hero area, content overlays on top with glass/gradient treatment
- Cost: ~$3-5 total per site (Kling credits + Claude Code tokens)

### Video 2 (TZUTe7s11-I) — "Premium websites with Nano Banana 2"
- Brand extraction via Firecrawl before building (grab real company colors/assets)
- Nano Banana 2 for image generation — 16:9 aspect ratio
- Process: generate START frame → generate END frame (using START as reference) → Kling for transition
- Key technique: **exploded/deconstructed product views** — show internals, then reassemble
- Used Claude to help write the Kling prompt from the start/end frames
- Emphasis on mobile responsiveness and SEO from the start

### Video 3 (q0TgUtj6vIs) — "Apple-style 3D scroll websites" (MOST RELEVANT)
- Recreated Apple's product page style — scroll reveals product, dynamic text, deconstruction
- **The actual scroll mechanism:** Video extracted to ~120+ WEBP frames, each frame mapped to a scroll position. Scrolling forward = playing video, scrolling back = reversing.
- Process: Nano Banana generates start frame + end frame → Kling animates between them → Claude Code extracts frames → builds scroll-driven animation
- **Key insight: TWO videos per product** — one for deconstruction (opening up), one for reconstruction (closing back). Two separate Kling generations, played in sequence on scroll.
- Used Claude in **plan mode first** before building — results in much better first-try websites
- Background should be plain (all black or all white) with no shadows, no hands, no reflections
- Key technique: **the video IS the product showcase** — the scroll animation replaces static hero images entirely

### Key Takeaways Applied to Our Workflow
1. **Aspect ratio matters:** Always 16:9 for hero/horizontal layouts. Our phone-sized result was wrong aspect ratio in Kling.
2. **Background matching is critical:** "Plain all black background" or "plain all white background" — no shadows, no reflections
3. **Two videos can be chained:** Deconstruct → reconstruct as two separate scroll sequences
4. **Use Claude to write Kling prompts:** Give it the start + end frames and describe desired motion
5. **Plan mode before building:** Design the full layout before generating any assets
6. **Masking gradients on edges:** When video fills hero, use inward gradient mask so edges blend with site background

## Open Questions

- Can we use Kling's start+end image mode with MORE than 5 seconds for smoother/slower transitions?
- Does Nano Banana handle dark backgrounds (#2A2D2A, #0D0D0D) as cleanly as light gray?
- Would isometric angle work better than 3/4 for certain templates?
- Can we get Kling to handle more complex material placement if we simplify to only 2-3 material types?
- Should we generate TWO videos per template (explode + assemble) for a longer scroll sequence?
- What's the right Kling aspect ratio for full-width hero (16:9) vs half-width (4:3 or 1:1)?
