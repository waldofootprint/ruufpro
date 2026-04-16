# Riley AI Chatbot — Roofer Experience Audit

> **Date:** April 14, 2026
> **Perspective:** Mike, 47, owns a 4-person roofing crew in Tampa. On his phone 90% of the time. Paying $149/mo. Does NOT read instructions. Will cancel instantly if Riley embarrasses him.
> **Method:** Code review of all 15 Riley source files + browser walkthrough (desktop + mobile) + competitive context
> **Branch:** `template-modern-clean-polish`

---

## Summary

- **Blockers:** 6 (Mike would cancel or be embarrassed)
- **Friction:** 11 (Mike gets confused, frustrated, or loses trust)
- **Polish:** 8 (Minor annoyances, missed opportunities)
- **Total: 25 findings**

---

## 1. Discovery & First Impression

### F1. Dashboard home page has zero mention of Riley
- **Screen/Flow:** `/dashboard` (main dashboard home)
- **Issue:** Mike logs in. He sees leads, activity, stats. Zero mention of Riley anywhere. No card saying "Your AI chatbot handled 5 conversations today." No nudge saying "Set up Riley to capture leads 24/7." Mike doesn't know Riley exists unless he explores the sidebar.
- **Severity:** Blocker
- **Fix:** Add a "Riley" card to the dashboard home — either a status card ("Riley handled X conversations today") for trained users, or a setup CTA ("Set up your 24/7 AI assistant — takes 5 minutes") for untrained users.

### F2. Onboarding checklist doesn't mention Riley
- **Screen/Flow:** `OnboardingChecklist.tsx` (persistent checklist on all dashboard pages)
- **Issue:** The onboarding checklist walks Mike through setup steps. Riley isn't one of them. Mike completes the checklist thinking he's done. Riley sits untouched.
- **Severity:** Blocker
- **Fix:** Add "Set up Riley (your AI chatbot)" as step 4 or 5 in the onboarding checklist. Link directly to `/dashboard/chatbot`.

### F3. "Train Riley" is buried in sidebar — item 7 of 11
- **Screen/Flow:** Dashboard sidebar navigation
- **Issue:** Mike scans the sidebar: Dashboard, Leads, Widget Settings, Estimate Add-Ons, My Website, Reviews... then Train Riley. By item 7, Mike's already found what he wanted or stopped looking. "Train Riley" sounds like work, not a feature.
- **Severity:** Friction
- **Fix:** Move "Train Riley" higher — right after "My Website" (item 4-5). Or rename to "AI Chatbot" with a purple dot/badge when untrained.

### F4. Mobile: Riley is buried behind "More" menu
- **Screen/Flow:** Mobile bottom tab bar → More menu
- **Issue:** Mobile tabs are: Home, Leads, Widget, My Site, More. Riley is inside "More" alongside Settings and Sign Out. Mike taps around on his phone all day and never finds Riley.
- **Severity:** Friction
- **Fix:** Either add Riley as a 5th tab (replacing one of the less-used ones) or put a prominent Riley card on the mobile dashboard home page.

### F5. No value prop on first encounter
- **Screen/Flow:** First time Mike sees "Train Riley" in sidebar
- **Issue:** The sidebar just says "Train Riley" with a bot icon. Mike thinks: "Train what? Is this going to take an hour? What does it even do?" The name "Riley" means nothing to him yet.
- **Severity:** Friction
- **Fix:** Add a subtitle under the sidebar link: "AI Chatbot" in smaller text. When Mike first lands on the Train Riley page, show a 10-second value pitch: "Riley answers homeowner questions 24/7 and captures leads while you sleep. Most contractors set it up in under 5 minutes."

---

## 2. Enabling Riley

