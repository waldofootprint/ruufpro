# Apple UI Design Spec for Widget Implementation

Research date: March 29, 2026
Sources: apple.com/shop (iPhone & Mac configurators), apple.com/apple-card, Apple HIG typography docs, Apple CSS analysis

---

## 1. Typography System

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif;
```

**Key insight:** Apple uses "SF Pro Display" for sizes >= 20px and "SF Pro Text" for sizes < 20px. On the web, `-apple-system` handles this automatically on Apple devices. For cross-platform, use `Inter` as the closest match — it was designed to mimic SF Pro's metrics.

### Type Scale (from Apple's actual CSS)

| Role | Desktop | Tablet | Mobile | Weight | Letter-spacing | Line-height |
|------|---------|--------|--------|--------|---------------|-------------|
| Display/Hero | 48px | 40px | 32px | 600 | -0.003em | 1.08 |
| Section Title | 32px | 28px | 24px | 600 | 0.004em | 1.125 |
| Card Title | 21px | 21px | 19px | 600 | 0.011em | 1.19 |
| Body | 17px | 17px | 17px | 400 | -0.022em | 1.47 |
| Body (tight) | 14px | 14px | 14px | 400 | -0.016em | 1.42 |
| Caption/Label | 12px | 12px | 12px | 400 | -0.01em | 1.33 |
| Eyebrow/Tag | 12px | 12px | 12px | 600 | 0.06em (uppercase) | 1.33 |

### Critical Typography Details
- **Negative letter-spacing at large sizes** — this is what makes Apple text feel "tight and premium." At 48px, use `-0.003em`. At 17px body, use `-0.022em`.
- **Semibold (600), not bold (700)** — Apple almost never uses true bold. Headings are 600. Body is 400. That's the entire weight range for most UI.
- **Tight line-heights** — 1.08 for headlines is extremely tight. Body at 1.47 gives breathing room. This contrast creates the "Apple feel."

### Responsive Breakpoints (from Apple's CSS)
```css
/* Desktop: > 1068px */
/* Tablet: 735px - 1068px */
/* Mobile: < 735px */
```

---

## 2. Color Palette

### Text Colors
```css
--apple-text-primary:    #1d1d1f;   /* Almost black — NOT pure #000 */
--apple-text-secondary:  #6e6e73;   /* Medium gray for descriptions */
--apple-text-tertiary:   #86868b;   /* Light gray for captions/metadata */
--apple-text-link:       #0066cc;   /* Link blue (slightly darker than CTA) */
```

### Background Colors
```css
--apple-bg-primary:      #ffffff;   /* Main content */
--apple-bg-secondary:    #f5f5f7;   /* Section alternating backgrounds */
--apple-bg-tertiary:     #fbfbfd;   /* Subtle card backgrounds */
--apple-bg-elevated:     #ffffff;   /* Cards floating on gray bg */
```

### Interactive Colors
```css
--apple-blue:            #0071e3;   /* Primary CTA blue */
--apple-blue-hover:      #0077ed;   /* Blue hover state */
--apple-blue-active:     #006edb;   /* Blue pressed state */
--apple-green:           #34c759;   /* Success/confirmation */
--apple-orange:          #ff9500;   /* Badges, "NEW" tags */
--apple-red:             #ff3b30;   /* Errors, destructive actions */
```

### Border & Separator Colors
```css
--apple-border-light:    #d2d2d7;   /* Default borders */
--apple-border-selected: #0071e3;   /* Selected state border (blue) */
--apple-separator:       #e8e8ed;   /* Horizontal rules, dividers */
--apple-separator-light: rgba(0, 0, 0, 0.04); /* Very subtle separators */
```

### Shadows
```css
--apple-shadow-card:     0 2px 8px rgba(0, 0, 0, 0.04), 0 0 1px rgba(0, 0, 0, 0.04);
--apple-shadow-elevated: 0 4px 16px rgba(0, 0, 0, 0.12);
--apple-shadow-modal:    0 8px 40px rgba(0, 0, 0, 0.18);
```

### Key Color Insights
- **Never use pure black (#000)** — Apple uses `#1d1d1f` for primary text. This is softer on the eyes and feels more premium.
- **Gray text is `#6e6e73`** — not a generic `#666` or `#888`. This specific gray has a very slight warm/purple undertone.
- **The blue (`#0071e3`) is distinctive** — it's slightly more saturated and darker than Bootstrap/generic blue. It reads as confident, not playful.
- **`#f5f5f7` is the signature Apple gray background** — memorize this. It's everywhere. Slightly cooler than `#f5f5f5`.

