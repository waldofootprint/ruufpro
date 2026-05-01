// Daily cron: ingest IEM Local Storm Reports for FL.
// Schedule: "0 13 * * *" (08:00 ET — slightly after midnight UTC rollover)
// Source: https://mesonet.agron.iastate.edu/cgi-bin/request/gis/lsr.py
//
// Pulls last 7 days every run; PK on storm_events.event_id makes re-pulls
// idempotent. 7-day overlap covers IEM late corrections.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

export const maxDuration = 60;

interface IEMRow {
  VALID: string;
  LAT: string;
  LON: string;
  MAG: string;
  TYPECODE: string;
  TYPETEXT: string;
  CITY: string;
  COUNTY: string;
  STATE: string;
  REMARK: string;
  UGC: string;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const ets = now.toISOString().replace(/\.\d{3}Z$/, "Z");
  const sts = (() => {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d.toISOString().replace(/\.\d{3}Z$/, "Z");
  })();

  const url = `https://mesonet.agron.iastate.edu/cgi-bin/request/gis/lsr.py?state=FL&sts=${sts}&ets=${ets}&fmt=csv`;

  const resp = await fetch(url);
  if (!resp.ok) {
    return NextResponse.json(
      { error: `IEM fetch failed: ${resp.status}` },
      { status: 502 }
    );
  }

  const csv = await resp.text();
  const lines = csv.trim().split("\n");
  if (lines.length < 2) {
    return NextResponse.json({ fetched: 0, upserted: 0, note: "no events" });
  }

  const header = lines[0].split(",");
  const rows = lines.slice(1).map((line) => parseCsvRow(line, header));

  const records = rows
    .map((r) => {
      const valid = parseValid(r.VALID);
      if (!valid) return null;
      const lat = parseFloat(r.LAT);
      const lng = parseFloat(r.LON);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
      const typecode = (r.TYPETEXT || r.TYPECODE || "UNKNOWN").trim();
      const event_id = createHash("sha256")
        .update(`${valid.toISOString()}|${lat}|${lng}|${typecode}`)
        .digest("hex")
        .slice(0, 32);
      const magNum = r.MAG && r.MAG !== "None" ? parseFloat(r.MAG) : null;
      return {
        event_id,
        valid_at: valid.toISOString(),
        typecode,
        magnitude: Number.isFinite(magNum) ? magNum : null,
        lat,
        lng,
        zip: null,
        county: r.COUNTY || null,
        state: r.STATE || "FL",
        ugc: r.UGC || null,
        city: r.CITY || null,
        remark: r.REMARK || null,
        source: "iem_lsr",
      };
    })
    .filter(Boolean);

  let upserted = 0;
  const chunkSize = 500;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const { count, error } = await supabase
      .from("storm_events")
      .upsert(chunk, {
        onConflict: "event_id",
        ignoreDuplicates: true,
        count: "exact",
      });
    if (error) {
      return NextResponse.json(
        { error: error.message, upserted },
        { status: 500 }
      );
    }
    upserted += count ?? 0;
  }

  return NextResponse.json({
    fetched: records.length,
    upserted,
    window: { sts, ets },
  });
}

function parseCsvRow(line: string, header: string[]): IEMRow {
  const out = {} as Record<string, string>;
  const cells: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"' && line[i + 1] === '"') {
      cur += '"';
      i++;
      continue;
    }
    if (c === '"') {
      inQ = !inQ;
      continue;
    }
    if (c === "," && !inQ) {
      cells.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  cells.push(cur);
  for (let i = 0; i < header.length; i++) out[header[i]] = cells[i] ?? "";
  return out as unknown as IEMRow;
}

function parseValid(s: string): Date | null {
  if (!s || s.length < 12) return null;
  const y = +s.slice(0, 4),
    mo = +s.slice(4, 6) - 1,
    d = +s.slice(6, 8);
  const h = +s.slice(8, 10),
    mi = +s.slice(10, 12);
  const dt = new Date(Date.UTC(y, mo, d, h, mi));
  return Number.isNaN(dt.getTime()) ? null : dt;
}
