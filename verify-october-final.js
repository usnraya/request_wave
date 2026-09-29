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
  Expansion: "expansion",
  YCWC: "ycwc",
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
    const [notionId, title, outputText] = cells;
    return [{ notionId, title, outputCount: Number(outputText) }];
  });
}

// Explicit user-confirmed overrides for the 9 rows where Team and/or Work Area
// came from the user directly (not derivable from the generic [Team]/"Timedoor Academy" parse).
const manualOverrides = {
  "DESIGN-1926": { teamName: "Timedoor Academy", workAreaName: "Content Media Social" },
  "DESIGN-1930": { teamName: "Timedoor Academy", workAreaName: "Content Media Social" },
  "DESIGN-2021": { teamName: "Timedoor Academy", workAreaName: "Content Media Social" },
  "DESIGN-2079": { teamName: "Timedoor Academy", workAreaName: "Content Media Social" },
  "DESIGN-1886": { teamName: "Timedoor Academy", workAreaName: "General Request" },
  "DESIGN-2055": { teamName: "Timedoor Academy", workAreaName: "Content Media Social" },
  "DESIGN-2108": { teamName: "Expansion", workAreaName: "Branch Interior & Exterior" },
  "DESIGN-2100": { teamName: "Expansion", workAreaName: "Branch Interior & Exterior" },
  "DESIGN-2126": { teamName: "Expansion", workAreaName: "Branch Interior & Exterior" },
  "DESIGN-2017": { teamName: "Expansion", workAreaName: "Content Media Social" },
  "DESIGN-2044": { teamName: "HR - Timedoor", workAreaName: "Content Media Social" },
  "DESIGN-2127": { teamName: "Expansion", workAreaName: "Content Media Social" },
};

// Explicitly excluded per user instruction ("gausa diinput" / "skip") even though Output Task > 0.
const excludedIds = new Set([
  "DESIGN-1638", // gausa diinput
  "DESIGN-2038", // gausa input
  "DESIGN-2040", // gausa input, ga penting
  "DESIGN-2105", // skip gausa diinput
  "DESIGN-2106", // gausa diinput
]);

function firstTeam(usage) {
  if (usage.trim() === "[Timedoor Academy] C-Level") return "[Timedoor Academy] C-Level";
  const part = usage.split(",").map((p) => p.trim()).find((p) => p.startsWith("[Team] "));
  if (part) return part.slice("[Team] ".length).trim();
  if (usage.trim() === "Timedoor Academy") return "Timedoor Academy";
  return null;
}
function firstArea(t) { return t.split(",")[0].trim() || null; }

function parseSourceFull() {
  return fs.readFileSync("md/oktober.md", "utf8").split(/\r?\n/).flatMap((line) => {
    if (!line.startsWith("| DESIGN-")) return [];
    const cells = line.replace(/\\\|/g, "\u0001").split("|").slice(1, -1).map((c) => c.trim().replace(/\u0001/g, "|"));
    const [notionId, title, outputText, usage, areaText] = cells;
    return [{ notionId, title, outputCount: Number(outputText), usage, areaText }];
  });
}

function key(row) { return [row.notion_id, row.title, row.team_id, row.category_id, row.request_date].join("\u001f"); }

(async () => {
  const sourceBasic = parseSource();
  if (sourceBasic.length !== 196) throw new Error(`Expected 196 source rows, got ${sourceBasic.length}`);
  const sourceFull = parseSourceFull();
  const zero = sourceFull.filter((r) => r.outputCount < 1);
  const positive = sourceFull.filter((r) => r.outputCount >= 1);

  // Determine expected imported set: positive rows with resolvable team+area (generic or manual override), minus explicit exclusions.
  const expectedList = [];
  const stillPending = [];
  for (const r of positive) {
    if (excludedIds.has(r.notionId)) continue;
    const override = manualOverrides[r.notionId];
    const teamName = override ? override.teamName : firstTeam(r.usage);
    const workAreaName = override ? override.workAreaName : (teamName ? firstArea(r.areaText) : null);
    if (teamName && workAreaName) {
      if (!teamIds[teamName]) throw new Error(`Unknown team ${teamName} for ${r.notionId}`);
      if (!categoryIds[workAreaName]) throw new Error(`Unknown work area ${workAreaName} for ${r.notionId}`);
      expectedList.push({
        notion_id: r.notionId,
        title: r.title,
        output_count: r.outputCount,
        team_id: teamIds[teamName],
        category_id: categoryIds[workAreaName],
        request_date: "2025-10-31",
      });
    } else {
      stillPending.push(r.notionId);
    }
  }

  const expectedKeys = new Set(expectedList.map(key));
  const sourceById = new Map(sourceFull.map((r) => [r.notionId, r]));
  const zeroIds = new Set(zero.map((r) => r.notionId));

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: actual, error } = await supabase
    .from("requests")
    .select("notion_id,title,output_count,team_id,category_id,request_date,deadline,completed_date,status")
    .eq("request_date", "2025-10-31");
  if (error) throw error;
  const rows = actual || [];

  const errors = [];
  const actualKeys = new Set(rows.map(key));
  for (const row of expectedList) if (!actualKeys.has(key(row))) errors.push(`missing ${row.notion_id}`);
  for (const row of rows) {
    const src = sourceById.get(row.notion_id);
    if (!src) { errors.push(`unexpected source ID ${row.notion_id}`); continue; }
    if (src.title !== row.title) errors.push(`title mismatch ${row.notion_id}`);
    if (src.outputCount !== row.output_count) errors.push(`output mismatch ${row.notion_id}`);
    if (zeroIds.has(row.notion_id)) errors.push(`zero-output present ${row.notion_id}`);
    if (excludedIds.has(row.notion_id)) errors.push(`excluded row present ${row.notion_id}`);
    if (!expectedKeys.has(key(row))) errors.push(`unexpected/unclassified row present ${row.notion_id}`);
    if (row.deadline !== "2025-10-31" || row.completed_date !== "2025-10-31") errors.push(`wrong date fields ${row.notion_id}`);
    if (row.status !== "done") errors.push(`wrong status ${row.notion_id}`);
    if (!Number.isInteger(row.output_count) || row.output_count < 1) errors.push(`invalid output_count ${row.notion_id}`);
  }
  if (rows.length !== expectedList.length) errors.push(`row count ${rows.length}, expected ${expectedList.length}`);
  const dup = new Set();
  for (const row of rows) { const k = key(row); if (dup.has(k)) errors.push(`duplicate ${row.notion_id}`); dup.add(k); }

  const sourceIds = sourceFull.map((r) => r.notionId);
  const { data: otherDates, error: otherError } = await supabase
    .from("requests").select("notion_id,request_date").in("notion_id", sourceIds).neq("request_date", "2025-10-31");
  if (otherError) throw otherError;
  for (const row of otherDates || []) errors.push(`October source ID at other date ${row.notion_id} @ ${row.request_date}`);

  if (errors.length) {
    console.error(JSON.stringify({ verification: "FAIL", errors }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({
    sourceRows: sourceBasic.length,
    sourceZeroOutput: zero.length,
    sourcePositive: positive.length,
    excludedByUser: excludedIds.size,
    stillPendingCount: stillPending.length,
    stillPendingIds: stillPending,
    importedRows: rows.length,
    importedOutputTotal: rows.reduce((s, r) => s + r.output_count, 0),
    verification: "PASS",
  }, null, 2));
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