---

## 3. Button Styles

### Primary CTA Button (e.g., "Buy", "Continue", "Apply now")
```css
.apple-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #0071e3;
  color: #ffffff;
  border: none;
  border-radius: 980px;          /* "Pill" shape — this is Apple's signature */
  padding: 8px 22px;
  font-size: 17px;
  font-weight: 400;              /* NOT bold — regular weight on buttons */
  letter-spacing: -0.022em;
  line-height: 1.17647;
  min-width: 28px;
  min-height: 44px;              /* Touch target */
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.1s ease;
}

.apple-btn-primary:hover {
  background-color: #0077ed;
}

.apple-btn-primary:active {
  background-color: #006edb;
  transform: scale(0.98);        /* Subtle press effect */
}
```

### Secondary/Outline Button (e.g., "Learn more", "Take a closer look")
```css
.apple-btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  color: #0071e3;
  border: none;
  border-radius: 980px;
  padding: 8px 22px;
  font-size: 17px;
  font-weight: 400;
  letter-spacing: -0.022em;
  line-height: 1.17647;
  min-height: 44px;
  cursor: pointer;
}

.apple-btn-secondary:hover {
  text-decoration: underline;
}
```

### Compact Button (smaller contexts)
```css
.apple-btn-compact {
  border-radius: 980px;
  padding: 4px 16px;
  font-size: 14px;
  min-height: 32px;
}
```

### Critical Button Details
- **Pill-shaped (border-radius: 980px)** — NOT rounded rectangle. This is the #1 differentiator. Apple uses an absurdly large border-radius to create perfect pills.
- **Font-weight 400 on buttons** — counterintuitive but accurate. Apple's CTA text is regular weight. The blue background provides enough emphasis.
- **44px minimum touch target** — matches Apple HIG accessibility requirement.
- **Transitions are 0.3s ease** — never instant, never slow. Apple's standard timing.

---

## 4. Selection Cards (Product/Option Configurator)

### Option Card (e.g., choosing storage, color, model)
```css
.apple-option-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 16px 20px;
  border: 2px solid #d2d2d7;
  border-radius: 12px;
  background: #ffffff;
  cursor: pointer;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  text-align: center;
  min-height: 80px;
  position: relative;
}

.apple-option-card:hover {
  border-color: #86868b;
}

.apple-option-card.selected {
  border-color: #0071e3;
  box-shadow: 0 0 0 1px #0071e3;   /* Double-border effect */
}
```

### Selection Card Details
- **2px border, not 1px** — thicker borders make selection state more visible
- **12px border-radius** — NOT pill, NOT sharp. Specific rounded rectangle for cards.
- **Selected = blue border + matching inset shadow** — creates a "double border" effect. The border goes blue AND there's a 1px box-shadow in the same blue.
- **No background color change on selection** — the border does all the work
- **No checkmark icon by default** — Apple relies purely on the blue border to indicate selection

### Color Swatch Selection
```css
.apple-color-swatch {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease;
  position: relative;
}

.apple-color-swatch::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 2px solid transparent;
  transition: border-color 0.2s ease;
}

.apple-color-swatch.selected::after {
  border-color: #0071e3;
}

.apple-color-swatch:hover {
  transform: scale(1.1);
}
```