### F6. Toggle to enable Riley is on Settings page, not Train Riley page
- **Screen/Flow:** `/dashboard/settings` → "AI Chatbot — Riley" section
- **Issue:** Mike goes to Train Riley, fills out fields, hits Save. But Riley isn't live yet — the enable toggle is on a completely different page (Settings). Mike doesn't know he needs to go to Settings. He thinks saving = live.
- **Severity:** Blocker
- **Fix:** Add an enable/disable toggle to the TOP of the Train Riley page with a clear status indicator: "Riley is LIVE on your website" (green) or "Riley is OFF" (gray). Keep the Settings toggle as a secondary location.

### F7. No warning when enabling Riley without training
- **Screen/Flow:** `/dashboard/settings` → toggle `has_ai_chatbot` on
- **Issue:** Mike can flip the toggle ON in Settings without having filled out a single field on Train Riley. Riley goes live with zero business context — it'll answer questions with generic "I'd recommend contacting the team" responses. Mike doesn't know this is happening.
- **Severity:** Blocker
- **Fix:** When Mike enables Riley with 0% training completion, show a warning: "Riley doesn't know anything about your business yet. She'll give generic answers until you train her. Go to Train Riley to teach her your pricing, services, and FAQs." With a link to `/dashboard/chatbot`.

### F8. Settings page greeting preview is hardcoded, ignores custom greeting
- **Screen/Flow:** `/dashboard/settings` → Riley section → Greeting Preview
- **Issue:** The preview always shows the default greeting ("Hi! I'm Riley from {business_name}!...") even if Mike has written a custom greeting on the Train Riley page. Mike sees one greeting in Settings, a different one on his website. Confusing.
- **Severity:** Friction
- **Fix:** Fetch the `greeting_message` from `chatbot_config` and show that in the Settings preview. If none exists, show the default with "(default)" label.

### F9. Two separate pages to manage one feature
- **Screen/Flow:** Settings (toggle + preview) vs Train Riley (training + embed code)
- **Issue:** Mike's mental model is: "Riley is one thing." Having the on/off switch on one page and the training on another feels like two different features. He'll forget where the toggle is.
- **Severity:** Friction
- **Fix:** Make Train Riley the single source of truth. Add the toggle there. Settings can keep a read-only status line: "Riley: Active · [Manage →]"

---

## 3. Training Riley

### F10. No "Test Riley" or preview button
- **Screen/Flow:** `/dashboard/chatbot` — after filling out fields and saving
- **Issue:** Mike fills out his pricing, services, FAQs. Hits Save. Gets "Saved — Riley is updated!" Now what? There's no way to test what Riley will say. Mike has to go to his website, open the chat, and ask a question to find out if Riley sounds good. If Riley says something dumb, a real homeowner might see it first.
- **Severity:** Blocker
- **Fix:** Add a "Test Riley" button that opens a preview chat in a modal. Same widget, same prompt, but clearly labeled "PREVIEW — not visible to homeowners" and doesn't save to the database.

### F11. Dollar signs and commas in price inputs get stripped silently
- **Screen/Flow:** `/dashboard/chatbot` → Pricing & Services → price range fields
- **Issue:** Fields are `type="number"`. Mike types "$5,000" — the field shows "5000" or rejects the input entirely depending on the browser. Mike types "5000" — it works. But there's no dollar sign shown, so Mike isn't sure if he entered $5,000 or $50.00 or just 5000 of something.
- **Severity:** Friction
- **Fix:** Switch to `type="text"` with input masking. Strip non-numeric chars in `prepareForDb` (already done). Show the `$` prefix (already there as a visual element) and add commas as the user types.

### F12. Progress bar penalizes Mike for not having financing/referral program
- **Screen/Flow:** `/dashboard/chatbot` → progress bar
- **Issue:** TOTAL_FIELDS = 17. Mike doesn't have financing, no referral program, no current promotions, hasn't written a team description. Progress bar says 47%. Mike feels behind even though Riley has everything she needs. The message says "Add insurance and warranty details next" — but Mike doesn't do insurance work.
- **Severity:** Friction
- **Fix:** Two options: (a) Only count fields relevant to Mike's answers (if `does_insurance_work` is off, don't count `insurance_description`). Or (b) Use tiered messaging: at 4-5 core fields (pricing, timeline, materials, free inspection, process) show "Riley has the essentials — she's ready to go!" Only push for more at the margin.

