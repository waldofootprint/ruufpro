#!/usr/bin/env node

// Apply a SQL migration via Supabase Management API.
// Replaces tools/run-migration.mjs which couldn't run DDL/DCL/COMMENT.
//
// Usage:
//   node tools/run-migration-mgmt.mjs supabase/096_storm_events.sql
//   node tools/run-migration-mgmt.mjs supabase/foo.sql --project geospatial
//
// Project flag:
//   --project main         (default) → comcpamnxjtldlnnudqc
//   --project geospatial   → vfmnjwpjxamtbuehmtrv

import { readFileSync } from "fs";
import { resolve } from "path";
import { runSql, MAIN_PROJECT_REF, GEOSPATIAL_PROJECT_REF } from "./lib/supabase-sql.mjs";

const args = process.argv.slice(2);
const filePath = args.find((a) => !a.startsWith("--"));
const projectFlag = args[args.indexOf("--project") + 1];

if (!filePath) {
  console.error("Usage: node tools/run-migration-mgmt.mjs <path-to-sql-file> [--project main|geospatial]");
  process.exit(1);
}

const projectRef =
  projectFlag === "geospatial" ? GEOSPATIAL_PROJECT_REF : MAIN_PROJECT_REF;

const fullPath = resolve(filePath);
console.log(`\nApplying ${fullPath}`);
console.log(`Project: ${projectRef}\n`);

const sql = readFileSync(fullPath, "utf-8");

try {
  const result = await runSql(sql, projectRef);
  console.log("✓ Migration applied successfully.");
  if (Array.isArray(result) && result.length > 0) {
    console.log(`  rows returned: ${result.length}`);
  }
} catch (err) {
  console.error("✗ Migration failed.");
  console.error(err.message);
  process.exit(1);
}
