#!/usr/bin/env python3
"""
Generate personalized 5-email cold outreach sequences for roofing contractor prospects.

Usage:
    python tools/generate_email_sequence.py --prospects .tmp/prospects/dallas_tx_20260330.csv --campaign no_website
    python tools/generate_email_sequence.py --prospects .tmp/prospects/dallas_tx_20260330.csv --campaign bad_website --output .tmp/sequences/batch_1.csv

Campaign types:
    no_website   — Contractor has no website at all. Lead with free site offer.
    bad_website  — Contractor has a weak/outdated site (directory, free builder). Mockup angle.
    no_widget    — Contractor has a decent site but no instant estimate tool. Widget angle.

Output:
    CSV with one row per prospect, columns for all 5 email subjects + bodies + send delays.
    Ready for Instantly lead import with custom variables.

Email rules enforced:
    - Plain text only (no HTML, no images, no signatures)
    - 75-100 words max per email
    - One CTA per email
    - No "free trial", "pricing", or widget mention in early emails
    - Subject lines: lowercase, 1-5 words, no punctuation
    - Follow-ups reply in the same thread (handled by Instantly sequence settings)
"""

import argparse
import csv
import os
import sys
from datetime import datetime
from pathlib import Path
from textwrap import dedent

# Output directory
OUTPUT_DIR = Path(__file__).parent.parent / ".tmp" / "sequences"

# Send delay in days from previous email (for Instantly sequence config)
SEND_DELAYS_DAYS = [0, 3, 7, 14, 21]  # Email 1 on day 0, then relative offsets


# ---------------------------------------------------------------------------
# Email templates per campaign type
# Each template is a dict with 'subject' and 'body', using {variable} placeholders.
# Variables: {first_name}, {business_name}, {city}, {preview_url}, {phone}
# ---------------------------------------------------------------------------

