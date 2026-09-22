/**
 * Runnable self-check for the bulk-request helpers.
 *   npx tsx lib/bulk-requests.check.ts
 */
import assert from "node:assert/strict";
import { dateForMonth, maxBulkRows, parseBulkRows } from "./bulk-requests";

const now = new Date(2026, 8, 21); // 2026-09-21

// dateForMonth
assert.equal(dateForMonth("2026-09", now), "2026-09-21", "current month → today");
assert.equal(dateForMonth("2026-07", now), "2026-07-31", "past month → last day");
assert.equal(dateForMonth("2026-02", now), "2026-02-28", "short month");
assert.equal(dateForMonth("2024-02", now), "2024-02-29", "leap month");
assert.throws(() => dateForMonth("2026-10", now), /future/, "next month rejected");
assert.throws(() => dateForMonth("2026-13", now), /Invalid month/, "month 13");
assert.throws(() => dateForMonth("2026-9", now), /Invalid month/, "unpadded month");
assert.throws(() => dateForMonth("", now), /Invalid month/, "empty month");

// parseBulkRows
assert.deepEqual(
  parseBulkRows([" A ", "", "B"], [" n1 ", "", "n2"]),
  [
    { title: "A", notionId: "n1" },
    { title: "B", notionId: "n2" },
  ],
  "trims values and drops fully blank rows",
);
assert.throws(
  () => parseBulkRows(["A", "B"], ["n1", ""]),
  /Notion ID is required on row 2/,
  "row number matches the form",
);
assert.throws(
  () => parseBulkRows(["A", "", "C"], ["n1", "n2", "n3"]),
  /Title is required on row 2/,
  "notionId without title keeps its original row number",
);
assert.throws(() => parseBulkRows([], []), /at least one/, "no rows");
assert.throws(() => parseBulkRows(["", "  "], ["", ""]), /at least one/, "all blank");
const many = Array.from({ length: maxBulkRows + 1 }, (_, i) => `t${i}`);
assert.throws(() => parseBulkRows(many, many), /at most 50/, "over the cap");
assert.equal(parseBulkRows(many.slice(1), many.slice(1)).length, maxBulkRows, "at the cap");

console.log("bulk-requests: OK");