### Large Selection Tile (e.g., model comparison card)
```css
.apple-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 24px;
  border: 2px solid transparent;
  border-radius: 18px;
  background: #f5f5f7;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  gap: 12px;
}

.apple-tile:hover {
  background: #e8e8ed;
}

.apple-tile.selected {
  border-color: #0071e3;
  background: #ffffff;
  box-shadow: 0 0 0 1px #0071e3;
}
```

---

## 5. Form Inputs

### Text Input
```css
.apple-input {
  width: 100%;
  padding: 18px 16px 6px;        /* Extra top padding for floating label */
  border: 1px solid #d2d2d7;
  border-radius: 12px;
  font-size: 17px;
  font-weight: 400;
  color: #1d1d1f;
  background: #ffffff;
  outline: none;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  -webkit-appearance: none;
}

.apple-input:focus {
  border-color: #0071e3;
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.3);  /* Blue focus ring */
}

.apple-input:hover:not(:focus) {
  border-color: #86868b;
}

.apple-input::placeholder {
  color: #86868b;
  font-weight: 400;
}
```

### Floating Label
```css
.apple-label {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 17px;
  color: #86868b;
  pointer-events: none;
  transition: all 0.2s ease;
}

.apple-input:focus + .apple-label,
.apple-input:not(:placeholder-shown) + .apple-label {
  top: 8px;
  transform: translateY(0);
  font-size: 12px;
  color: #6e6e73;
}
```

### Key Input Details
- **12px border-radius on inputs** — matches card border-radius, creating system consistency
- **Blue focus ring with 3px spread** — `rgba(0, 113, 227, 0.3)` not a full blue outline. The glow effect is softer.
- **17px font-size in inputs** — prevents iOS zoom on focus (requires >= 16px) while matching body text scale
- **Floating labels** — Apple uses floating labels in their account/checkout forms, not placeholder-only

---

## 6. Spacing System

### Apple's Spacing Scale
```css
--space-2:   2px;
--space-4:   4px;
--space-8:   8px;
--space-12:  12px;
--space-16:  16px;
--space-20:  20px;
--space-24:  24px;
--space-32:  32px;
--space-40:  40px;
--space-48:  48px;
--space-64:  64px;
--space-80:  80px;
```

### Contextual Spacing
```css
/* Between form fields */
gap: 16px;

/* Between option cards in a row */
gap: 12px;

/* Between sections/groups of options */
margin-bottom: 32px;

/* Section title to first element */
margin-bottom: 12px;

/* Page-level section padding */
padding: 48px 0;   /* Desktop */
padding: 32px 0;   /* Mobile */

/* Max content width */
max-width: 980px;   /* Standard Apple content width */
margin: 0 auto;
padding-left: 22px;
padding-right: 22px;
```

### Key Spacing Insights
- **Generous whitespace between sections** (48-80px) but tight spacing within groups (12-16px). This contrast creates visual hierarchy through space alone.
- **22px horizontal page padding** — not 16, not 24. Apple uses 22px.
- **980px max-width** for content — narrower than most sites (1200px). This forces focus.

---

## 7. Progress & Navigation Patterns

### Step Indicator (Apple Checkout Style)
```css
.apple-progress {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0 22px;
}

.apple-progress-step {
  font-size: 12px;
  font-weight: 400;
  color: #6e6e73;
  letter-spacing: -0.01em;
}

.apple-progress-step.active {
  color: #1d1d1f;
  font-weight: 600;
}

.apple-progress-separator {
  width: 8px;
  height: 8px;
  margin: 0 8px;
  /* Small chevron ">" character or SVG */
  color: #d2d2d7;
}
```

### Key Navigation Details
- **Apple uses breadcrumb-style progress**, not numbered steps or progress bars
- **Chevron separators** between steps, not dots or lines
- **Active step is semibold dark, inactive is regular gray** — no background highlights on steps
- **No numbered circles** — Apple avoids making users count

