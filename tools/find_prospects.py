#!/usr/bin/env python3
"""
Find roofing contractor prospects using Google Maps Places API.

Usage:
    python tools/find_prospects.py --metro "Dallas" --state "TX" --limit 100
    python tools/find_prospects.py --metro "Houston" --state "TX" --limit 50 --filter no_website
    python tools/find_prospects.py --metro "Austin" --state "TX" --radius 25 --filter has_website

IMPORTANT: Google Maps API charges per request. Each text search = $0.032.
Each place details call = $0.017. Announce before running on large batches.
"""

import argparse
import csv
import os
import sys
import time
from datetime import datetime
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
OUTPUT_DIR = Path(__file__).parent.parent / ".tmp" / "prospects"

PLACES_TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"
PLACES_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"

# Fields to fetch from Places Details API (controls cost)
DETAIL_FIELDS = "name,formatted_phone_number,website,formatted_address,rating,user_ratings_total,types,business_status"


def search_places(query: str, page_token: str = None) -> dict:
    """Run a Places Text Search. Each call = ~$0.032."""
    params = {"query": query, "key": GOOGLE_API_KEY, "type": "roofing_contractor"}
    if page_token:
        params["pagetoken"] = page_token
    resp = requests.get(PLACES_TEXT_SEARCH_URL, params=params, timeout=10)
    resp.raise_for_status()
    return resp.json()


def get_place_details(place_id: str) -> dict:
    """Fetch place details. Each call = ~$0.017."""
    params = {"place_id": place_id, "fields": DETAIL_FIELDS, "key": GOOGLE_API_KEY}
    resp = requests.get(PLACES_DETAILS_URL, params=params, timeout=10)
    resp.raise_for_status()
    return resp.json().get("result", {})


def assess_website(url) -> str:
    """Rough quality assessment based on URL patterns."""
    if not url:
        return "none"
    url_lower = url.lower()
    # Weak website signals
    weak_signals = ["facebook.com", "yelp.com", "yellowpages", "angieslist", "homeadvisor", "thumbtack"]
    for signal in weak_signals:
        if signal in url_lower:
            return "directory_only"
    # Free website builder signals
    free_builders = ["wix.com", "weebly.com", "squarespace.com", "wordpress.com", "godaddysites", "site123", "jimdo"]
    for builder in free_builders:
        if builder in url_lower:
            return "free_builder"
    return "has_website"


def fetch_all_prospects(city: str, state: str, limit: int, api_call_count: list) -> list:
    """Pull prospects from Google Maps with pagination. Returns raw list."""
    query = f"roofing contractor {city} {state}"
    prospects = []
    page_token = None

    print(f"\nSearching: '{query}'")

    while len(prospects) < limit:
        if page_token:
            # Google requires a short delay before using next_page_token
            time.sleep(2)

        api_call_count[0] += 1
        print(f"  [API call #{api_call_count[0]}] Text search (page {'1' if not page_token else 'next'}) ~$0.032")
        data = search_places(query, page_token)

        if data.get("status") not in ("OK", "ZERO_RESULTS"):
            print(f"  Error from Places API: {data.get('status')} — {data.get('error_message', '')}")
            break

        results = data.get("results", [])
        if not results:
            break

        for r in results:
            if len(prospects) >= limit:
                break
            prospects.append({
                "place_id": r.get("place_id"),
                "name": r.get("name", ""),
                "address": r.get("formatted_address", ""),
                "rating": r.get("rating", ""),
                "user_ratings_total": r.get("user_ratings_total", 0),
            })

        page_token = data.get("next_page_token")
        if not page_token:
            break

    return prospects


def enrich_prospect(prospect: dict, city: str, state: str, api_call_count: list) -> dict:
    """Fetch place details to get phone + website."""
    api_call_count[0] += 1
    print(f"  [API call #{api_call_count[0]}] Details for '{prospect['name']}' ~$0.017")
    details = get_place_details(prospect["place_id"])

    phone = details.get("formatted_phone_number", "")
    website = details.get("website", "")
    website_status = assess_website(website)

    return {
        "business_name": prospect["name"],
        "owner_name": "",  # Not available from Places API — hand-enrich or use Apollo
        "email": "",       # Not available from Places API — use Apollo or manual
        "phone": phone,
        "website": website or "none",
        "website_status": website_status,
        "city": city,
        "state": state,
        "google_rating": prospect.get("rating", ""),
        "google_review_count": prospect.get("user_ratings_total", 0),
        "address": prospect.get("address", ""),
        "source": "google_maps",
        "scraped_at": datetime.now().isoformat(),
        "enrichment_needed": "yes" if not website else "email_only",
    }


