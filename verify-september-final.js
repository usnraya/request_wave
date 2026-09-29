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

function parseSource() {
  return fs.readFileSync("md/september.md", "utf8").split(/\r?\n/).flatMap((line) => {
    if (!line.startsWith("| DESIGN-")) return [];
    const cells = line.replace(/\\\|/g, "\u0001").split("|").slice(1, -1).map((c) => c.trim().replace(/\u0001/g, "|"));
    if (cells.length !== 5) throw new Error(`Malformed row: ${line}`);
    const [notionId, title, outputText] = cells;
    return [{ notionId, title, outputCount: Number(outputText) }];
  });
}

(async () => {
  const source = parseSource();
  if (source.length !== 150) throw new Error(`Source count ${source.length}, expected 150`);
  const bySourceId = new Map(source.map((r) => [r.notionId, r]));
  const zeroIds = new Set(source.filter((r) => r.outputCount < 1).map((r) => r.notionId));

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // 1) All rows tagged September 2025 in DB.
  const { data: sepRows, error: sepError } = await supabase
    .from("requests")
    .select("notion_id,title,output_count,team_id,category_id,request_date,deadline,completed_date,status")
    .eq("request_date", "2025-09-30");
  if (sepError) throw sepError;

  const errors = [];
  for (const row of sepRows) {
    if (!row.notion_id.startsWith("DESIGN-")) { errors.push(`non-DESIGN id in Sept: ${row.notion_id}`); continue; }
    const src = bySourceId.get(row.notion_id);
    if (!src) { errors.push(`DB row not found in September source: ${row.notion_id}`); continue; }
    if (src.title !== row.title) errors.push(`title mismatch ${row.notion_id}: source="${src.title}" db="${row.title}"`);
    if (src.outputCount !== row.output_count) errors.push(`output mismatch ${row.notion_id}: source=${src.outputCount} db=${row.output_count}`);
    if (zeroIds.has(row.notion_id)) errors.push(`zero-output row present in DB: ${row.notion_id}`);
    if (row.deadline !== "2025-09-30" || row.completed_date !== "2025-09-30") errors.push(`date field wrong: ${row.notion_id}`);
    if (row.status !== "done") errors.push(`status wrong: ${row.notion_id}`);
    if (!Number.isInteger(row.output_count) || row.output_count < 1) errors.push(`output_count invalid: ${row.notion_id}`);
  }

  // 2) Duplicate check within September.
  const seen = new Map();
  for (const row of sepRows) {
    const k = `${row.notion_id}\u001f${row.title}\u001f${row.team_id}\u001f${row.category_id}`;
    seen.set(k, (seen.get(k) || 0) + 1);
  }
  for (const [k, count] of seen) if (count > 1) errors.push(`duplicate row: ${k} x${count}`);

  // 3) Cross-month leakage: any September-source notion_id must not exist at a non-September date.
  const sepIds = source.map((r) => r.notionId);
  const { data: crossRows, error: crossError } = await supabase
    .from("requests")
    .select("notion_id,request_date")
    .in("notion_id", sepIds)
    .neq("request_date", "2025-09-30");
  if (crossError) throw crossError;
  for (const row of crossRows) errors.push(`September notion_id found at other date: ${row.notion_id} @ ${row.request_date}`);

  if (errors.length) {
    console.error(JSON.stringify({ verification: "FAIL", errors }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({
    sourceRows: source.length,
    sourceZeroOutput: zeroIds.size,
    sourcePositive: source.length - zeroIds.size,
    importedRows: sepRows.length,
    importedOutputTotal: sepRows.reduce((s, r) => s + r.output_count, 0),
    verification: "PASS",
  }, null, 2));
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