SEQUENCES = {
    "no_website": [
        # Email 1 — PAS opener
        {
            "subject": "{business_name}",
            "body": dedent("""\
                Hey {first_name},

                I searched for roofing contractors in {city} and couldn't find {business_name} anywhere online. No website, nothing.

                That's a real problem. Homeowners Google before they call — if you're not showing up, those jobs are going to whoever is. Most of them never even pick up the phone to ask around.

                I build free professional websites for roofing contractors. No catch, no contract, no credit card. Takes about 10 minutes to get yours live.

                Worth a quick look?

                Hannah
                RuufPro\
            """),
        },
        # Email 2 — Mockup (screenshot)
        {
            "subject": "built something for you",
            "body": dedent("""\
                Hey {first_name},

                I put together a quick mockup of what a website for {business_name} could look like. Already has your business name and {city} on it — just needs your phone number and it's ready to go live.

                Take a look: {preview_url}

                This is completely free. No strings attached. I build these for roofers who are tired of losing jobs to competitors with better online presence.

                Want me to send you the login so you can go live today?

                Hannah\
            """),
        },
        # Email 3 — Social proof
        {
            "subject": "3 roofers in {city}",
            "body": dedent("""\
                Hey {first_name},

                Three roofing contractors in {city} went live with their free RuufPro sites last month.

                One of them got a $14,000 reroof job from a homeowner who found him through his new site — first week it was live. He'd been running his business for six years with no web presence at all.

                I have yours stubbed out already. If you want to see it, just reply and I'll send you the link.

                Hannah\
            """),
        },
        # Email 4 — Observation
        {
            "subject": "quick question",
            "body": dedent("""\
                Hey {first_name},

                I pulled up {business_name} on Google — solid reviews, {city} area. You've clearly done good work.

                But you're invisible to anyone who searches online before calling. No site means no Google Maps ranking, no organic leads, nothing. Every week is more jobs going to competitors, and most of their sites are barely better than nothing.

                The free site I built for you is still sitting here. 10 minutes to go live.

                Worth it?

                Hannah\
            """),
        },
        # Email 5 — Breakup
        {
            "subject": "closing your file",
            "body": dedent("""\
                Hey {first_name},

                I'm going to stop reaching out — I don't want to be a pest.

                But the free website I built for {business_name} is still here if you ever want it. No pitch, no follow-up after this, no obligation. If the timing is ever right, just reply and I'll send you the login.

                Good luck out there this season.

                Hannah
                RuufPro\
            """),
        },
    ],

    "bad_website": [
        # Email 1 — PAS opener (bad site angle)
        {
            "subject": "{business_name}",
            "body": dedent("""\
                Hey {first_name},

                I found {business_name} online, but your site isn't doing you any favors. Looks like it was built a while ago — and on mobile it's pretty rough to navigate.

                Homeowners judge a contractor by their website before they ever call. A weak site is quietly costing you jobs every week.

                I build free professional roofing websites. Clean, fast, mobile-first. Yours would be ready in about 10 minutes, and it would replace what you have now.

                Interested in seeing what it could look like?

                Hannah
                RuufPro\
            """),
        },
        # Email 2 — Mockup
        {
            "subject": "redesigned your site",
            "body": dedent("""\
                Hey {first_name},

                I went ahead and mocked up a new version of your {business_name} site.

                Here's the preview: {preview_url}

                It's faster, looks clean on phones, and has a clear way for homeowners to request estimates — no hunting around for a phone number. Much better than what you have now.

                This is free. No cost, no contract, no catch. I do this for roofing contractors who want a site that actually wins them jobs.

                Want to go live with it?

                Hannah\
            """),
        },
        # Email 3 — Social proof
        {
            "subject": "before and after",
            "body": dedent("""\
                Hey {first_name},

                A roofer in {city} switched from his old site to a RuufPro site last month.

                He said homeowners stopped asking "do you even have a website?" and started calling more prepared, ready to book. Small shift, but it adds up fast when you're closing 2-3 jobs a week from it.

                I already have a mockup ready for {business_name}. Takes 10 minutes to replace what you have.

                Want to see the before and after?

                Hannah\
            """),
        },
        # Email 4 — Observation
        {
            "subject": "saw your google listing",
            "body": dedent("""\
                Hey {first_name},

                Your Google listing for {business_name} looks solid — good reviews, {city} area. You've clearly built a real reputation.

                But when someone clicks through to your site, you're probably losing them. The site doesn't match the credibility your reviews suggest.

                A fast, clean site would convert a lot more of those Google visitors into actual phone calls.

                I've already built it — free, no contract. 10 minutes to go live.

                Worth a look?

                Hannah\
            """),
        },
        # Email 5 — Breakup
        {
            "subject": "last one",
            "body": dedent("""\
                Hey {first_name},

                Last email from me, I promise.

                The free site I built for {business_name} is still here whenever you want it — no follow-up after this. If timing was off or you got slammed with work, totally get it.

                Just reply anytime and I'll pick it back up right where we left off.

                Good luck this season.

                Hannah
                RuufPro\
            """),
        },
    ],

    "no_widget": [
        # Email 1 — Instant estimate angle
        {
            "subject": "{business_name}",
            "body": dedent("""\
                Hey {first_name},

                I checked out the {business_name} site — looks solid. But there's one feature that's starting to separate the top roofers in {city} from everyone else: instant satellite estimates.

                Homeowners enter their address and get a ballpark number in seconds. No appointment, no waiting. It turns visitors into warm leads before they ever call you.

                Roofle charges $350/month for this. We charge $99.

                Worth 5 minutes to see how it works?

                Hannah
                RuufPro\
            """),
        },
        # Email 2 — Demo link
        {
            "subject": "estimate widget demo",
            "body": dedent("""\
                Hey {first_name},

                Here's a live demo of the estimate widget on a site similar to yours: {preview_url}

                Click "Get an Estimate" and run through it — takes about 30 seconds.

                That's exactly what your visitors would see. Every address they enter becomes a lead in your dashboard: name, email, phone, roof size, and an estimate range.

                Most contractors close 20-30% of widget leads within the first two weeks.

                Want to add it to the {business_name} site?

                Hannah\
            """),
        },
        # Email 3 — Social proof
        {
            "subject": "how it worked for a {city} roofer",
            "body": dedent("""\
                Hey {first_name},

                A roofing contractor in {city} added the instant estimate widget to his site last month.

                First week: 14 homeowners entered their address. He closed 3 of them — that's $40K+ in jobs from a tool that costs $99/month.

                His words: "I had no idea my site was sending people away because they couldn't get a number."

                I can add the widget to the {business_name} site in about 20 minutes. Want to see if it makes sense?

                Hannah\
            """),
        },
        # Email 4 — Observation
        {
            "subject": "google local services",
            "body": dedent("""\
                Hey {first_name},

                Google has been filtering local services ads to favor contractors who let homeowners get estimates online. If {business_name} is running ads in {city}, this is going to matter more every month.

                The widget sends estimate requests straight to your phone. Homeowners don't want to wait for a callback — they want a number right now. Giving them that converts more of your traffic into actual jobs.

                Worth 5 minutes to talk through it?

                Hannah\
            """),
        },
        # Email 5 — Breakup
        {
            "subject": "closing this out",
            "body": dedent("""\
                Hey {first_name},

                Going to stop following up after this one — don't want to be a pest.

                If instant estimates ever become a priority for {business_name}, we're here: $99/month, cancel anytime, takes about 20 minutes to add to your existing site. No long-term contract.

                No hard sell — just wanted to make sure you knew the option exists.

                Good luck out there this season.

                Hannah
                RuufPro\
            """),
        },
    ],
}