---

## 8. Animations & Transitions

### Standard Timing
```css
/* Default transition for all interactive elements */
transition: all 0.3s ease;

/* Fast feedback (press states) */
transition: transform 0.1s ease;

/* Color/opacity changes */
transition: opacity 0.3s ease, color 0.3s ease;

/* Page section reveals (scroll-triggered) */
transition: opacity 0.6s ease, transform 0.6s ease;

/* Modal appearance */
transition: opacity 0.3s ease, transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
```

### Scroll Reveal Animation
```css
.apple-reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.apple-reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### Key Animation Principles
- **0.3s is the default** — everything uses 300ms unless it needs to feel faster or more dramatic
- **ease, not ease-in-out** — Apple predominantly uses `ease` (fast start, slow end) for most transitions
- **Subtle scale on press** — `transform: scale(0.98)` on button active state (barely perceptible but feels responsive)
- **No bounce, no overshoot** — Apple animations are always smooth and resolved. Never springy on web.
- **20px translateY for reveals** — not 40px, not 10px. Subtle enough to feel smooth, enough to notice.

---

## 9. What Makes It "Apple" vs Just "Minimal"

### The 8 Differentiators

1. **Pill buttons, not rounded rectangles.** `border-radius: 980px` on CTAs. This single detail instantly reads as Apple.

2. **#1d1d1f, not #000000.** Pure black is harsh. Apple's near-black is softer, warmer, more legible.

3. **Negative letter-spacing on everything.** Body text: `-0.022em`. Headlines: `-0.003em`. This "tightness" is the Apple typography signature. Generic clean designs use default tracking.

4. **Semibold (600), never bold (700).** Apple's headings whisper authority. They don't shout. Bold feels heavy and try-hard by comparison.

5. **Blue borders for selection, not fills.** When you select an option, the card gets a blue border — not a blue background, not a checkmark, not a highlight. Just a precise blue outline with a matching 1px box-shadow to create thickness.

6. **#f5f5f7, the Apple gray.** This exact background gray is cooler and more "digital" than warm grays. It's a tiny detail but using `#f5f5f5` or `#f0f0f0` feels different.

7. **980px content width.** Narrower than convention. Forces your eye down the center. Creates the feeling of focused simplicity even on wide screens.

8. **Whitespace does the hierarchy work.** Apple puts 48-80px between sections but only 12-16px within groups. This ratio is much more extreme than most designs, which use maybe 32px between sections and 12px within. The gap between "a lot of space" and "a little space" is what creates Apple's characteristic rhythm.

### The Combined Effect

None of these individually scream "Apple." It's the **combination and consistency** that creates the effect:
- Every border-radius is either 980px (pill) or 12px (card) or 50% (circle). No 4px, no 8px, no 16px.
- Every text color is either `#1d1d1f`, `#6e6e73`, or `#86868b`. Three grays. That's it.
- Every interactive blue is `#0071e3`. One blue. No gradients, no variations.
- Every transition is `0.3s ease`. One timing. Predictable, reliable.

This **aggressive constraint** is what creates premium feeling. Fewer values, applied consistently, everywhere.

---

## 10. Widget-Specific Application Guide

For building a multi-step estimate widget in the Apple style:

### Step Container
```css
.widget-step {
  max-width: 600px;
  margin: 0 auto;
  padding: 32px 22px;
}
```

### Step Title
```css
.widget-step-title {
  font-size: 32px;
  font-weight: 600;
  letter-spacing: 0.004em;
  line-height: 1.125;
  color: #1d1d1f;
  margin-bottom: 8px;
}
```

### Step Description
```css
.widget-step-description {
  font-size: 17px;
  font-weight: 400;
  letter-spacing: -0.022em;
  line-height: 1.47;
  color: #6e6e73;
  margin-bottom: 32px;
}
```

