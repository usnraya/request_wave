/**
 * Runnable self-check for the bulk-request helpers.
 *   npx tsx lib/bulk-requests.check.ts
 */
import assert from "node:assert/strict";
import { dateForMonth, maxBulkRows, monthDateRange, parseBulkRows } from "./bulk-requests";

const now = new Date(2026, 8, 21); // 2026-09-21

// dateForMonth
assert.equal(dateForMonth("2026-09", now), "2026-09-21", "current month → today");
assert.equal(dateForMonth("2026-07", now), "2026-07-31", "past month → last day");
assert.equal(dateForMonth("2026-02", now), "2026-02-28", "short month");
assert.equal(dateForMonth("2024-02", now), "2024-02-29", "leap month");
assert.equal(dateForMonth("2026-12", now), "2026-12-31", "later month → last day");
assert.throws(() => dateForMonth("2026-13", now), /Invalid month/, "month 13");
assert.throws(() => dateForMonth("2026-9", now), /Invalid month/, "unpadded month");
assert.throws(() => dateForMonth("", now), /Invalid month/, "empty month");

// monthDateRange
assert.deepEqual(monthDateRange("2026-09"), { start: "2026-09-01", end: "2026-10-01" });
assert.deepEqual(monthDateRange("2026-12"), { start: "2026-12-01", end: "2027-01-01" });
assert.throws(() => monthDateRange("2026-9"), /Invalid month/, "unpadded range month");

// parseBulkRows
assert.deepEqual(
  parseBulkRows([" A ", "", "B"], [" n1 ", "", "n2"], [" 2 ", "", "1"]),
  [
    { title: "A", notionId: "n1", outputCount: 2 },
    { title: "B", notionId: "n2", outputCount: 1 },
  ],
  "trims values, drops fully blank rows, parses outputs",
);
assert.throws(
  () => parseBulkRows(["A", "B"], ["n1", ""], ["1", "1"]),
  /Notion ID is required on row 2/,
  "row number matches the form",
);
assert.throws(
  () => parseBulkRows(["A", "", "C"], ["n1", "n2", "n3"], ["1", "1", "1"]),
  /Title is required on row 2/,
  "notionId without title keeps its original row number",
);
assert.throws(() => parseBulkRows([], [], []), /at least one/, "no rows");
assert.throws(() => parseBulkRows(["", "  "], ["", ""], ["", ""]), /at least one/, "all blank");
const many = Array.from({ length: maxBulkRows + 1 }, (_, i) => `t${i}`);
const manyOutputs = many.map(() => "1");
assert.throws(() => parseBulkRows(many, many, manyOutputs), /at most 50/, "over the cap");
assert.equal(
  parseBulkRows(many.slice(1), many.slice(1), manyOutputs.slice(1)).length,
  maxBulkRows,
  "at the cap",
);

// outputCount validation
assert.throws(
  () => parseBulkRows(["A"], ["n1"], ["0"]),
  /Outputs must be a positive whole number on row 1/,
  "zero rejected",
);
assert.throws(
  () => parseBulkRows(["A"], ["n1"], ["-1"]),
  /Outputs must be a positive whole number on row 1/,
  "negative rejected",
);
assert.throws(
  () => parseBulkRows(["A"], ["n1"], ["1.5"]),
  /Outputs must be a positive whole number on row 1/,
  "decimal rejected",
);
assert.throws(
  () => parseBulkRows(["A"], ["n1"], [""]),
  /Outputs must be a positive whole number on row 1/,
  "missing rejected",
);
assert.throws(
  () => parseBulkRows(["A"], ["n1"], ["abc"]),
  /Outputs must be a positive whole number on row 1/,
  "non-numeric rejected",
);

console.log("bulk-requests: OK");