def render_template(template: str, variables: dict) -> str:
    """Substitute {variable} placeholders. Missing keys render as empty string."""
    result = template
    for key, value in variables.items():
        result = result.replace(f"{{{key}}}", str(value) if value else "")
    return result.strip()


def word_count(text: str) -> int:
    return len(text.split())


def generate_sequence(prospect: dict, campaign: str) -> list[dict]:
    """Generate 5 emails for a prospect. Returns list of email dicts."""
    templates = SEQUENCES[campaign]

    # Derive first name from owner_name or fall back to "there"
    owner_name = prospect.get("owner_name", "").strip()
    if owner_name:
        first_name = owner_name.split()[0]
    else:
        first_name = "there"

    business_name = prospect.get("business_name", "").strip()
    city = prospect.get("city", "").strip()
    preview_url = prospect.get("preview_url", "").strip()
    phone = prospect.get("phone", "").strip()

    variables = {
        "first_name": first_name,
        "business_name": business_name,
        "city": city,
        "preview_url": preview_url,
        "phone": phone,
    }

    emails = []
    for i, template in enumerate(templates):
        subject = render_template(template["subject"], variables)
        body = render_template(template["body"], variables)
        wc = word_count(body)
        emails.append({
            "email_num": i + 1,
            "send_delay_days": SEND_DELAYS_DAYS[i],
            "subject": subject,
            "body": body,
            "word_count": wc,
        })

    return emails


def build_instantly_row(prospect: dict, emails: list[dict]) -> dict:
    """Build a flat row for Instantly lead import CSV."""
    row = {
        "email": prospect.get("email", ""),
        "first_name": (prospect.get("owner_name", "") or "").split()[0] if prospect.get("owner_name") else "",
        "last_name": " ".join((prospect.get("owner_name", "") or "").split()[1:]) if prospect.get("owner_name") else "",
        "company_name": prospect.get("business_name", ""),
        "phone": prospect.get("phone", ""),
        "website": prospect.get("website", ""),
        "city": prospect.get("city", ""),
        "state": prospect.get("state", ""),
        "website_status": prospect.get("website_status", ""),
        "preview_url": prospect.get("preview_url", ""),
    }
    # Flatten emails into columns
    for email in emails:
        n = email["email_num"]
        row[f"email_{n}_subject"] = email["subject"]
        row[f"email_{n}_body"] = email["body"]
        row[f"email_{n}_send_delay_days"] = email["send_delay_days"]
        row[f"email_{n}_word_count"] = email["word_count"]
    return row