### F13. "Smart Pre-fill" button says "Soon" — confuses Mike
- **Screen/Flow:** `/dashboard/chatbot` → header → Smart Pre-fill button
- **Issue:** Mike sees a greyed-out button that says "Smart Pre-fill" with a "Soon" badge. He doesn't know what pre-fill means. He might think the page is broken or incomplete. "Soon" doesn't set a timeframe.
- **Severity:** Polish
- **Fix:** Either hide the button entirely until it's ready, or change the label to something Mike understands: "Auto-fill from your website (coming soon)" — but honestly, just hide it. Don't show Mike features that don't work yet.

### F14. Embed code section uses developer jargon
- **Screen/Flow:** `/dashboard/chatbot` → "Embed Riley on Your Website" section
- **Issue:** Mike sees: `<script src="https://ruufpro.com/riley.js" data-contractor-id="..." data-accent-color="#6366f1"></script>` and the instruction "Paste this one line before `</body>` on any page." Mike has NO IDEA what `<script>`, `</body>`, or `data-accent-color` means. He built his WordPress site on a Saturday with YouTube tutorials.
- **Severity:** Blocker
- **Fix:** Three changes: (1) Add a "Send to your web person" button that opens a pre-written email with the code + instructions. (2) Add platform-specific instructions: "WordPress: Install the 'Insert Headers and Footers' plugin → paste this code in the Footer section." "Wix: Settings → Custom Code → Add Code → paste." (3) Move the raw code behind an "Advanced" expandable — lead with the simple options.

### F15. No indication of what Riley says without training
- **Screen/Flow:** `/dashboard/chatbot` — first visit, all fields empty
- **Issue:** Mike opens Train Riley for the first time. Empty fields everywhere. He doesn't know what Riley is currently saying to homeowners (if enabled). Is Riley saying something dumb right now? Or is she off? No context.
- **Severity:** Friction
- **Fix:** Show an "example conversation" at the top of the page: "Here's what Riley says right now with your current training:" with a mini preview bubble showing the greeting + a sample response to "How much does a roof cost?" This motivates Mike to fill in fields AND shows him what changes when he does.

---

## 4. Riley's Conversations (Homeowner Perspective)

### F16. Double period in greeting when business name ends with period
- **Screen/Flow:** Chat widget greeting message
- **Issue:** Greeting says "Hi! I'm Riley, an AI assistant for Pinnacle Roofing Co.." — double period because `businessName` is "Pinnacle Roofing Co." (ends with period) and the template adds another period.
- **Severity:** Polish
- **Fix:** In `ChatWidget.tsx:72`, strip trailing period from `businessName` before inserting into greeting template. Or use the custom greeting field which wouldn't have this issue.
- **Files:** `components/chat-widget/ChatWidget.tsx:72`, `app/chat/[contractorId]/RileyStandalone.tsx:85`

### F17. RileyStandalone (iframe embed) is missing critical features
- **Screen/Flow:** `/chat/[contractorId]` — used by riley.js embed
- **Issue:** The standalone version that loads inside the iframe embed is missing: (a) message cap (unlimited API cost), (b) lead capture form (no conversion), (c) estimate card rendering (tool results show as raw text or nothing), (d) message persistence, (e) message count / lead status not sent to API. It's a completely separate, inferior implementation.
- **Severity:** Blocker — but only for external embed users
- **Fix:** Either rewrite RileyStandalone to include all ChatWidget features, or (better) render ChatWidget inside the standalone page wrapper. One component, two containers.
- **Files:** `app/chat/[contractorId]/RileyStandalone.tsx`

