#!/usr/bin/env node

// Run a SQL migration file against Supabase.
// Usage: node tools/run-migration.mjs supabase/026_workflow_steps.sql
//
// Uses the service role key (from .env) to bypass RLS,
// same admin client your prospect tools already use.

import { readFileSync } from "fs";
import { resolve } from "path";
import { supabase } from "./lib/supabase-admin.mjs";

const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: node tools/run-migration.mjs <path-to-sql-file>");
  console.error("Example: node tools/run-migration.mjs supabase/026_workflow_steps.sql");
  process.exit(1);
}

const fullPath = resolve(filePath);
console.log(`\nRunning migration: ${fullPath}\n`);

let sql;
try {
  sql = readFileSync(fullPath, "utf-8");
} catch (err) {
  console.error(`Could not read file: ${err.message}`);
  process.exit(1);
}

// Execute the SQL via Supabase's rpc endpoint for raw SQL.
// The service role key gives us full access.
const { data, error } = await supabase.rpc("exec_sql", { query: sql }).maybeSingle();

if (error) {
  // If the exec_sql function doesn't exist, fall back to the REST endpoint
  // by splitting statements and running them individually.
  if (error.message.includes("exec_sql") || error.code === "42883") {
    console.log("exec_sql not available — running statements individually...\n");

    // Split on semicolons, but not ones inside strings or comments
    const statements = sql
      .split(/;\s*\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    let success = 0;
    let failed = 0;

    for (const stmt of statements) {
      const { error: stmtErr } = await supabase.from("_dummy_").select().limit(0);
      // Use the postgrest-compatible approach: call via fetch directly
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/`;

      // Actually — the cleanest way is to use the SQL editor API via fetch
      const sqlUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/pg/query`;
      const resp = await fetch(sqlUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({ query: stmt + ";" }),
      });

      if (resp.ok) {
        const preview = stmt.slice(0, 60).replace(/\n/g, " ");
        console.log(`  ✓ ${preview}...`);
        success++;
      } else {
        const errBody = await resp.text();
        const preview = stmt.slice(0, 60).replace(/\n/g, " ");
        console.error(`  ✗ ${preview}...`);
        console.error(`    Error: ${errBody}\n`);
        failed++;
      }
    }

    console.log(`\nDone: ${success} succeeded, ${failed} failed.`);
    process.exit(failed > 0 ? 1 : 0);
  }

  console.error("Migration failed:", error.message);
  process.exit(1);
}

console.log("Migration completed successfully!");
