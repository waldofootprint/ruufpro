// CSV read/write helpers for prospect management tools.

import { readFileSync, writeFileSync } from "fs";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

/**
 * Read a CSV file and return an array of objects.
 */
export function readCsv(filePath) {
  const content = readFileSync(filePath, "utf-8");
  return parse(content, { columns: true, skip_empty_lines: true, trim: true });
}

/**
 * Write an array of objects to a CSV file.
 */
export function writeCsv(filePath, records, columns) {
  const output = stringify(records, {
    header: true,
    columns: columns || Object.keys(records[0] || {}),
  });
  writeFileSync(filePath, output, "utf-8");
  console.log(`Wrote ${records.length} rows to ${filePath}`);
}