### F18. No loading state during estimate tool execution
- **Screen/Flow:** Chat widget — homeowner shares address, estimate tool runs
- **Issue:** When the estimate tool runs (3-8 seconds for Solar API + calculations), the user sees the generic bouncing dots. No indication that Riley is "looking up your roof" vs "thinking." Homeowner may send another message or give up.
- **Severity:** Friction
- **Fix:** Detect tool execution state and show a specific message: "Looking up your roof from satellite... this takes a few seconds" with a satellite icon instead of bouncing dots.
- **Files:** `components/chat-widget/ChatWidget.tsx`

### F19. 10-message cap feels abrupt
- **Screen/Flow:** Chat widget — after 10 user messages
- **Issue:** At message 10, the input is replaced with "Thanks for chatting! [Business] will be in touch soon." No warning at message 8 or 9. From the homeowner's perspective, Riley just suddenly stops talking mid-conversation.
- **Severity:** Friction
- **Fix:** At message 8, have Riley naturally mention: "We're getting into details here — the best next step would be to have the team reach out directly." This already happens via the system prompt (message >= 8 instruction), but the hard cutoff at 10 should have a softer transition. Show "2 messages remaining" or similar at message 9.

---

## 5. Lead Capture Flow

### F20. SMS consent checkbox is unclear to Mike
- **Screen/Flow:** Chat widget → lead form → "OK to text me at this number" checkbox
- **Issue:** From Mike's perspective (not the homeowner's), Mike doesn't know this checkbox exists on his website. He doesn't know that checking it gives him permission to text. If asked, he'd say "what checkbox?" The homeowner sees it, but Mike never configured it or learned what it does.
- **Severity:** Friction
- **Fix:** On the Train Riley page or the Settings page, explain: "When homeowners share their info through Riley, they'll see an option to opt in to text messages. If they check it, you can text them back."

### F21. No address field on lead form means missed estimate opportunity
- **Screen/Flow:** Chat widget → lead form
- **Issue:** The lead form has: name, phone, email, address. Wait — address IS there. This is actually good. But it's not labeled well — just "address" with no placeholder. Mike's homeowner might not know why Riley wants their address at this point.
- **Severity:** Polish
- **Fix:** Add placeholder text: "Your street address (for a more accurate estimate)" — ties the address request to value.

---

## 6. Analytics Dashboard

### F22. No conversation transcripts — Mike can't see what Riley said
- **Screen/Flow:** `/dashboard/chatbot-analytics`
- **Issue:** Mike gets a call from a homeowner who says "Your chatbot told me the roof would cost $8,000." Mike has no way to verify this. The analytics page shows aggregate stats (conversation count, top questions, lead funnel) but zero individual conversations. Mike can't check what Riley actually told people.
- **Severity:** Blocker — trust-destroying
- **Fix:** Add a "Recent Conversations" section below the charts. Show the last 20 conversations with expandable message history. Read-only. Each row shows: date, homeowner first message, message count, lead captured badge. Click to expand full transcript.
- **Files:** `app/dashboard/chatbot-analytics/page.tsx` (extend), needs API endpoint

### F23. "Conversion Rate" label may confuse Mike
- **Screen/Flow:** `/dashboard/chatbot-analytics` → stat cards
- **Issue:** Mike sees "Conversion Rate: 15%" and thinks "15% of what? What's converting?" He's a roofer, not a SaaS marketer. The subtitle says "3 of 20" which helps, but the label itself is jargon.
- **Severity:** Polish
- **Fix:** Rename to "Lead Capture Rate" or "Leads from Chats" — language Mike already uses. Keep the "3 of 20" subtitle.

