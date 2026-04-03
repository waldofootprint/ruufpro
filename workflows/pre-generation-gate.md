# Pre-Generation Gate

**Standard process before ANY 3D image or video generation. 5 phases. Every phase completes before a credit is spent.**

This applies to all Higgsfield work — Nano Banana images, Kling videos, any AI generation that costs credits.

---

## Phase 1: Intent + Outcome

Define what we're making and what success looks like.

**Intent (answer all 6):**
1. **What** is this asset? (hero image, video frames, section background, etc.)
2. **Where** does it live on the page?
3. **What aspect ratio and resolution?** (16:9, 1:1, etc.)
4. **Image or video?** If video, how many seconds?
5. **What emotion** should the viewer feel? (awe, trust, curiosity, calm, energy)
6. **What action** does the visitor take AFTER seeing this?

**Expected Outcome (write BEFORE generating):**
- **Success looks like:** (specific description of a perfect result)
- **Acceptable looks like:** (what issues we'd live with)
- **Failure looks like:** (what would make us re-generate)
- **Min score:** 7.5+ average on 6-dimension rubric
- **Plan B:** (if this fails, fallback approach)

---

## Phase 2: Layout First

Build the **code component** that will hold this asset BEFORE generating it.

- Set exact dimensions, background color, responsive behavior
- Preview on localhost with a placeholder (gray box, existing frame, wireframe)
- Verify: does the layout work with a placeholder?

**This prevents:** Wrong aspect ratio, wrong composition, wrong size — all mistakes that waste credits.

**Output:** Working placeholder on localhost + Technical spec (exact pixel dimensions, hex background, aspect ratio).

---

## Phase 3: Vision Alignment

Ask specific questions across 4 categories. Use binary "more like A or B?" comparisons with reference images when possible.

| Category | Example Questions |
|----------|-----------------|
| Subject/Style | "3D render or photorealistic? Floating or grounded? Light or dark?" |
| Composition | "Centered or off-center? How much breathing room? What's in the foreground?" |
| Motion (video only) | "Describe the movement like you're watching it. Fast or slow? Smooth or snappy?" |
| Mood | "Show me a website/video/image that feels like what you want." |

**Key rule:** Don't just ask "does this sound good?" — ask "what am I missing from your vision?"

**Output:** Vision Brief in the user's own words. Both people have the SAME mental image before anything fires.

---

## Phase 4: Prompt + Settings

### Prompt Assembly
Assemble from the **Prompt Component Library** in `workflows/3d-scroll-animations.md` — not freehand. Pick modules:
- Style (S1-S5)
- Subject (SB1-SB3)
- Lighting (L1-L3)
- Background (BG1-BG3)
- Composition
- Environment
- Negative
- Quality

### Prompt Checklist (must pass ALL)
1. Specifies aspect ratio?
2. Background color as exact hex?
3. "Nothing touches any edge" included?
4. Negative prompt comprehensive? (no text, numbers, watermarks, people)
5. Matches Technical Layout Spec from Phase 2?
6. **Video:** describes VISUAL MOVEMENT, not construction terminology?
7. **Video:** specifies what does NOT move?
8. Avoids known failure modes from generation log?
9. Would a stranger reading this prompt picture the same thing described in Phase 3?

### Settings Verification (confirm ALL)
- Model (Nano Banana 2.0 / Kling 3.0)
- Aspect ratio
- Resolution
- Duration (video)
- Multi-shot toggle (video — usually OFF)
- Reference image(s) attached?
- File naming convention decided

**HARD RULE:** User confirms prompt + settings before any credit is spent. No exceptions.

---

## Phase 5: Generate + Score

NOW spend the credit. Immediately after receiving the result:

1. **Score** on all 6 rubric dimensions (1-10 each):
   - **S** — Style Consistency
   - **B** — Background Cleanliness
   - **C** — Composition
   - **A** — Artifact-Free
   - **R** — Scroll-Animation-Ready
   - **E** — Emotional Impact

2. **Compare** to Expected Outcome from Phase 1

3. **Decision tree:**
   - Score >= 7.5 AND matches vision → **Proceed**
   - Score >= 7.5 BUT something feels off → **Discuss** (don't re-generate yet)
   - Score < 7.5 → **Diagnose** which dimension(s) failed, update prompt, go back to Phase 4

---

## Quick Reference

```
Phase 1: Intent + Outcome    → What are we making? What does success look like?
Phase 2: Layout First        → Build the container before generating the content
Phase 3: Vision Alignment    → Both people see the same thing in their heads
Phase 4: Prompt + Settings   → Assemble from library, stress-test, confirm
Phase 5: Generate + Score    → Spend the credit, score immediately, decide next step
```

**The whole point:** Phases 1-4 cost zero credits. All creative decisions happen before spending.
