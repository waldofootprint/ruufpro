// Run raw SQL against Supabase via the Management API.
// Works for arbitrary SQL (DDL, DML, COMMENT, CREATE POLICY, etc.) — unlike
// the PostgREST client which can only do row CRUD.
//
// Requires SUPABASE_ACCESS_TOKEN in .env (personal access token from
// https://supabase.com/dashboard/account/tokens).
//
// Usage:
//   import { runSql, MAIN_PROJECT_REF, GEOSPATIAL_PROJECT_REF } from "./lib/supabase-sql.mjs";
//   const rows = await runSql("SELECT 1", MAIN_PROJECT_REF);

import { config } from "dotenv";
config({ path: new URL("../../.env", import.meta.url).pathname });

export const MAIN_PROJECT_REF = "comcpamnxjtldlnnudqc";
export const GEOSPATIAL_PROJECT_REF = "vfmnjwpjxamtbuehmtrv";

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) {
  console.error("Missing SUPABASE_ACCESS_TOKEN in .env");
  process.exit(1);
}

export async function runSql(query, projectRef = MAIN_PROJECT_REF) {
  const resp = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  const text = await resp.text();
  if (!resp.ok) {
    const err = new Error(`Supabase SQL ${resp.status}: ${text}`);
    err.status = resp.status;
    err.body = text;
    throw err;
  }

  try { return JSON.parse(text); } catch { return text; }
}