### F24. Riley Analytics not in mobile "More" menu
- **Screen/Flow:** Mobile bottom tab bar → More menu
- **Issue:** The "More" menu on mobile includes: Dashboard, Reviews, Train Riley, Settings, Notifications, Sign Out. Riley Analytics is NOT listed. Mike can't check Riley's performance from his phone — where he spends 90% of his time.
- **Severity:** Friction
- **Fix:** Add "Riley Analytics" to the mobile More menu. Or better: add a mini Riley stats card to the mobile dashboard home.
- **Files:** `app/dashboard/layout.tsx` — `TAB_ITEMS` More menu section (around line 257-290)

---

## 7. Ongoing Trust & Control

### F25. No kill switch on Train Riley page
- **Screen/Flow:** `/dashboard/chatbot`
- **Issue:** If Riley says something wrong, Mike's instinct is to go to Train Riley (where he manages Riley) and turn it off. But the toggle is on Settings. Mike panics, can't find the off switch, calls support.
- **Severity:** Friction
- **Fix:** Add a clearly visible ON/OFF toggle at the top of the Train Riley page. Red when off, green when on. "Riley is LIVE on your website" / "Riley is OFF."

---

## Ranked Action Plan

### Blockers (fix before any roofer uses Riley)

| # | Finding | Fix | Effort |
|---|---------|-----|--------|
| F1 | Dashboard home has zero mention of Riley | Add Riley status/setup card to dashboard | S |
| F2 | Onboarding checklist doesn't mention Riley | Add "Set up Riley" step to checklist | S |
| F6 | Enable toggle is on Settings, not Train Riley | Add toggle to Train Riley page header | S |
| F7 | No warning when enabling without training | Show warning modal when toggle + 0% training | S |
| F10 | No "Test Riley" button | Add preview chat modal on Train Riley page | M |
| F14 | Embed code uses developer jargon | Add "Send to web person" + platform instructions | M |
| F22 | No conversation transcripts | Add Recent Conversations section to analytics | M |
| F17 | RileyStandalone missing critical features | Unify with ChatWidget | L |

### Friction (fix before launch outreach)

| # | Finding | Fix | Effort |
|---|---------|-----|--------|
| F3 | Train Riley buried in sidebar (item 7/11) | Move higher, rename to "AI Chatbot" | S |
| F4 | Mobile: Riley behind "More" menu | Add to More menu or dashboard card | S |
| F5 | No value prop on first encounter | Add subtitle + first-visit pitch | S |
| F8 | Settings greeting preview is hardcoded | Fetch custom greeting from chatbot_config | S |
| F9 | Two pages to manage one feature | Make Train Riley the single source | S |
| F11 | Dollar signs stripped in price inputs | Switch to text input with masking | S |
| F12 | Progress bar penalizes missing optional fields | Only count relevant fields | S |
| F15 | No indication of current Riley behavior | Show example conversation preview | M |
| F18 | No loading state during estimate tool | Show "Looking up your roof..." message | S |
| F19 | 10-message cap feels abrupt | Add "messages remaining" warning | S |
| F20 | SMS consent checkbox unexplained to Mike | Add explanation in Train Riley page | S |
| F24 | Riley Analytics missing from mobile More menu | Add to More menu | S |
| F25 | No kill switch on Train Riley page | Add ON/OFF toggle to page header | S |

### Polish (fix when possible)

| # | Finding | Fix | Effort |
|---|---------|-----|--------|
| F13 | "Smart Pre-fill" button says "Soon" | Hide until ready | S |
| F16 | Double period in greeting | Strip trailing period from business name | S |
| F21 | Address field lacks helpful placeholder | Add "for a more accurate estimate" | S |
| F23 | "Conversion Rate" jargon | Rename to "Lead Capture Rate" | S |
| + | Config change note is tiny (11px) | Make it more visible | S |
| + | No "new conversation" badge in sidebar | Add purple dot when Riley gets conversations | S |
| + | Estimate card disclaimer text is 10px | Increase to at least 11px | S |
| + | Chat greeting could suggest starter questions | Add 2-3 quick-reply chips below greeting | M |