### Option Grid
```css
.widget-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 32px;
}
```

### Option Card
```css
.widget-option {
  padding: 16px;
  border: 2px solid #d2d2d7;
  border-radius: 12px;
  background: #ffffff;
  cursor: pointer;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  text-align: center;
}

.widget-option:hover {
  border-color: #86868b;
}

.widget-option.selected {
  border-color: #0071e3;
  box-shadow: 0 0 0 1px #0071e3;
}

.widget-option-label {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 4px;
}

.widget-option-detail {
  font-size: 12px;
  color: #6e6e73;
}
```

### Continue Button
```css
.widget-continue {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 16px 24px;
  background-color: #0071e3;
  color: #ffffff;
  border: none;
  border-radius: 980px;
  font-size: 17px;
  font-weight: 400;
  letter-spacing: -0.022em;
  min-height: 50px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.1s ease;
}

.widget-continue:hover {
  background-color: #0077ed;
}

.widget-continue:active {
  background-color: #006edb;
  transform: scale(0.98);
}

.widget-continue:disabled {
  background-color: #d2d2d7;
  color: #86868b;
  cursor: not-allowed;
  transform: none;
}
```

### Back Link
```css
.widget-back {
  font-size: 17px;
  font-weight: 400;
  color: #0071e3;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 0;
  margin-bottom: 24px;
  letter-spacing: -0.022em;
}

.widget-back:hover {
  text-decoration: underline;
}
```

### Address/Text Input
```css
.widget-input-group {
  position: relative;
  margin-bottom: 16px;
}

.widget-input {
  width: 100%;
  padding: 24px 16px 8px;
  border: 1px solid #d2d2d7;
  border-radius: 12px;
  font-size: 17px;
  color: #1d1d1f;
  background: #ffffff;
  outline: none;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.widget-input:focus {
  border-color: #0071e3;
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.3);
}

.widget-input-label {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 17px;
  color: #86868b;
  pointer-events: none;
  transition: all 0.2s ease;
}

.widget-input:focus + .widget-input-label,
.widget-input:not(:placeholder-shown) + .widget-input-label {
  top: 12px;
  transform: translateY(0);
  font-size: 12px;
}
```

### Step Transition Animation
```css
.widget-step-enter {
  opacity: 0;
  transform: translateX(20px);
}

.widget-step-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.widget-step-exit {
  opacity: 1;
  transform: translateX(0);
}

.widget-step-exit-active {
  opacity: 0;
  transform: translateX(-20px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}
```

---

## Quick Reference: The Apple CSS Cheat Sheet

```
COLORS:
  Text primary:     #1d1d1f
  Text secondary:   #6e6e73
  Text tertiary:    #86868b
  CTA blue:         #0071e3
  Background:       #f5f5f7
  Border:           #d2d2d7
  Separator:        #e8e8ed
  Success:          #34c759
  Warning:          #ff9500
  Error:            #ff3b30

BORDER-RADIUS:
  Pill/Button:      980px
  Card/Input:       12px
  Large tile:       18px
  Circle:           50%

TYPOGRAPHY:
  Font:             -apple-system, "SF Pro Display", "Helvetica Neue", sans-serif
  Heading weight:   600
  Body weight:      400
  Body size:        17px
  Body tracking:    -0.022em
  Heading tracking: -0.003em to 0.004em

SPACING:
  Page padding:     22px
  Content width:    980px
  Section gap:      48-80px
  Group gap:        12-16px
  Card gap:         12px

TRANSITIONS:
  Default:          0.3s ease
  Press:            0.1s ease (scale 0.98)
  Reveal:           0.6s ease (translateY 20px)

SHADOWS:
  Card:             0 2px 8px rgba(0,0,0,0.04)
  Elevated:         0 4px 16px rgba(0,0,0,0.12)
  Modal:            0 8px 40px rgba(0,0,0,0.18)
```
