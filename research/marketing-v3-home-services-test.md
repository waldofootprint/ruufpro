# RuufPro Marketing V3 Prototype — Home Services SaaS Design Audit

**Reviewed by:** Veteran home services SaaS design perspective (15+ years)
**Date:** March 27, 2026
**File reviewed:** `marketing-v3-prototype-v2.html`

---

## TEST 1: Contractor Psychology

### Does this page feel designed for contractors or tech people?

It leans toward **tech-forward SaaS** more than contractor-friendly. Here is why:

**Signals that say "tech company":**
- **Dark hero section.** The dark navy (#0B1120) with radial gradient glow and floating glassmorphism badges reads as Y Combinator demo day, not "roofing tool." Jobber and Housecall Pro both use bright, warm, approachable hero sections. Contractors associate dark UIs with complexity — the opposite of what they want.
- **Plus Jakarta Sans + DM Sans.** These are startup fonts. They are clean and modern, but they carry zero trade-industry warmth. Jobber uses a rounded, friendly typeface. Housecall Pro uses approachable sans-serifs with generous weight. The font pairing here says "designed by a designer," not "built for a roofer."
- **The phone mockup is CSS art, not a real screenshot.** It looks like a wireframe, not a real product. Contractors need to see something they recognize as a real website. The tiny 8-9px text inside the mockup is unreadable and feels like a placeholder.
- **Floating glassmorphism badges** with backdrop-filter blur — this is a design trend that impresses other designers. A roofer scrolling on their phone will not register these as information; they will register them as visual noise.
- **Scroll reveal animations on every section.** These add a polished feel for portfolio reviews but create the impression of "slow loading" on mid-range phones. Contractors want information immediately, not revealed to them with dramatic timing.
- **The word "satellite imagery" without showing it.** A roofer wants to SEE the satellite view of a roof. That is the "wow" moment. Right now it is just words.

**Signals that say "for contractors" (good):**
- The headline "Stop losing jobs to roofers with better websites" — this is excellent. It speaks directly to their competitive anxiety.
- "Your phone rings more" as the core promise — perfect.
- The "What's the catch?" section — this mirrors exactly how roofers talk. Great instinct.
- Trust badges below hero CTA: "Free. Not a trial." / "No credit card ever" / "Live in minutes" — these are the right objection-killers.
- The before/after cards in the problem section use language roofers actually say.

### Would a roofer scrolling on their phone feel "this is for me"?

**Partially.** The copy says "this is for you." The visual design says "this is for someone who reads TechCrunch." There is a disconnect between the language (which is excellent) and the visual identity (which is too polished-startup).

**How Jobber and Housecall Pro make contractors feel welcome:**
- Light, bright backgrounds from the top of the page
- Real photos of real tradespeople (not illustrations or mockups)
- Product screenshots that look like actual software, not wireframes
- Larger, bolder text with more whitespace
- Color palettes that feel warm and grounded, not cool and techy

---

## TEST 2: The "Free" Problem

### Does this page overcome "free" skepticism effectively?

**It is about 70% of the way there.** The copy strategy is correct — the "What's the catch?" section is the best section on the page. But the visual treatment undermines the copy in several places:

**Where trust breaks down:**

1. **No faces, no names, no proof.** The Hannah W. founder quote is good, but it is a single initial in a purple circle. That is not a face. That is not trust. Roofers trust people they can see. Every successful home services SaaS site puts real human faces front and center. Jobber's homepage has named customers with photos and revenue numbers. Roofr has video testimonials. This page has zero social proof from actual users. For a product claiming to be free, the absence of ANY user evidence is a red flag for a skeptical roofer.

2. **The proof bar uses industry stats, not product stats.** "78% of homeowners want pricing before calling" is interesting but does not prove RuufPro works. It proves the market exists. A skeptical roofer does not care about the market — they care whether THIS TOOL actually gets results. Even pre-launch, you could show: number of sites created, a beta tester quote, or a screenshot of a real lead notification.

3. **The business model explanation is buried in paragraph text.** The "What's the catch?" answer is three paragraphs. A roofer scanning on their phone will read the first sentence and move on. The actual answer — "We make money on the optional widget at $99/mo" — should be the FIRST thing they see in that section, not the third paragraph.

4. **"Free" appears too many times.** Counting the word "free" across the page: it appears in the hero, hero trust badges, solution section, why-free section, features section, pricing section, pricing note, final CTA, and trust line. That is 15+ instances. When you say "free" that many times, a skeptical contractor starts thinking "they're trying too hard." Jobber's free tier page says "free" maybe 4-5 times. Less repetition, more confidence.

**How successful freemium home services tools handle this:**
- **Jobber** lets you START a free trial immediately (email in the hero). They do not spend the page explaining why it is free. The product speaks for itself.
- **Roofr** puts "Start for free" in the hero and moves on. They surround it with social proof (reviews, G2 badges, case studies) so the "free" feels like confidence, not desperation.
- The pattern: **show, don't explain.** The more you explain why something is free, the more suspicious it feels. Show the product being real (screenshots, live demos, user evidence) and "free" becomes an obvious good deal rather than a question mark.

---

## TEST 3: Mobile-First Reality Check

### Section-by-Section Phone Grade (375px screen)

**Nav: B+**
- Good: Hides nav links on mobile, keeps logo + login + CTA.
- Issue: The "Start Free" CTA in the nav is 13px font in a small pill. On a 375px screen, that is a very small touch target. Should be at least 44px tall per Apple's HIG.
- The nav bar with backdrop blur and rounded corners will look fine on modern iPhones but may render with visible lag on budget Android devices due to backdrop-filter.

**Hero: C+**
- 36px headline on mobile is good — readable and punchy.
- BUT: The phone mockup stacks below the text, meaning the roofer scrolls through the entire headline + subhead + two stacked buttons + trust badges before seeing any visual. That is 3+ full thumb-scrolls of text before the product preview. Too much.
- The stacked buttons (btn-main + btn-ghost) are full-width which is correct, but there is no breathing room between them and the trust badges. Feels cramped.
- The floating badges are hidden on mobile (good call), but that means the "$0 setup" and "<5 min" data points are lost entirely. Those should be worked into the mobile layout differently.

**Proof Bar: B-**
- On mobile with dividers hidden and gap reduced to 24px, the three stats will stack vertically. Readable.
- However: the proof-num at 20px and proof-label at 12px with max-width 160px creates very cramped stat blocks. The labels may wrap awkwardly on small screens.
- The dark background makes this feel like an extension of the hero, which is fine, but the visual break between hero and proof bar is almost invisible on mobile.

**Problem Section: B**
- 32px heading on mobile is readable.
- The before/after cards stack to single column — good.
- 14px list items with 18px icons are well-sized for mobile reading.
- Issue: 72px vertical padding on mobile (from the responsive override) is generous. Combined with the heading, paragraph, and two stacked cards, this section is very long on mobile. A roofer will scroll through it for 4-5 thumb-scrolls.

**Solution Section: B+**
- Centered text, clean CTA. Works well on mobile.
- The gradient text on the h2 may have rendering issues on some Android browsers (WebKit gradient clip is inconsistent on older Android WebViews).

**Why Free Section: C**
- The two-column layout collapses to single column, which means: heading, three paragraphs, THEN the bullet list, THEN the callout quote, THEN the founder card. On mobile this is an extremely long section. Six to eight thumb-scrolls of content before reaching the next section.
- The founder card uses inline styles with a 52px avatar circle. On a 375px screen with 24px side padding, this will work but feels tight.
- No CTA in this section. A roofer who is convinced by "What's the catch?" has nowhere to click without scrolling further.

**How It Works: B**
- The two-column layout (steps + description) collapsing to single column works.
- The step dots at 40px with hover states are adequate touch targets.
- The "<5 min" badge at the bottom of the left column will appear at the top on mobile (before the steps), which is slightly confusing — you see the total time before the breakdown.

**Features: C+**
- Three-column grid becomes single column. Each feature card at 28px padding is fine.
- BUT: six feature cards stacked vertically with scroll-reveal animations (each with increasing delay up to 0.5s) means the roofer scrolls through this section watching cards fade in one by one. On a mid-range Android, this will feel sluggish. The staggered delays (reveal-delay-1 through reveal-delay-5) will fire simultaneously once the section enters the viewport, creating a cascade effect that feels performant on desktop but creates a "loading" impression on mobile.
- The CTA below the features grid is inside the grid container with an inline style. It may not align correctly after the single-column stack.

**Google/Estimate Widget Section: B**
- Clean on mobile. The comparison cards stacking works well.
- The 32px price text in the comparison cards is punchy and readable.

**Pricing: B**
- Two pricing cards stack to single column. Good.
- "Recommended" badge on the Pro card may overlap with the card above it in the stacked layout since it uses absolute positioning with top: -12px.

**FAQ: A-**
- Accordion pattern is inherently mobile-friendly.
- 15px question text, 24px padding — good touch targets for the question toggles.
- The max-height transition for answers is smooth enough.
- Seven FAQ items is a lot of scrolling, but the collapsed state keeps it manageable.

**Final CTA: B+**
- Clean, focused, one CTA. Works well on mobile.
- 44px heading at 32px mobile + 16px body + CTA button. Tight, effective.

**Footer: B**
- Stacks to column layout. Standard, functional.

### Overall Mobile Grade: C+

The page is technically responsive but not truly mobile-first. A mobile-first page would front-load the product visual, minimize scroll distance to CTAs, and strip out animations that create perceived lag on budget devices.

### Animation Performance Concern

The `backdrop-filter: blur(20px)` on the nav and `backdrop-filter: blur(16px)` on the floating hero badges will cause jank on mid-range Android phones (Samsung A-series, Motorola G-series — which is what many contractors carry). These are GPU-intensive CSS properties. On the nav, which is fixed-position and overlays ALL scroll content, this will create noticeable frame drops during scroll.

---

## TEST 4: Speed to "Aha"

### How quickly does a roofer understand what they are getting?

**On desktop:** About 2 seconds. The headline is clear, the subhead explains it, and the phone mockup is visible in the hero. Good.

**On mobile:** About 8-10 seconds of scrolling. The headline is immediately clear, but the phone mockup (the product preview) is below the fold by several scrolls. The roofer reads headline, subhead, two buttons, three trust badges, then scrolls to see... a tiny CSS mockup that does not look like a real product. The "aha" is delayed AND underwhelming when it arrives.

### How many scrolls until they see the PRODUCT?

- **Desktop:** Zero scrolls — it is in the hero (but it is a mockup, not a real screenshot).
- **Mobile:** 2-3 scrolls past the hero text to reach the phone mockup.
- **A real product screenshot:** Never. The "demo" section (`demo-placeholder`) is just a placeholder div with text "Interactive demo preview — coming soon" (or similar). There is no live example visible on the page at all. The "See a live example" button in the hero presumably links to something, but the page itself does not show the product.

### Comparison to competitors:

- **ServiceTitan:** Shows the actual product UI (dispatch screen, customer view) immediately in the hero. Real screenshots, not mockups.
- **Roofr:** Has an email signup right in the hero — the "aha" is "I can start right now."
- **Housecall Pro:** Shows the actual app on a phone with a real interface in the hero.
- **Jobber:** Product screenshot embedded in the hero, real UI visible.

### Is the phone mockup compelling enough?

**No.** The phone mockup is built entirely in CSS with fake content ("Summit Roofing Co." with 8-10px text). It has three problems:

1. **It does not look real.** No real photos, no real testimonials section, no real contact form visible. It looks like a wireframe, which signals "this product is not built yet."
2. **The text inside is unreadable.** At 8-9px, no one can read the content in the phone screen, especially on mobile. If they cannot read it, it is just a colored rectangle.
3. **It does not show the OUTCOME.** The mockup shows a generic website. It should show the moment a roofer cares about: a lead notification coming in, a homeowner filling out the contact form, or the estimate widget in action.

**Recommendation:** Replace the CSS mockup with a real screenshot of an actual RuufPro site (even a beta one), or at minimum a high-fidelity design comp that is embedded as an image. The phone frame can stay, but the content inside must look real.

---

## TEST 5: Competitive Credibility

### Side by side with Roofr.com, would a roofer think both companies are equally real?

**No.** And it is not close. Here is the gap:

| Signal | Roofr | RuufPro |
|--------|-------|-----------|
| Named customer testimonials with revenue numbers | Yes ($52K, $2.5M) | None |
| G2/Capterra badges | Yes (4.7 stars, 1,000+ reviews) | None |
| Video testimonials | Yes | None |
| Real product screenshots | Yes (multiple) | CSS mockup |
| Team/about page | Yes | Founder initial only |
| Phone number or chat | Yes | None |
| Case studies | Yes (named companies) | None |
| "Used by X roofers" counter | Yes | None |
| Integration logos | Yes | None |

### What is missing to feel like a funded, established company?

1. **Any form of social proof from real users.** Even one named beta tester with a real photo and a one-sentence quote would change the perception dramatically.
2. **A real product screenshot.** The CSS phone mockup signals "concept" not "product."
3. **A counter or metric.** "Join 50+ roofers already using RuufPro" — even a small number is better than no number. It signals that real people have done this.
4. **A support/contact method.** There is no chat widget, no phone number, no email address visible. For contractors who have been burned by disappearing support, this is a deal-breaker.
5. **Any indication the company is real.** No address, no team photos, no LinkedIn links, no "Built in [city]" statement. The footer says "About" but the page itself gives almost no company identity.

### How to compensate for zero reviews:

- **Founder transparency as the substitute.** The Hannah W. card is a good start but needs a real photo and a longer personal story. "I'm Hannah, I'm building this in Denver. Here's my email. Here's why I started this." Solo founder authenticity can match or beat corporate social proof when done well — but only if the founder is VISIBLE, not hiding behind an initial.
- **"Be the first 100" framing.** Instead of pretending to have social proof you do not have, own the early stage: "We're new. We're building this for roofers like you. The first 100 get [something]." Honesty about being early, combined with a real person behind it, creates a different kind of trust.
- **A live demo site.** If roofers can see a REAL RuufPro site working in the wild (even a demo one), that is proof the product works. No testimonial needed.

---

## TEST 6: The Orange CTA Experiment

### Does #E8720C work for home services?

**Yes, with caveats.** Orange is actually one of the most effective CTA colors in the home services space. Here is why:

**In favor of orange:**
- Home Depot (the most trusted brand among contractors) is orange. That association runs deep.
- ServiceTitan uses orange/amber accent elements.
- Orange signals urgency and action without the aggression of red.
- It stands out dramatically against both the dark hero and the white/gray content sections.
- It provides strong contrast with the teal brand color, creating visual hierarchy where CTAs pop.

**Concerns with this specific orange:**
- #E8720C is on the burnt/construction orange side, which works better than a bright neon orange. Good choice.
- The hover state (#C75F0A) darkens nicely — the transition is smooth.
- The `box-shadow: 0 4px 16px rgba(232,114,12,0.25)` on hover is subtle enough.

**Potential clash with teal:**
- Teal (#0D9488) and orange (#E8720C) are near-complementary colors. This CAN work well as a deliberate contrast, but the page currently uses teal for brand identity and orange ONLY for CTAs. This creates a visual situation where the CTAs feel like they belong to a different brand than the rest of the page. The nav CTA ("Start Free") is teal, but the hero CTA ("Build My Free Website") is orange. That inconsistency is confusing.

**What the most successful home services sites use:**
- **Jobber:** Green CTAs (#00C853 range) — signals "go," growth, money.
- **Housecall Pro:** Blue CTAs — consistent with brand, builds trust.
- **ServiceTitan:** Orange/amber accents, dark CTAs — industry alignment.
- **Roofr:** Blue CTAs — consistent with their blue brand.

**Recommendation:** The orange is a strong choice for primary CTAs. But make it CONSISTENT — the nav CTA should also be orange, not teal. Every clickable "sign up" action should be the same color. The teal should be for brand identity (logo, accent highlights, icons) but NOT for action buttons.

---

## TEST 7: Section-by-Section Conversion Audit

### Nav — Grade: B

**What works:** Clean, minimal. Three links + login + CTA. Does not overwhelm.

**What to change for contractors:**
- Add a phone number or "Questions? Call us" link. Contractors are phone-first. A nav without a phone number feels like a company that does not want to talk to you.
- The "Start Free" CTA in the nav should be orange to match all other CTAs (currently teal, breaking consistency).
- Nav links are hidden on mobile — fine, but the hamburger menu is missing entirely. There is no way to navigate on mobile.

### Hero — Grade: B-

**What works:** Headline is outstanding. "Stop losing jobs to roofers with better websites" is one of the best hero headlines I have seen for a home services tool. The subhead is clear and complete. Trust badges below the CTA address the right objections.

**What to change for contractors:**
- Replace the CSS phone mockup with a real product screenshot or a high-fidelity image.
- Add a direct input field (business name or email) alongside or instead of the button. Roofr does this. It reduces one click from the conversion path and makes "start" feel immediate.
- Consider making the hero lighter. The dark background with tiny white text signals "developer tool" to a contractor. Bright, warm hero backgrounds convert better in this market.
- On mobile, the phone mockup needs to appear ABOVE or alongside the headline, not below three scrolls of text.

### Proof Bar — Grade: C+

**What works:** The stats are relevant and sourced from real industry data.

**What to change for contractors:**
- These are market stats, not product stats. A roofer does not care that 63% of roofers struggle with lead gen — they already KNOW that because they ARE that roofer. Replace at least one stat with a product metric: "Average setup time: 4 minutes" or "Sites created this month: [number]."
- The design is too subtle. White text on dark background at 12px for the labels is nearly invisible. Make these bigger and more prominent.

### Problem Section — Grade: A-

**What works:** This is the best section on the page from a contractor psychology perspective. "You're great at roofing. Your online presence shouldn't hold you back" respects their craft while naming the gap. The before/after cards are scannable and use language roofers recognize. The problem paragraph about homeowners Googling "roofer near me" is vivid and relatable.

**What to change for contractors:**
- Add a visual. Right now this is pure text + cards. A simple illustration or photo of a homeowner looking at their phone (searching for a roofer) would make the scenario concrete.
- Consider adding the Google "Online Estimates" filter mention here as a teaser, since it intensifies the problem.

### Solution Section — Grade: B

**What works:** "We built this so your phone rings more" is a perfect outcome statement. The gradient text effect on the heading is eye-catching.

**What to change for contractors:**
- This section is too short and too abstract. It says "Professional design. Shows up on Google. Works on every phone." — but it does not SHOW any of that. This is where a product screenshot carousel or a before/after of a real site should live.
- The gradient text on h2 may render poorly on older Android browsers. Test or replace with solid color.

### Why It's Free — Grade: A-

**What works:** "What's the catch?" as a section header is perfect — it mirrors the exact thought in the roofer's head. The honesty about the business model is strong. The bullet list of anti-agency promises ("No salesperson will ever call you") directly addresses the #3 pain point from the research. The founder card adds a personal touch.

**What to change for contractors:**
- Lead with the business model answer, not the preamble. First sentence should be "Your website is free. We make money when roofers choose to add the estimate widget ($99/mo)." Currently this is the second paragraph.
- The founder card needs a real photo. An initial in a circle is not trust — it is anonymity.
- Add a CTA at the bottom of this section. If the "catch" explanation convinces them, they should be able to act immediately.

### How It Works — Grade: B+

**What works:** Three clear steps with time estimates. The numbered step pattern is familiar and non-threatening. "Under 5 minutes. No tech skills. Seriously." is the right tone.

**What to change for contractors:**
- Show each step, not just describe it. Step 1 should show the actual form (name, phone, city). Step 2 should show the three design styles. Step 3 should show a real published site. Contractors want to see what they are getting into BEFORE they start.
- The hover effect on steps (padding-left shift) is unnecessary and does not translate to mobile at all.

### Features — Grade: B-

**What works:** Clean cards, relevant features, good copy per card.

**What to change for contractors:**
- Six cards in a grid is a lot. On mobile this becomes a very long vertical list. Consider condensing to four features max, or using a more compact layout.
- The icons are generic Feather/Heroicons. They are fine but do not add information. Consider replacing with mini-screenshots or results (e.g., for "Never miss a lead," show an actual email notification preview).

### Google Filter / Estimate Widget Section — Grade: B+

**What works:** The framing as "For roofers who want more" correctly positions the widget as optional. The comparison with Roofle pricing is compelling. The honest footnote about Roofle's additional features builds credibility.

**What to change for contractors:**
- Show the widget in action. A screenshot or animation of a homeowner entering an address and seeing an estimate would be the most compelling thing on the entire page. This is the "wow" moment and it is described in words only.
- The "1 in 5 homeowners already use it" stat about the Google filter needs a more prominent visual treatment. This is the urgency driver for the paid upgrade.

### Pricing — Grade: B+

**What works:** Two tiers, simple, clear. "$0" is bold and visible. The "No contracts. No setup fees. Cancel anytime." note is exactly what roofers need to hear.

**What to change for contractors:**
- The Pro card is marked "Recommended" but EVERY CTA is supposed to lead to free signup. Recommending the paid tier contradicts the V3 strategy of "free is the only conversion goal." Either remove the "Recommended" badge or change it to something like "Most popular upgrade" that does not push the paid tier on the marketing page.
- Add the annual savings calculation if there is (or will be) an annual plan. Roofers who run seasonal businesses think in annual terms.
- The Starter card CTA ("Get Started Free") uses the outline style while the Pro card CTA ("Start Free, Upgrade Later") uses the filled orange style. This visually emphasizes the paid tier over the free tier, which again contradicts the strategy. The free tier CTA should be the most prominent.

### FAQ — Grade: A-

**What works:** Excellent questions — these are the actual things roofers ask. The toggle/accordion pattern is standard and works. "Do I own my leads?" is critical for this audience. "Won't online estimates let homeowners haggle?" shows deep understanding of roofer anxiety.

**What to change for contractors:**
- Add "Can I talk to someone before I sign up?" with an answer that gives a real contact method.
- Consider adding "What does the website actually look like?" with a link to the live demo. This is likely the most common unasked question.

### Final CTA — Grade: A-

**What works:** "Your competitors have websites. In 5 minutes, you will too." is excellent competitive urgency. Dark background creates visual distinction. Trust line repeats the key objections.

**What to change for contractors:**
- Consider adding a simple form field (business name or email) directly in this section instead of just a button. Reduce friction at the decision point.

### Footer — Grade: B

**What works:** Clean, minimal, appropriate links.

**What to change for contractors:**
- Add a phone number and/or email address.
- Add a "Built in [city], USA" or similar location signal. Contractors trust local over faceless.

---

## TEST 8: What Jobber/Housecall Pro/ServiceTitan Do That We Don't

### 1. Real Product Screenshots in the Hero

**What it is:** Jobber, Housecall Pro, and ServiceTitan all show actual product UI in their hero sections — not mockups, not wireframes, but real screenshots of the working software with realistic data.

**Why it works for contractors:** Contractors are visual, practical people. They want to see what they are buying. A real screenshot says "this exists, it works, and it looks like this." A mockup says "trust us, it will look something like this."

**How to implement here:** Take a screenshot of a real RuufPro contractor site (even a demo/beta site). Put it in the phone frame in the hero. Make the screenshot high-resolution and readable. If the product is not far enough along for a real screenshot, create a pixel-perfect design comp and embed it as an image — NOT as CSS/HTML.

### 2. Inline Email/Name Signup in the Hero

**What it is:** Roofr puts an email input field directly in the hero. Housecall Pro has a "Get started" form with an email field. The user can start signing up without clicking a button first.

**Why it works for contractors:** Reduces friction by one full step. A roofer who is ready to act can type their email right there instead of clicking a button, loading a new page, finding the form, and THEN typing. Every additional click is a dropout point, and contractors are especially impatient — they are between jobs with 30 seconds to spare.

**How to implement here:** Replace (or supplement) the "Build My Free Website" button with an inline form: a single input field for business name or email, with a submit button next to it. Keep the ghost button for "See a live example."

### 3. Named Customer Stories with Revenue/Results Numbers

**What it is:** Roofr features case studies with specific numbers: "$52K in revenue," "$2.5M in one year," "closed 10x faster." Jobber shows named contractors with their business type and a quote. ServiceTitan has video case studies with named companies.

**Why it works for contractors:** Roofers are skeptical of claims but respect results from peers. A named roofer saying "I got 12 more leads my first month" is worth more than ten paragraphs of marketing copy. The specificity of numbers (not "more leads" but "12 leads" or "$4,200 in new jobs") makes it believable.

**How to implement here:** Since RuufPro is pre-launch, you cannot fabricate testimonials. But you can: (1) Launch a beta with 5-10 roofers and get their quotes within the first month. (2) In the meantime, use the founder story more prominently, with a real photo and a personal narrative. (3) Add a "Be one of our first 100 roofers" framing that turns the lack of social proof into exclusivity.

### 4. Visible Support/Contact Channel

**What it is:** Jobber has a chat widget. Housecall Pro has "Talk to Sales" and a phone number. ServiceTitan has "Request a Demo" with a phone number. Roofr prominently displays "13 minute average reply time."

**Why it works for contractors:** The #6 pain point from the research is "Support disappears after you sign up." Contractors who have been burned by agencies and software companies need to know they can reach a human. A site with no visible contact method signals either "they don't want to hear from me" or "they'll ghost me after I sign up."

**How to implement here:** Add a visible email address or chat widget. Even a simple "Questions? Email hannah@ruufpro.com" in the nav or footer would change the trust dynamic. If you can do live chat (Crisp, Intercom free tier), even better. Response time promise is powerful: "We reply within [X] hours."

### 5. Interactive Product Demo or "Try Before You Sign Up" Element

**What it is:** Roofle has a "Try It Now" button that lets you interact with the estimate widget before signing up. Many SaaS tools have interactive demos (Navattic, Storylane) that let prospects click through the product.

**Why it works for contractors:** "Show me, don't tell me" is the contractor way. They buy trucks by test-driving them. They choose tools by holding them. A marketing page full of words is the OPPOSITE of how contractors make decisions. An interactive element — even a simple one — lets them experience the product before committing.

**How to implement here:** Create a "preview your site" tool right on the marketing page. Let the roofer type their business name and city, then dynamically show them a preview of what their site would look like. This does not require the full product backend — it could be a simple template swap with their name inserted. The conversion psychology is powerful: once they SEE their name on a professional website, they will want it.

---

## TEST 9: The "Would I Sign Up?" Test

### I am Mike, 35, 4-person crew in Denver. Found this via a Facebook roofing group link.

**My phone:** Samsung Galaxy A54. I am in my truck eating lunch before the next job.

**0:00 — I tap the link.** Page loads. Dark background. I see "Stop losing jobs to roofers with better websites." Okay, that hits. I have been thinking about this. My buddy Kevin just got a nice website and he is killing it on leads.

**0:05 — I read the subhead.** "Free professional website. Live in under 5 minutes." Skeptical. Nothing is free. But "no credit card" — okay, I will keep scrolling.

**0:10 — I see two buttons.** "Build My Free Website" in orange. "See a live example." I want to see the example first. I am not clicking anything until I know what this is. I tap "See a live example."

**0:12 — Problem.** "See a live example" is an anchor link or placeholder. I do not see an example. Trust drops. If the product is real, show me one. I go back to scrolling.

**0:15 — I scroll past the phone mockup.** It is small and I cannot read the text in it. It looks like a template, not a real site. I keep scrolling.

**0:20 — Proof bar.** "$187 average cost per Google Ads lead." Yeah, I know. I stopped running Google Ads because it was too expensive. This gets my attention slightly.

**0:30 — Problem section.** "You're great at roofing. Your online presence shouldn't hold you back." Okay, this feels like it was written for me. The before/after cards — yeah, that is exactly my situation. I do not show up on Google. I have lost jobs to guys with better websites.

**0:45 — Solution section.** "We built this so your phone rings more." Good, that is what I want. But I still have not SEEN a website. Just words about websites.

**0:55 — "What's the catch?"** I pause here. This is the section I care about. I read the first paragraph. "Two-thirds of roofers are unhappy with their marketing provider." Yeah, I paid a guy $3K for a garbage website last year. I read the business model explanation. $99/mo for an optional widget. Okay, that makes sense. I respect that they are upfront about it.

**1:10 — I see the founder card.** "Hannah W., Founder" with a purple circle. Who is Hannah? No photo, no LinkedIn, no way to verify this is a real person. Mildly suspicious. I scroll on.

**1:20 — How It Works.** Three steps. Name, phone, city. Pick a style. Publish. Under 5 minutes. Okay, that does sound easy. But I still have not seen what the website LOOKS like.

**1:40 — Features.** Six cards. Professional website, Google, leads, mobile, yours to keep, email alerts. Standard stuff. Nothing surprising. I am scrolling faster now.

**2:00 — Google section.** This catches my attention. "Google added an Online Estimates filter." I have heard about this in the Facebook group. The comparison with Roofle — $99 vs $350/mo — is compelling. I looked at Roofle once and could not justify the price.

**2:15 — Pricing.** $0 and $99. Simple. The "Recommended" badge on the $99 tier makes me think "so the free thing is bait." Slightly annoyed. I thought this was about the free website.

**2:30 — FAQ.** I scan the questions. "Do I own my leads?" Yes. Good. "I'm not a tech person" — yeah, that is me. "Can I actually do this?" — the answer is reassuring.

**2:45 — Final CTA.** "Your competitors have websites. In 5 minutes, you will too." Okay, that is a good line.

### Do I sign up?

**Maybe. 55% chance.** Here is what holds me back:

1. **I never saw a real website.** I scrolled the entire page and I still do not know what my site would look like. That is the single biggest barrier. Show me a live site and I am 80% in.
2. **No proof anyone else has done this.** No reviews, no testimonials, no "50 roofers in Denver already signed up." I would feel better if I knew other roofers used this.
3. **I do not know who Hannah is.** A real photo and an email address would help.

### What ONE thing would make me definitely sign up?

**A clickable link to a real RuufPro site for a roofing company (even a demo one) that looks professional and has a working contact form.** If I can see a live example, tap around on it, and think "yeah, I want that" — I am signing up right now from my truck.

---

## TEST 10: Priority Improvements (Contractor-Focused)

### 1. Replace the CSS phone mockup with a real product screenshot

**What to do:** Take a screenshot of an actual RuufPro contractor site (even a demo). Embed it as an image inside the phone frame. Make it high-resolution and readable.

**Why (home services lens):** Contractors buy with their eyes. Every successful home services SaaS site shows the real product in the hero. The CSS mockup with 8px text signals "concept" not "product." This is the single highest-impact change for conversions.

### 2. Add a live demo site link that actually works

**What to do:** Create a demo RuufPro site (e.g., demo.ruufpro.com or summitroofing.ruufpro.com) and link the "See a live example" button to it. Make sure the demo site is polished and has a working contact form.

**Why (home services lens):** The "See a live example" ghost button in the hero promises something the page does not deliver. A roofer who wants to verify the product is real before signing up (which is MOST roofers) will click this. If it goes nowhere, they leave. A working live demo is the closest thing to a test drive, and contractors decide by trying things.

### 3. Add the founder's real photo and a direct contact method

**What to do:** Replace the "H" initial circle in the founder card with a real headshot. Add an email address: "Questions? Email me at hannah@ruufpro.com." Add a phone number or chat to the nav or footer.

**Why (home services lens):** Two-thirds of roofers have been burned by faceless marketing companies. A real face and a real email address are the antidote. Solo founder transparency is one of the strongest trust signals in the home services space because contractors are themselves small business owners — they respect another small business owner showing up personally.

### 4. Add inline signup form in the hero (email or business name field)

**What to do:** Below the headline and subhead, add a single input field: "Enter your business name" with a submit button next to it. This replaces or supplements the current "Build My Free Website" button.

**Why (home services lens):** Roofr does this. It works because it reduces one click from the conversion path. A roofer with 30 seconds between jobs can type their name and hit go. The current flow requires: click button, load new page, find form, fill it out. Each step loses 20-30% of visitors.

### 5. Switch hero from dark to light background

**What to do:** Change the hero section from the dark navy (#0B1120) to a light, warm background (white or light cream). Keep the dark section for the final CTA only.

**Why (home services lens):** Jobber, Housecall Pro, and Roofr all use light hero sections. Dark UIs read as "developer tool" or "gaming" to contractors. A light, open hero with clear text and a product image feels approachable, simple, and professional — exactly the qualities RuufPro's product promises. The dark background is doing the opposite of what the copy is trying to achieve.

### 6. Remove the "Recommended" badge from the Pro pricing card

**What to do:** Delete the `popular` class and the `::after` "Recommended" pseudo-element from the Pro card. Make the Free tier CTA the orange/filled button, and the Pro tier CTA the outline button.

**Why (home services lens):** The V3 strategy explicitly states "every CTA leads to free signup" and "the page's JOB is the free signup." Marking the $99/mo tier as "Recommended" contradicts this and re-triggers the "so the free thing is bait" suspicion. Every visual signal should push toward the free tier. The product can upsell itself once they are inside.

### 7. Add a "Join X roofers" counter or early-stage social proof

**What to do:** If you have beta users, add "Join [X] roofers who already have their free site" with a small number. If pre-launch, add "Be one of our first 100" with a progress bar. Even "12 sites created this week" works if it is real.

**Why (home services lens):** Contractors follow other contractors. They ask peers before trying new tools. Facebook groups are their discovery channel. ANY evidence that other roofers are using this is more persuasive than any amount of marketing copy. A small honest number (even "23 roofers") is more trustworthy than no number.

### 8. Make the nav CTA orange and add a hamburger menu on mobile

**What to do:** Change the nav "Start Free" button from teal (#0D9488) background to orange (#E8720C) to match all other CTAs. Add a hamburger icon on mobile that opens a slide-out menu with the three nav links.

**Why (home services lens):** CTA color consistency matters for conversion. If a roofer sees orange buttons throughout the page but a teal button in the nav, their brain registers two different actions instead of one. On mobile, hiding the nav links without a hamburger means there is NO navigation — a roofer who scrolls back to the top cannot jump to pricing or FAQ without manually scrolling.

### 9. Show the estimate widget in action (screenshot or animation)

**What to do:** In the Google/estimate widget section, add a visual showing the widget: a satellite roof image, a material selection, and a price estimate. This could be a screenshot, an annotated mockup, or a simple animation.

**Why (home services lens):** The estimate widget is the paid product and the key differentiator vs free website builders. But a roofer reading this section has no idea what it looks like. "Satellite imagery measures their roof" is evocative but abstract. A single screenshot of a roof measurement with a price estimate would make the value immediately obvious and drive more eventual upgrades.

### 10. Reduce total page scroll length by 30%

**What to do:** (a) Merge the solution section into the problem section as the "after" state (they are saying the same thing). (b) Cut the features grid from 6 cards to 4. (c) Tighten padding — the 120px top/bottom padding on desktop is generous for a page that is already long. Consider 80-96px. (d) On mobile, the "Why Free" section is especially long when the two columns stack — consider collapsing the bullet list into a more compact format.

**Why (home services lens):** Contractors on their phones have limited patience. The current page requires 15-20 thumb-scrolls on mobile to reach the final CTA. Every home services page that converts well gets to the first CTA within 2 scrolls and the full story within 8-10. Housecall Pro's homepage is approximately half the length of this page and converts at industry-leading rates. Shorter pages with clearer visual proof outperform long-copy pages for this audience.

---

## Summary

The copy on this page is excellent — genuinely some of the best contractor-focused copy I have seen from an early-stage product. The headline, the "What's the catch?" framing, the problem section language, and the FAQ questions all demonstrate deep understanding of the roofer audience. The V3 strategic decisions (single conversion goal, honest pricing, anti-agency positioning) are correct.

The gap is between the copy and the visuals. The design language (dark UI, glassmorphism, startup fonts, CSS mockups, scroll animations) tells a different story than the words do. The words say "simple, honest, built for roofers." The visuals say "slick SaaS startup." Contractors trust the visual impression first and the words second — so the visuals need to match the copy's sincerity.

The highest-leverage changes are: (1) show a real product, (2) show a real person behind it, and (3) make the visual design as approachable as the copy. Do those three things and this page will convert.