---

## Riley Is Actually Great Here

These are moments where Mike would feel proud. Protect these at all costs.

1. **"AI Assistant · Online 24/7" header** — immediately clear what Riley is. Green dot says "she's working." Mike sees this and thinks "my website is covered even when I'm asleep."

2. **Estimate card in chat** — the jaw-drop moment. Homeowner shares an address, Riley measures the roof from satellite and shows a professional estimate card with material options, sqft, and pricing. No competitor does this. Mike would show this to his buddy at the supply house.

3. **Lead capture form timing** — shows at message 3, re-shows at 7 if dismissed. Not pushy but not passive. "Later" button respects the homeowner. Mike's leads come with name, phone, email, address, and SMS consent status. Better data than a contact form.

4. **Emergency detection** — if a homeowner says "my roof is leaking right now," Riley treats it as urgent and pushes hard for contact info. Mike's phone rings within minutes. This saves real damage and wins real jobs.

5. **Competitor redirect** — if someone mentions another roofer, Riley doesn't badmouth them. She redirects: "I can speak to what makes [business] stand out..." Mike doesn't look petty.

6. **Prompt injection defense** — if someone tries to extract Mike's pricing formula or trick Riley, she deflects: "I'm Riley — I'm here to help with roofing questions!" Mike's competitive info stays protected.

7. **Phone validation on lead form** — red border + error for invalid numbers. Mike doesn't get leads with "555-1234" that he can't call back.

8. **FTC-compliant AI disclosure** — header says "AI Assistant," Riley admits being AI when asked directly. Mike doesn't get in trouble for pretending Riley is human.

---

## 3 Things That Would Make Mike Tell Another Roofer About Riley

1. **"She answered a question at 2 AM and I woke up to a lead with their address already in my dashboard."** The 24/7 coverage + lead capture + address collection is the combination that wins referrals. Every roofer has lost a lead because they were on a roof and couldn't answer the phone. Riley solves that, and the estimate-in-chat makes it feel like magic.

2. **"I can see exactly what she told my customers."** (Requires F22 fix.) Right now Mike CAN'T do this — it's the biggest trust gap. Once transcripts are visible, Mike goes from "I hope she's saying the right things" to "I can verify she's saying the right things." That confidence is what turns skeptics into advocates.

3. **"Setup took 5 minutes and she already sounds like she works for me."** (Requires F10 + F6 + F1 fixes.) If the onboarding flow is: dashboard card → Train Riley → fill 5 core fields → click "Test Riley" → see her answer a pricing question with YOUR numbers → toggle ON — that's a 5-minute path from "what is this?" to "holy crap, this is amazing." The current path is: find Train Riley in sidebar → fill 17 fields → go to Settings → find toggle → go to your website → open chat → ask a question → hope it's right. That's a 20-minute path with anxiety at every step.

---

## Technical Notes (from prior audit, relevant to Mike's experience)

These were identified in `research/riley-full-system-audit.md` and directly affect Mike:

| Tech Finding | Mike's Experience | Status |
|---|---|---|
| C1. Rate limiting doesn't work on serverless | Riley could get flooded, rack up API costs on Mike's behalf | Open |
| C3. CORS allows any origin | Competitor could build a bot that hammers Mike's Riley | Open |
| C5. Lead insert via client-side Supabase | Competitor could inject fake leads into Mike's dashboard | Open |
| H6. Price range low > high not validated | Riley says "projects range from $50K to $5K" — embarrassing | Fixed (swap in prepareForDb) |
| H7. Absurd estimate rates not guarded | Estimate shows "$3 – $300K" if config is wrong | Open |
| M4. No conversation transcripts | = F22 above | Open |
| M5. No preview before going live | = F10 above | Open |
| M6. 50/day limit → 200/day | Mike's busy site shuts Riley down mid-afternoon | Fixed (200/day) |
