const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.trimStart().startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);

const teamIds = {
  "Expansion": "expansion",
  "HR - Academy": "hr-academy-dd16e6dd",
  "Web Team": "web-team-75aafce1",
  "HR - Timedoor": "hr-timedoor-f2aa1ee8",
  "Designer": "designer-27db1d11",
  "Marketing Team (Offline)": "marketing-offline",
  "Overseas": "overseas",
  "HQ": "hq",
  "hisensei": "hisensei",
  "Content Creator": "content-creator-34bf3f68",
  "[Timedoor Academy] C-Level": "timedoor-academy-c-level-42ef0870",
  "Curricullum": "curriculum",
  "System Support": "system-support-fb07d9ec",
};
const categoryIds = {
  "General Request": "general",
  WEB: "web",
  "Internal / Coordination": "internal",
  "Marketing Things / ADS": "marketing-ads",
  "Content Media Social": "content-social",
  "Collect Footage": "footage",
  "Branch Interior & Exterior": "branch",
  "LMS / System": "lms",
};
function parseRows() {
  return fs.readFileSync("md/september.md", "utf8").split(/\r?\n/).flatMap((line) => {
    if (!line.startsWith("| DESIGN-")) return [];
    const cells = line.replace(/\\\|/g, "\u0001").split("|").slice(1, -1).map((cell) => cell.trim().replace(/\u0001/g, "|"));
    if (cells.length !== 5) throw new Error(`Malformed row: ${line}`);
    const [notionId, title, outputText, usage, workAreaText] = cells;
    const part = usage.trim() === "[Timedoor Academy] C-Level"
      ? "[Timedoor Academy] C-Level"
      : usage.split(",").map((p) => p.trim()).find((p) => p.startsWith("[Team] "))?.slice(7) || null;
    const area = workAreaText.split(",")[0].trim() || null;
    return [{ notionId, title, outputCount: Number(outputText), teamName: part, workAreaName: area }];
  });
}
function key(row) { return `${row.notion_id}\u001f${row.title}\u001f${row.team_id}\u001f${row.category_id}\u001f${row.request_date}`; }
(async () => {
  const source = parseRows();
  if (source.length !== 150) throw new Error(`Source count ${source.length}, expected 150`);
  const zeroIds = new Set(source.filter((r) => r.outputCount < 1).map((r) => r.notionId));
  const expected = source.filter((r) => r.outputCount >= 1 && r.teamName && r.workAreaName).map((r) => ({
    notion_id: r.notionId,
    title: r.title,
    team_id: teamIds[r.teamName],
    category_id: categoryIds[r.workAreaName],
    request_date: "2025-09-30",
  }));
  const candidateIds = new Set(source.filter((r) => r.outputCount >= 1 && (!r.teamName || !r.workAreaName)).map((r) => r.notionId));
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase.from("requests").select("notion_id,title,team_id,category_id,request_date,deadline,completed_date,status,output_count").eq("request_date", "2025-09-30");
  if (error) throw error;
  const rows = data || [];
  const expectedKeys = new Set(expected.map(key));
  const actualKeys = new Set(rows.map(key));
  const mismatches = [];
  for (const row of expected) if (!actualKeys.has(key(row))) mismatches.push(`missing ${row.notion_id}`);
  for (const row of rows) if (!expectedKeys.has(key(row))) mismatches.push(`unexpected ${row.notion_id}`);
  const badFields = rows.filter((r) => r.deadline !== "2025-09-30" || r.completed_date !== "2025-09-30" || r.status !== "done" || !Number.isInteger(r.output_count) || r.output_count < 1);
  const zeroPresent = rows.filter((r) => zeroIds.has(r.notion_id));
  const pendingPresent = rows.filter((r) => candidateIds.has(r.notion_id));
  if (rows.length !== expected.length || mismatches.length || badFields.length || zeroPresent.length || pendingPresent.length) {
    console.error(JSON.stringify({ rows: rows.length, expected: expected.length, mismatches, badFields, zeroPresent, pendingPresent }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({
    sourceRows: source.length,
    sourceZeroOutput: source.filter((r) => r.outputCount < 1).length,
    sourcePositive: source.filter((r) => r.outputCount >= 1).length,
    importedRows: rows.length,
    importedOutputTotal: rows.reduce((sum, r) => sum + r.output_count, 0),
    pendingPositiveNotImported: candidateIds.size,
    zeroOutputInDatabase: zeroPresent.length,
    verification: "PASS",
  }, null, 2));
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