def main():
    parser = argparse.ArgumentParser(description="Find roofing contractor prospects via Google Maps")
    parser.add_argument("--metro", required=True, help="City name (e.g. 'Dallas')")
    parser.add_argument("--state", required=True, help="State abbreviation (e.g. 'TX')")
    parser.add_argument("--limit", type=int, default=50, help="Max prospects to fetch (default: 50)")
    parser.add_argument(
        "--filter",
        choices=["no_website", "has_website", "weak_website", "all"],
        default="all",
        help="Filter by website presence. 'weak_website' = directory listings or free builders. Default: all",
    )
    parser.add_argument("--dry-run", action="store_true", help="Show cost estimate without making API calls")
    args = parser.parse_args()

    if not GOOGLE_API_KEY:
        print("ERROR: GOOGLE_API_KEY not found in .env")
        sys.exit(1)

    # Estimate cost before running
    estimated_search_calls = max(1, args.limit // 20)  # ~20 results per text search page
    estimated_detail_calls = args.limit
    estimated_cost = (estimated_search_calls * 0.032) + (estimated_detail_calls * 0.017)
    print(f"\nCost estimate for {args.limit} prospects in {args.metro}, {args.state}:")
    print(f"  ~{estimated_search_calls} text search calls  @ $0.032 each = ${estimated_search_calls * 0.032:.3f}")
    print(f"  ~{estimated_detail_calls} place detail calls @ $0.017 each = ${estimated_detail_calls * 0.017:.3f}")
    print(f"  Total estimated cost: ~${estimated_cost:.2f}")

    if args.dry_run:
        print("\n[DRY RUN] No API calls made.")
        return

    confirm = input("\nProceed? (y/N): ").strip().lower()
    if confirm != "y":
        print("Aborted.")
        return

    api_call_count = [0]

    # Step 1: Search
    raw = fetch_all_prospects(args.metro, args.state, args.limit, api_call_count)
    print(f"\nFound {len(raw)} places. Fetching details...")

    # Step 2: Enrich with details
    enriched = []
    for i, prospect in enumerate(raw):
        row = enrich_prospect(prospect, args.metro, args.state, api_call_count)
        enriched.append(row)
        if (i + 1) % 10 == 0:
            print(f"  Enriched {i+1}/{len(raw)}...")
        time.sleep(0.1)  # Be gentle with the API

    # Step 3: Apply filter
    filter_map = {
        "no_website": lambda r: r["website_status"] == "none",
        "has_website": lambda r: r["website_status"] == "has_website",
        "weak_website": lambda r: r["website_status"] in ("none", "directory_only", "free_builder"),
        "all": lambda r: True,
    }
    filtered = [r for r in enriched if filter_map[args.filter](r)]
    print(f"\nAfter filter '{args.filter}': {len(filtered)} prospects")

    # Step 4: Save to CSV
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    slug = f"{args.metro.lower().replace(' ', '_')}_{args.state.lower()}"
    outfile = OUTPUT_DIR / f"{slug}_{timestamp}.csv"

    fieldnames = [
        "business_name", "owner_name", "email", "phone", "website", "website_status",
        "city", "state", "google_rating", "google_review_count", "address",
        "source", "scraped_at", "enrichment_needed",
    ]
    with open(outfile, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(filtered)

    total_cost = (api_call_count[0] * 0.017) + (estimated_search_calls * (0.032 - 0.017))
    print(f"\nDone!")
    print(f"  Total API calls: {api_call_count[0]}")
    print(f"  Output: {outfile}")
    print(f"  Prospects saved: {len(filtered)}")
    print(f"\nNext steps:")
    print(f"  1. Manually enrich rows where enrichment_needed='yes' (add owner name, email)")
    print(f"  2. Use Apollo.io free tier for email enrichment on rows with phone but no email")
    print(f"  3. Run: python tools/generate_email_sequence.py --prospects {outfile}")


if __name__ == "__main__":
    main()
