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
  "Timedoor Academy": "timedoor-academy-b6dd83ba",
  "Expansion": "expansion",
  "YCWC": "ycwc",
  "[Timedoor Academy] C-Level": "timedoor-academy-c-level-42ef0870",
  HQ: "hq",
  Overseas: "overseas",
  "HR - Academy": "hr-academy-dd16e6dd",
  "HR - Timedoor": "hr-timedoor-f2aa1ee8",
  Designer: "designer-27db1d11",
  "Content Creator": "content-creator-34bf3f68",
  Curricullum: "curriculum",
  "Marketing Team (Online)": "marketing-online",
  "Marketing Team (Offline)": "marketing-offline",
  "System Support": "system-support-fb07d9ec",
  "Web Team": "web-team-75aafce1",
  "Online Team - Admin": "online-team-admin-ebd54d95",
  "Academy Pro": "academy-pro-9e510332",
  hisensei: "hisensei",
  "Offline ID": "offline-id-e78bd111",
  LPK: "lpk-cda12f15",
};
const categoryIds = {
  "General Request": "general",
  "Content Media Social": "content-social",
  "Branch Interior & Exterior": "branch",
  WEB: "web",
  "Marketing Things / ADS": "marketing-ads",
  "Internal / Coordination": "internal",
  "Collect Footage": "footage",
  "LMS / System": "lms",
};

function parseSource() {
  return fs.readFileSync("md/oktober.md", "utf8").split(/\r?\n/).flatMap((line) => {
    if (!line.startsWith("| DESIGN-")) return [];
    const cells = line.replace(/\\\|/g, "\u0001").split("|").slice(1, -1).map((c) => c.trim().replace(/\u0001/g, "|"));
    if (cells.length !== 5) throw new Error(`Malformed source row: ${line}`);
    const [notionId, title, outputText, usage, areaText] = cells;
    const teamPart = usage.split(",").map((p) => p.trim()).find((p) => p.startsWith("[Team] "));
    const teamName = teamPart
      ? teamPart.slice("[Team] ".length).trim()
      : usage.trim() === "Timedoor Academy"
        ? "Timedoor Academy"
        : null;
    const workAreaName = areaText.split(",")[0].trim() || null;
    return [{ notionId, title, outputCount: Number(outputText), teamName, workAreaName }];
  });
}
function key(row) { return [row.notion_id, row.title, row.team_id, row.category_id, row.request_date].join("\u001f"); }

(async () => {
  const source = parseSource();
  if (source.length !== 196) throw new Error(`Expected 196 source rows, got ${source.length}`);
  const zero = source.filter((r) => r.outputCount < 1);
  const positive = source.filter((r) => r.outputCount >= 1);
  const ready = positive.filter((r) => r.teamName && r.workAreaName);
  const pending = positive.filter((r) => !r.teamName || !r.workAreaName);
  const expected = ready.map((r) => ({
    notion_id: r.notionId,
    title: r.title,
    output_count: r.outputCount,
    team_id: teamIds[r.teamName],
    category_id: categoryIds[r.workAreaName],
    request_date: "2025-10-31",
  }));
  const expectedKeys = new Set(expected.map(key));
  const sourceById = new Map(source.map((r) => [r.notionId, r]));
  const zeroIds = new Set(zero.map((r) => r.notionId));
  const pendingIds = new Set(pending.map((r) => r.notionId));

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: actual, error } = await supabase.from("requests").select("notion_id,title,output_count,team_id,category_id,request_date,deadline,completed_date,status").eq("request_date", "2025-10-31");
  if (error) throw error;
  const rows = actual || [];
  const errors = [];
  const actualKeys = new Set(rows.map(key));
  for (const row of expected) if (!actualKeys.has(key(row))) errors.push(`missing ${row.notion_id}`);
  for (const row of rows) {
    const src = sourceById.get(row.notion_id);
    if (!src) errors.push(`unexpected source ID ${row.notion_id}`);
    else {
      if (src.title !== row.title) errors.push(`title mismatch ${row.notion_id}`);
      if (src.outputCount !== row.output_count) errors.push(`output mismatch ${row.notion_id}`);
      if (zeroIds.has(row.notion_id)) errors.push(`zero-output present ${row.notion_id}`);
      if (pendingIds.has(row.notion_id)) errors.push(`pending row present ${row.notion_id}`);
    }
    if (row.deadline !== "2025-10-31" || row.completed_date !== "2025-10-31") errors.push(`wrong date fields ${row.notion_id}`);
    if (row.status !== "done") errors.push(`wrong status ${row.notion_id}`);
    if (!Number.isInteger(row.output_count) || row.output_count < 1) errors.push(`invalid output_count ${row.notion_id}`);
  }
  if (rows.length !== expected.length) errors.push(`row count ${rows.length}, expected ${expected.length}`);
  const duplicateKeys = new Set();
  for (const row of rows) { const k = key(row); if (duplicateKeys.has(k)) errors.push(`duplicate ${row.notion_id}`); duplicateKeys.add(k); }

  const sourceIds = source.map((r) => r.notionId);
  const { data: otherDates, error: otherError } = await supabase.from("requests").select("notion_id,request_date").in("notion_id", sourceIds).neq("request_date", "2025-10-31");
  if (otherError) throw otherError;
  for (const row of otherDates || []) errors.push(`October source ID at other date ${row.notion_id} @ ${row.request_date}`);

  if (errors.length) {
    console.error(JSON.stringify({ verification: "FAIL", errors }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({
    sourceRows: source.length,
    sourceZeroOutput: zero.length,
    sourcePositive: positive.length,
    sourceOutputTotal: positive.reduce((s, r) => s + r.outputCount, 0),
    importedRows: rows.length,
    importedOutputTotal: rows.reduce((s, r) => s + r.output_count, 0),
    pendingPositiveNotImported: pending.length,
    zeroOutputInDatabase: 0,
    verification: "PASS",
  }, null, 2));
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
