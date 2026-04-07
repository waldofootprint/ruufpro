#!/usr/bin/env python3
"""
Enrich roofing contractor prospects with owner name + email via Apollo.io API.

Reads CSV from find_prospects.py, calls Apollo People Enrichment API,
fills in owner_name and email columns, outputs enriched CSV.

Usage:
    python tools/enrich_prospects.py --csv .tmp/prospects/dallas_tx_20260407.csv
    python tools/enrich_prospects.py --csv .tmp/prospects/dallas_tx_20260407.csv --dry-run
    python tools/enrich_prospects.py --csv .tmp/prospects/dallas_tx_20260407.csv --limit 10

IMPORTANT: Apollo free tier = 50 credits/month. Each enrichment = 1 credit.
Always run --dry-run first to see how many credits you'll use.
"""

import argparse
import csv
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

APOLLO_API_KEY = os.getenv("APOLLO_API_KEY")
ENRICH_URL = "https://api.apollo.io/api/v1/people/match"
OUTPUT_DIR = Path(__file__).parent.parent / ".tmp" / "prospects"

# Rate limit: be gentle with the API
REQUEST_DELAY = 1.0  # seconds between calls


def extract_domain(website_url: str) -> str:
    """Extract clean domain from a website URL."""
    if not website_url or website_url == "none":
        return ""
    url = website_url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    try:
        parsed = urlparse(url)
        domain = parsed.netloc or parsed.path
        # Strip www.
        if domain.startswith("www."):
            domain = domain[4:]
        return domain
    except Exception:
        return ""


def enrich_person(business_name: str, domain: str, credit_count: list) -> dict:
    """
    Call Apollo People Enrichment API.
    Returns dict with owner_name and email, or empty strings if no match.
    Each call = 1 credit.
    """
    credit_count[0] += 1

    params = {
        "organization_name": business_name,
        "reveal_personal_emails": True,
    }
    if domain:
        params["domain"] = domain

    headers = {
        "accept": "application/json",
        "Content-Type": "application/json",
        "x-api-key": APOLLO_API_KEY,
    }

    try:
        resp = requests.post(ENRICH_URL, json=params, headers=headers, timeout=15)

        if resp.status_code == 429:
            print("    Rate limited — waiting 60s...")
            time.sleep(60)
            resp = requests.post(ENRICH_URL, json=params, headers=headers, timeout=15)

        if resp.status_code != 200:
            print(f"    API error {resp.status_code}: {resp.text[:200]}")
            return {"owner_name": "", "email": "", "status": "api_error"}

        data = resp.json()
        person = data.get("person")

        if not person:
            return {"owner_name": "", "email": "", "status": "no_match"}

        name = person.get("name", "") or ""
        email = person.get("email", "") or ""

        # Check personal emails if primary email is empty
        if not email:
            personal_emails = person.get("personal_emails", [])
            if personal_emails:
                email = personal_emails[0]

        title = person.get("title", "") or ""
        linkedin = person.get("linkedin_url", "") or ""

        return {
            "owner_name": name,
            "email": email,
            "title": title,
            "linkedin_url": linkedin,
            "status": "enriched" if email else "name_only",
        }

    except requests.exceptions.Timeout:
        print("    Request timed out")
        return {"owner_name": "", "email": "", "status": "timeout"}
    except Exception as e:
        print(f"    Error: {e}")
        return {"owner_name": "", "email": "", "status": "error"}


def main():
    parser = argparse.ArgumentParser(description="Enrich prospect CSV with Apollo email data")
    parser.add_argument("--csv", required=True, help="Path to prospect CSV from find_prospects.py")
    parser.add_argument("--limit", type=int, default=None, help="Max prospects to enrich (default: all)")
    parser.add_argument("--skip-has-email", action="store_true", help="Skip rows that already have an email")
    parser.add_argument("--dry-run", action="store_true", help="Show credit estimate without making API calls")
    args = parser.parse_args()

    if not APOLLO_API_KEY:
        print("ERROR: APOLLO_API_KEY not found in .env")
        print("Add it: APOLLO_API_KEY=your_key_here")
        sys.exit(1)

    csv_path = Path(args.csv)
    if not csv_path.exists():
        print(f"ERROR: File not found: {csv_path}")
        sys.exit(1)

    # Read prospects
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        prospects = list(reader)

    if not prospects:
        print("No prospects found in CSV.")
        return

    # Filter to rows needing enrichment
    to_enrich = []
    for p in prospects:
        if args.skip_has_email and p.get("email", "").strip():
            continue
        to_enrich.append(p)

    if args.limit:
        to_enrich = to_enrich[:args.limit]

    print(f"\nProspects in CSV: {len(prospects)}")
    print(f"To enrich: {len(to_enrich)}")
    print(f"Credits needed: {len(to_enrich)} (free tier = 50/month)")

    if args.dry_run:
        print("\n[DRY RUN] No API calls made.")
        return

    if len(to_enrich) == 0:
        print("Nothing to enrich.")
        return

    confirm = input("\nProceed? (y/N): ").strip().lower()
    if confirm != "y":
        print("Aborted.")
        return

    # Enrich each prospect
    credit_count = [0]
    enriched_count = 0
    name_only_count = 0
    no_match_count = 0

    for i, prospect in enumerate(to_enrich):
        business_name = prospect.get("business_name", "")
        website = prospect.get("website", "")
        domain = extract_domain(website)

        print(f"\n[{i+1}/{len(to_enrich)}] {business_name}")
        print(f"  Domain: {domain or '(none)'}")

        result = enrich_person(business_name, domain, credit_count)

        # Update the prospect in the original list
        prospect["owner_name"] = result["owner_name"] or prospect.get("owner_name", "")
        prospect["email"] = result["email"] or prospect.get("email", "")
        prospect["enrichment_needed"] = "no" if result["email"] else "manual"

        status = result["status"]
        if status == "enriched":
            enriched_count += 1
            print(f"  Found: {result['owner_name']} — {result['email']}")
            if result.get("title"):
                print(f"  Title: {result['title']}")
        elif status == "name_only":
            name_only_count += 1
            print(f"  Name found: {result['owner_name']} — no email")
        else:
            no_match_count += 1
            print(f"  No match ({status})")

        time.sleep(REQUEST_DELAY)

    # Write enriched CSV (new file, don't overwrite original)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    stem = csv_path.stem
    outfile = OUTPUT_DIR / f"{stem}_enriched_{timestamp}.csv"

    fieldnames = list(prospects[0].keys())
    with open(outfile, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(prospects)

    print(f"\n{'='*50}")
    print(f"Done! Credits used: {credit_count[0]}")
    print(f"  Enriched (name + email): {enriched_count}")
    print(f"  Name only (no email):    {name_only_count}")
    print(f"  No match:                {no_match_count}")
    print(f"  Hit rate:                {enriched_count}/{len(to_enrich)} ({100*enriched_count//max(len(to_enrich),1)}%)")
    print(f"\nOutput: {outfile}")
    print(f"\nNext steps:")
    print(f"  1. Manually research rows where enrichment_needed='manual'")
    print(f"  2. Run: python tools/generate_email_sequence.py --prospects {outfile}")


if __name__ == "__main__":
    main()