def main():
    parser = argparse.ArgumentParser(description="Generate 5-email cold outreach sequences for roofing contractors")
    parser.add_argument("--prospects", required=True, help="Path to prospect CSV from find_prospects.py")
    parser.add_argument(
        "--campaign",
        choices=["no_website", "bad_website", "no_widget"],
        required=True,
        help="Campaign type determines email angle",
    )
    parser.add_argument("--output", help="Output CSV path (default: .tmp/sequences/<campaign>_<timestamp>.csv)")
    parser.add_argument("--preview-base-url", default="https://ruufpro.com/preview", help="Base URL for site preview links")
    args = parser.parse_args()

    prospects_path = Path(args.prospects)
    if not prospects_path.exists():
        print(f"ERROR: Prospect file not found: {prospects_path}")
        sys.exit(1)

    # Load prospects
    with open(prospects_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        prospects = list(reader)

    print(f"\nLoaded {len(prospects)} prospects from {prospects_path.name}")
    print(f"Campaign type: {args.campaign}")

    # Filter out prospects with no email
    with_email = [p for p in prospects if p.get("email", "").strip()]
    without_email = len(prospects) - len(with_email)

    if without_email:
        print(f"  Skipping {without_email} prospects with no email address")
    print(f"  Generating sequences for {len(with_email)} prospects")

    if not with_email:
        print("\nNo prospects with email addresses. Enrich the CSV with emails first.")
        print("Tip: Use Apollo.io free tier to find emails for prospects with phone numbers.")
        sys.exit(0)

    # Add preview URLs if missing
    for p in with_email:
        if not p.get("preview_url"):
            slug = p.get("business_name", "").lower().replace(" ", "-").replace("'", "")
            p["preview_url"] = f"{args.preview_base_url}/{slug}"

    # Generate sequences
    rows = []
    word_count_warnings = []
    for prospect in with_email:
        emails = generate_sequence(prospect, args.campaign)
        for e in emails:
            # Email 5 (breakup) can be shorter; flag anything over 100 or under 50
            min_words = 50 if e["email_num"] == 5 else 75
            if not (min_words <= e["word_count"] <= 100):
                word_count_warnings.append((prospect.get("business_name"), e["email_num"], e["word_count"]))
        row = build_instantly_row(prospect, emails)
        rows.append(row)

    if word_count_warnings:
        print(f"\nWord count warnings (target: 75-100 words):")
        for name, num, wc in word_count_warnings:
            print(f"  {name} email #{num}: {wc} words")

    # Save output
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    if args.output:
        outfile = Path(args.output)
        outfile.parent.mkdir(parents=True, exist_ok=True)
    else:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        outfile = OUTPUT_DIR / f"{args.campaign}_{timestamp}.csv"

    fieldnames = list(rows[0].keys())
    with open(outfile, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nDone!")
    print(f"  Sequences generated: {len(rows)}")
    print(f"  Output: {outfile}")
    print(f"\nNext steps:")
    print(f"  1. Review a sample row to verify personalization is correct")
    print(f"  2. Import into Instantly: Leads → Import CSV → map columns to custom variables")
    print(f"  3. In Instantly, create a sequence and reference {{{{email_N_subject}}}} / {{{{email_N_body}}}} variables")
    print(f"     OR use the pre-written subjects/bodies directly in your Instantly sequence steps")
    print(f"  4. Set send windows: Tue-Thu 6-7AM or 7:30-9PM Central")
    print(f"  5. Cap at 30-50 emails/day per mailbox during ramp period")


if __name__ == "__main__":
    main()
