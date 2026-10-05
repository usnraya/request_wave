/**
 * Runnable self-check for the Markdown import helpers.
 *   npx tsx lib/markdown-import.check.ts
 */
import assert from "node:assert/strict";
import {
  classifyMarkdownRows,
  existingKey,
  parseTaskMarkdown,
  summarizeMarkdownRows,
} from "./markdown-import";

const categories = [
  { id: "content-social", name: "Content Media Social" },
  { id: "campaign", name: "Campaign / Event" },
  { id: "merchandise", name: "Merchandise / Property Event" },
  { id: "meta", name: "Meta Ads / Custom Ads" },
];
const teams = [
  { id: "overseas", name: "Overseas", shortName: "OVS" },
  { id: "marketing-online", name: "Marketing Team Online", shortName: "MKT" },
  { id: "academy", name: "Timedoor Academy", shortName: "TDA" },
];

const md = `# Task Design

| ID | Task | Lokasi | Area | Output |
|---|---|---|---|---|
| DESIGN-1 | ✅Edit - Ads | [Overseas] Mena, [Team] Marketing Team (Online), [Team] Overseas | Meta Ads / Custom Ads | 1 | Aug 5 → Aug 7 |
| DESIGN-2 | Design A | Timedoor Academy | Content Media Social | 2 |
| DESIGN-3 | Design B | [Team] Overseas | Campaign/Event | 3 |
| DESIGN-4 | Design C | [Team] Overseas | Content Media Social |  |
| DESIGN-5 | Design D | [Team] Overseas | Property Event / Merchandise | 1 |
| DESIGN-6 | Design E | [Team] Overseas | Unknown Area | 1 |
| DESIGN-3 | Design B again | [Team] Overseas | Campaign/Event | 1 |
| DESIGN-7 | Design F | [Team] Overseas | Content Media Social | 1 |
| DESIGN-8 | Design G | [Team] Overseas | Content Media Social | 1 |
| DESIGN-9 | Design H | [Team] Nowhere | Content Media Social | 1 |
| DESIGN-10 | Design I | Bali | Content Media Social | 1 |
`;

const source = parseTaskMarkdown(md);
assert.equal(source.length, 11, "only table rows with DESIGN ids are parsed");
assert.equal(source[0].title, "✅Edit - Ads", "title kept verbatim");
assert.equal(source[3].outputCount, null, "blank output kept as null");

const existing = new Set([existingKey("overseas", "DESIGN-7")]);
const rows = classifyMarkdownRows(source, { month: "2025-08", teams, categories, existing });
const of = (id: string) => rows.filter((row) => row.notionId === id);

assert.deepEqual(of("DESIGN-1").map((r) => [r.teamId, r.status]), [["marketing-online", "new"], ["overseas", "new"]], "shared row copied per team");
assert.equal(of("DESIGN-1")[0].date, "2025-08-31", "selected month end is authoritative");
assert.equal(of("DESIGN-2")[0].teamId, "academy", "bare team name resolves");
assert.equal(of("DESIGN-3")[0].status, "new");
assert.equal(of("DESIGN-3")[0].categoryId, "campaign", "Campaign/Event alias");
assert.equal(of("DESIGN-3")[0].date, "2025-08-31", "selected month remains authoritative without a deadline");
assert.equal(of("DESIGN-4")[0].status, "invalid", "blank output rejected");
assert.equal(of("DESIGN-5")[0].categoryId, "merchandise", "Property Event / Merchandise alias");
assert.match(of("DESIGN-6")[0].reason ?? "", /Unknown Work Area/);
assert.equal(of("DESIGN-3")[1].status, "invalid", "duplicate ID inside file rejected");
assert.equal(of("DESIGN-7")[0].status, "duplicate", "existing team ID skipped");
assert.equal(of("DESIGN-8")[0].date, "2025-08-31", "missing deadline still uses selected month");
assert.match(of("DESIGN-9")[0].reason ?? "", /Unknown team/);
assert.match(of("DESIGN-10")[0].reason ?? "", /No team found/);

const summary = summarizeMarkdownRows(rows);
assert.equal(summary.newRows, 6, "new rows");
assert.equal(summary.newOutputs, 9, "new outputs");
assert.equal(summary.duplicateRows, 1);
assert.deepEqual(summary.byTeam["Overseas"], { rows: 4, outputs: 6 });

const locked = classifyMarkdownRows(source.slice(0, 2), { month: "2025-08", teams, categories, existing, onlyTeamId: "overseas" });
assert.deepEqual(locked.map((r) => r.status), ["invalid", "new", "invalid"], "team page keeps only its own team");

assert.throws(() => classifyMarkdownRows(source, { month: "2026-13", teams, categories, existing }), "invalid month rejected");

console.log("markdown-import: OK");
