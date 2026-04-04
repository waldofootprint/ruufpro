// AI categorization and draft reply generation for the reply handler.
// Uses structured prompts to categorize replies and draft contextual responses.
// No external AI API needed — this runs as deterministic pattern matching + templates.
// Can be upgraded to Claude API later for more nuanced drafting.

// ─── Types ───────────────────────────────────────────────

export interface ReplyContext {
  prospectName: string;
  prospectCompany?: string;
  prospectCity?: string;
  inboundText: string;
  originalOutreach?: string;
  channel: string;
}

export interface CategorizedReply {
  category: "interested" | "question" | "objection" | "not_now" | "unsubscribe";
  confidence: "high" | "medium" | "low";
  draftReply: string;
}

// ─── Categorization (Deterministic) ─────────────────────

const PATTERNS: {
  category: CategorizedReply["category"];
  signals: RegExp[];
  weight: number;
}[] = [
  {
    category: "unsubscribe",
    weight: 100, // always wins if matched
    signals: [
      /\b(remove me|unsubscribe|stop (emailing|contacting)|take me off|opt.?out)\b/i,
      /\b(don'?t (ever )?contact|never email|leave me alone)\b/i,
      /\b(reported? (as )?spam|marked? (as )?spam)\b/i,
    ],
  },
  {
    category: "interested",
    weight: 80,
    signals: [
      /\b(sounds? good|i'?m interested|tell me more|send it over|let'?s (talk|chat|do it|connect|go))\b/i,
      /\b(yes|yeah|yep|sure|absolutely|definitely|i'?d love|count me in)\b/i,
      /\b(show me|send me|set (it )?up|let'?s see|i'?d like to see)\b/i,
      /\b(when can we|book a|schedule|calendar|available|free (this|next) week)\b/i,
      /\b(this is (exactly )?what (i|we) need|perfect timing)\b/i,
    ],
  },
  {
    category: "question",
    weight: 60,
    signals: [
      /\b(how (does|much|do|can|long|is)|what('?s| is| are| does))\b/i,
      /\b(can (you|it|i)|does (it|this)|is (there|it|this))\b/i,
      /\b(pricing|cost|price|fee|charge|pay|afford)\b/i,
      /\b(tell me (more )?about|explain|what do you mean|curious)\b/i,
      /\?/,  // any question mark
    ],
  },
  {
    category: "not_now",
    weight: 40,
    signals: [
      /\b(bad timing|not (right )?now|maybe later|check back|after|next (month|quarter|year|season))\b/i,
      /\b(too busy|swamped|slammed|buried|crazy (busy|week))\b/i,
      /\b(circle back|follow up|reach out) (in|later|after|next)\b/i,
      /\b(end of (the )?(year|quarter|month|season)|off.?season|slow season)\b/i,
    ],
  },
  {
    category: "objection",
    weight: 30,
    signals: [
      /\b(already (have|use|got|using)|we (use|have|got)|happy with)\b/i,
      /\b(not (interested|looking|need)|don'?t need|no (thanks|thank you))\b/i,
      /\b(too expensive|can'?t afford|budget|out of (our )?price)\b/i,
      /\b(we'?re good|all set|taken care of|covered)\b/i,
      /\b(tried (that|it|something)|didn'?t work|waste of)\b/i,
    ],
  },
];

export function categorizeReply(text: string): {
  category: CategorizedReply["category"];
  confidence: CategorizedReply["confidence"];
} {
  const scores: Record<string, number> = {};

  for (const pattern of PATTERNS) {
    let matchCount = 0;
    for (const signal of pattern.signals) {
      if (signal.test(text)) matchCount++;
    }
    if (matchCount > 0) {
      scores[pattern.category] = pattern.weight + matchCount * 10;
    }
  }

  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    return { category: "question", confidence: "low" };
  }

  const topCategory = entries[0][0] as CategorizedReply["category"];
  const topScore = entries[0][1];
  const secondScore = entries.length > 1 ? entries[1][1] : 0;

  // Confidence based on gap between top two
  let confidence: CategorizedReply["confidence"];
  if (topScore - secondScore > 30) {
    confidence = "high";
  } else if (topScore - secondScore > 10) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  return { category: topCategory, confidence };
}

// ─── Draft Reply Generation ──────────────────────────────

export function generateDraftReply(context: ReplyContext): CategorizedReply {
  const { category, confidence } = categorizeReply(context.inboundText);
  const firstName = context.prospectName.split(" ")[0];
  const company = context.prospectCompany || "your company";

  let draftReply: string;

  switch (category) {
    case "interested":
      draftReply = generateInterestedReply(firstName, company, context);
      break;
    case "question":
      draftReply = generateQuestionReply(firstName, company, context);
      break;
    case "objection":
      draftReply = generateObjectionReply(firstName, company, context);
      break;
    case "not_now":
      draftReply = generateNotNowReply(firstName, company, context);
      break;
    case "unsubscribe":
      draftReply = generateUnsubscribeReply(firstName);
      break;
    default:
      draftReply = generateFallbackReply(firstName);
  }

  return { category, confidence, draftReply };
}

// ─── Reply Templates ─────────────────────────────────────

function generateInterestedReply(
  firstName: string,
  company: string,
  context: ReplyContext
): string {
  const text = context.inboundText.toLowerCase();

  // They want to talk/schedule
  if (/\b(talk|chat|call|connect|schedule|calendar)\b/.test(text)) {
    return `Hey ${firstName},

Let's do it. Here's my calendar — pick whatever works:
[CALENDAR_LINK]

If none of those times work, just throw out a time and I'll make it happen.

Talk soon,
Hannah`;
  }

  // They want to see something
  if (/\b(send|show|see|look)\b/.test(text)) {
    return `Hey ${firstName},

Awesome — here's the preview site I put together for ${company}:
[PREVIEW_LINK]

Take a look when you get a sec. If you want to keep it (it's free), I'll make it live in about 2 minutes. No strings.

Hannah`;
  }

  // Generic interested
  return `Hey ${firstName},

Great to hear. I put together a quick preview of what a RuufPro site would look like for ${company} — want me to send the link?

Takes about 5 mins to make it yours. Totally free, no catch.

Hannah`;
}

function generateQuestionReply(
  firstName: string,
  company: string,
  context: ReplyContext
): string {
  const text = context.inboundText.toLowerCase();

  // Pricing question
  if (/\b(cost|price|pricing|how much|fee|charge|pay)\b/.test(text)) {
    return `Hey ${firstName},

The website itself is completely free — no catch, no trial, just free.

If you want the estimate calculator + missed-call text-back + review automation, that's $149/mo. No contract, cancel anytime.

Most roofers start with the free site and add the paid tools once they see leads coming in. Want me to set up the free version first?

Hannah`;
  }

  // How does it work
  if (/\b(how (does|do)|work|explain|what is)\b/.test(text)) {
    return `Hey ${firstName},

Really simple — I built a preview of what your site would look like with RuufPro. Takes about 5 mins to make it yours.

Here's a quick Loom showing how it works: [LOOM_LINK]

Or if you'd rather just hop on a call: [CALENDAR_LINK]

Either way works for me.

Hannah`;
  }

  // Competitor comparison
  if (/\b(roofle|roofr|scorpion|competitor|different|compare|vs)\b/.test(text)) {
    return `Hey ${firstName},

Biggest differences:

- RuufPro includes a full website. Roofle is widget-only — you still need a site to put it on
- Roofle is $350/mo + $2K setup. RuufPro starts at $0 (free site) and $149/mo for the estimate widget
- No contracts with us. Roofle is annual

Happy to show you a side-by-side if that's helpful.

Hannah`;
  }

  // Generic question
  return `Hey ${firstName},

Good question. Let me give you the quick version:

[ANSWER_PLACEHOLDER — Hannah, customize this based on their specific question]

Want me to hop on a quick call to walk through it? Happy to answer anything.

Hannah`;
}

function generateObjectionReply(
  firstName: string,
  company: string,
  context: ReplyContext
): string {
  const text = context.inboundText.toLowerCase();

  // Already have a website
  if (/\b(already (have|got)|have a (website|site)|our (website|site))\b/.test(text)) {
    return `Hey ${firstName},

Totally get it — if your site's working for you, no need to change.

One thing worth knowing: Google just launched an "Online Estimates" filter that pushes roofers without online pricing lower in results. If you ever want to add that to your existing site, the widget embeds in about 2 minutes.

No rush. Just wanted you to know it's there.

Hannah`;
  }

  // Use competitor
  if (/\b(use|using|have|got) (roofle|roofr|scorpion|ghl|highlevel)\b/.test(text)) {
    const competitor = text.match(/\b(roofle|roofr|scorpion|ghl|highlevel)\b/i)?.[0] || "that";
    return `Hey ${firstName},

Makes sense — ${competitor} is solid for what they do.

Just curious: are you getting online estimate leads from it? That's the one thing I keep hearing roofers want that most tools don't do well. If you ever want a second opinion, happy to chat.

Either way, nice chatting.

Hannah`;
  }

  // Generic objection
  return `Hey ${firstName},

Totally understand — appreciate you letting me know.

If anything changes down the road or you want a second set of eyes on your online presence, I'm always around. No pressure.

Wishing you a solid season.

Hannah`;
}

function generateNotNowReply(
  firstName: string,
  company: string,
  context: ReplyContext
): string {
  return `Hey ${firstName},

Totally fair — no rush at all.

I'll circle back in a couple months. In the meantime, I put together a free site preview for ${company} — no commitment, just so you can see what it'd look like whenever you're ready.

Want me to send the link, or just check back later?

Hannah`;
}

function generateUnsubscribeReply(firstName: string): string {
  return `Hey ${firstName},

Done — removed you from everything. Sorry for the bother.

If you ever need anything down the road, I'm here.

Hannah`;
}

function generateFallbackReply(firstName: string): string {
  return `Hey ${firstName},

Thanks for getting back to me.

[HANNAH — I wasn't sure how to read this one. Please customize this reply.]

Hannah`;
}
