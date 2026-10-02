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

| ID | Task Title | Output Task | Usage Location | Project / Work Area | Due Date |
|---|---|---|---|---|---|
| DESIGN-1 | ✅Edit - Ads | 1 | [Overseas] Mena, [Team] Marketing Team (Online), [Team] Overseas | Meta Ads / Custom Ads | Aug 5 → Aug 7 |
| DESIGN-2 | Design A | 2 | Timedoor Academy | Content Media Social | Aug 30 → Aug 31 |
| DESIGN-3 | Design B | 3 | [Team] Overseas | Campaign/Event | Aug 31 → Sep 1 |
| DESIGN-4 | Design C |  | [Team] Overseas | Content Media Social | Aug 21 |
| DESIGN-5 | Design D | 1 | [Team] Overseas | Property Event / Merchandise | Aug 19 |
| DESIGN-6 | Design E | 1 | [Team] Overseas | Unknown Area | Aug 19 |
| DESIGN-3 | Design B again | 1 | [Team] Overseas | Campaign/Event | Aug 1 |
| DESIGN-7 | Design F | 1 | [Team] Overseas | Content Media Social | Aug 20 |
| DESIGN-8 | Design G | 1 | [Team] Overseas | Content Media Social | Jul 20 |
| DESIGN-9 | Design H | 1 | [Team] Nowhere | Content Media Social | Aug 20 |
| DESIGN-10 | Design I | 1 | Bali | Content Media Social | Aug 20 |
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
assert.equal(of("DESIGN-3")[0].date, "2025-08-31", "Aug 31 → Sep 1 stays August");
assert.equal(of("DESIGN-4")[0].status, "invalid", "blank output rejected");
assert.equal(of("DESIGN-5")[0].categoryId, "merchandise", "Property Event / Merchandise alias");
assert.match(of("DESIGN-6")[0].reason ?? "", /Unknown Work Area/);
assert.equal(of("DESIGN-3")[1].status, "invalid", "duplicate ID inside file rejected");
assert.equal(of("DESIGN-7")[0].status, "duplicate", "existing team ID skipped");
assert.match(of("DESIGN-8")[0].reason ?? "", /outside the selected month/, "deadline month conflict flagged");
assert.match(of("DESIGN-9")[0].reason ?? "", /Unknown team/);
assert.match(of("DESIGN-10")[0].reason ?? "", /No team found/);

const summary = summarizeMarkdownRows(rows);
assert.equal(summary.newRows, 5, "new rows");
assert.equal(summary.newOutputs, 8, "new outputs");
assert.equal(summary.duplicateRows, 1);
assert.deepEqual(summary.byTeam["Overseas"], { rows: 3, outputs: 5 });

const locked = classifyMarkdownRows(source.slice(0, 2), { month: "2025-08", teams, categories, existing, onlyTeamId: "overseas" });
assert.deepEqual(locked.map((r) => r.status), ["invalid", "new", "invalid"], "team page keeps only its own team");

assert.throws(() => classifyMarkdownRows(source, { month: "2026-13", teams, categories, existing }), "invalid month rejected");

console.log("markdown-import: OK");
