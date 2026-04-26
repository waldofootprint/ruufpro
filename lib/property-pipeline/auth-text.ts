/**
 * Property Pipeline — direct-mail authorization clickwrap text.
 *
 * The roofer agrees to this verbatim text at PP opt-in. The text is sha256-hashed
 * and stored as a row in `direct_mail_authorization_versions`; the contractor row
 * links to that version_hash for ESIGN-reproducibility.
 *
 * RULES:
 *  - When the text changes, AUTH_VERSION must be bumped AND the new (text, hash)
 *    inserted as a new row. Never edit the text in place without bumping the version.
 *  - Hash is computed from the exact byte sequence of AUTH_TEXT — no normalization,
 *    no trimming, no whitespace collapse. The hash IS the contract.
 */
import { createHash } from "crypto";

export const AUTH_VERSION = "v1-2026-04-26";

export const AUTH_TEXT = `Direct-Mail Authorization (RuufPro Property Pipeline)

By checking this box, I authorize RuufPro to mail postcards on my behalf to homeowners in the ZIP codes I select, using the contractor business name, license number, mailing address, and phone number on my account.

I confirm that:
1. I am the licensed roofing contractor named on this account, or am authorized to act on the contractor's behalf.
2. The Florida license number on this account is current and accurate as registered with the Florida Department of Business and Professional Regulation.
3. I authorize RuufPro to print my license number, business name, business address, and phone number on every postcard mailed under this authorization, as required by Fla. Stat. §489.119.
4. I authorize RuufPro to print the verbatim §489.147(1)(a) consumer-protection disclosure on every postcard mailed under this authorization.
5. I will honor opt-out requests received via the postcard's printed opt-out URL, and acknowledge that RuufPro maintains a global suppression list that blocks future sends to opted-out addresses across all contractors on the platform.
6. I understand that this authorization remains in effect until I revoke it in writing or close my RuufPro account, and that I may revoke it at any time.

Authorization version: ${AUTH_VERSION}`;

export const AUTH_VERSION_HASH = createHash("sha256")
  .update(AUTH_TEXT, "utf8")
  .digest("hex");
