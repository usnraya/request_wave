const fs = require("fs");
const crypto = require("crypto");
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
};

const categoryIds = {
  "General Request": "general",
  "Content Media Social": "content-social",
  "WEB": "web",
  "Branch Interior & Exterior": "branch",
};

// User-confirmed Team for previously-pending, output-positive September rows.
// Work Area is taken from the source row itself (first listed area) — never invented.
const teamOverride = {
  "DESIGN-1693": "Timedoor Academy",
  "DESIGN-1701": "Timedoor Academy",
  "DESIGN-1720": "Timedoor Academy",
  "DESIGN-1746": "Timedoor Academy",
  "DESIGN-1751": "Timedoor Academy",
  "DESIGN-1772": "YCWC",
  "DESIGN-1775": "Expansion",
  "DESIGN-1783": "Timedoor Academy",
  "DESIGN-1782": "Timedoor Academy",
  "DESIGN-1781": "Timedoor Academy",
  "DESIGN-1795": "Timedoor Academy",
  "DESIGN-1806": "Timedoor Academy",
  "DESIGN-1803": "Timedoor Academy",
  "DESIGN-1801": "Timedoor Academy",
  "DESIGN-1808": "Timedoor Academy",
  "DESIGN-1811": "YCWC",
  "DESIGN-1812": "Timedoor Academy",
  "DESIGN-1823": "Timedoor Academy",
  "DESIGN-1817": "Timedoor Academy",
  "DESIGN-1824": "Timedoor Academy",
  "DESIGN-1847": "Expansion",
  "DESIGN-1842": "Timedoor Academy",
  "DESIGN-1849": "Timedoor Academy",
  "DESIGN-1862": "Expansion",
  "DESIGN-1869": "Timedoor Academy",
  "DESIGN-1870": "Timedoor Academy",
  "DESIGN-1867": "Timedoor Academy",
  "DESIGN-1874": "Timedoor Academy",
  "DESIGN-1879": "Timedoor Academy",
};

// Explicitly excluded by user ("gausa diinput"/"gausa dibuat").
const excluded = new Set([
  "DESIGN-1717", "DESIGN-1730", "DESIGN-1786", "DESIGN-1831",
  "DESIGN-1827", "DESIGN-1853", "DESIGN-1905",
]);

// Team known but Work Area blank in source — cannot import without Work Area (not invented).
const stillPendingArea = new Set(["DESIGN-1793", "DESIGN-1805", "DESIGN-1807"]);

function parseRows() {
  const lines = fs.readFileSync("md/september.md", "utf8").split(/\r?\n/);
  return lines.flatMap((line) => {
    if (!line.startsWith("| DESIGN-")) return [];
    const cells = line
      .replace(/\\\|/g, "\u0001")
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim().replace(/\u0001/g, "|"));
    if (cells.length !== 5) throw new Error(`Malformed source row: ${line}`);
    const [notionId, title, outputText, usage, workAreaText] = cells;
    return [{ notionId, title, outputCount: Number(outputText), usage, workAreaText }];
  });
}

function rowKey(row) {
  return [row.notion_id, row.title, row.team_id, row.category_id, row.request_date].join("\u001f");
}

(async () => {
  const allRows = parseRows();
  if (allRows.length !== 150) throw new Error(`Expected 150 source rows, got ${allRows.length}`);

  const overrideIds = new Set(Object.keys(teamOverride));
  // Sanity: every override id must be positive-output in source and not accidentally overlap exclusions.
  const rows = [];
  for (const id of overrideIds) {
    if (excluded.has(id)) throw new Error(`${id} is both overridden and excluded`);
    const src = allRows.find((r) => r.notionId === id);
    if (!src) throw new Error(`Override id not found in source: ${id}`);
    if (!Number.isInteger(src.outputCount) || src.outputCount < 1) throw new Error(`${id} is not positive-output`);
    const areaName = src.workAreaText.split(",")[0].trim();
    if (!areaName) throw new Error(`${id} has no Work Area in source; must be resolved before import`);
    const teamName = teamOverride[id];
    if (!teamIds[teamName]) throw new Error(`Unknown team: ${teamName} (${id})`);
    if (!categoryIds[areaName]) throw new Error(`Unknown work area: ${areaName} (${id})`);
    rows.push({
      notionId: src.notionId,
      title: src.title,
      outputCount: src.outputCount,
      teamName,
      workAreaName: areaName,
    });
  }

  if (rows.length !== 29) throw new Error(`Expected 29 backfill rows, got ${rows.length}`);
  const outputTotal = rows.reduce((s, r) => s + r.outputCount, 0);
  if (outputTotal !== 32) throw new Error(`Expected total output 32, got ${outputTotal}`);

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const [{ data: teams, error: teamsError }, { data: categories, error: categoriesError }, { data: pm, error: pmError }] = await Promise.all([
    supabase.from("teams").select("id"),
    supabase.from("categories").select("id"),
    supabase.from("profiles").select("id").eq("role", "PM").order("created_at").limit(1).maybeSingle(),
  ]);
  if (teamsError || categoriesError || pmError) throw teamsError || categoriesError || pmError;
  const existingTeamIds = new Set((teams || []).map((row) => row.id));
  const existingCategoryIds = new Set((categories || []).map((row) => row.id));
  for (const r of rows) {
    if (!existingTeamIds.has(teamIds[r.teamName])) throw new Error(`Missing team ID: ${r.teamName}`);
    if (!existingCategoryIds.has(categoryIds[r.workAreaName])) throw new Error(`Missing category ID: ${r.workAreaName}`);
  }
  if (!pm) throw new Error("No PM profile found");

  const desiredRows = rows.map((r) => ({
    notion_id: r.notionId,
    title: r.title,
    team_id: teamIds[r.teamName],
    category_id: categoryIds[r.workAreaName],
    request_date: "2025-09-30",
    deadline: "2025-09-30",
    completed_date: "2025-09-30",
    requester_id: pm.id,
    designer_id: null,
    priority: "medium",
    status: "done",
    estimated_hours: 0,
    actual_hours: null,
    description: null,
    figma_url: null,
    drive_url: null,
    output_count: r.outputCount,
  }));

  const { data: existing, error: existingError } = await supabase
    .from("requests")
    .select("id, notion_id, title, team_id, category_id, request_date")
    .eq("request_date", "2025-09-30");
  if (existingError) throw existingError;
  const existingKeys = new Set((existing || []).map(rowKey));
  const toInsert = desiredRows
    .filter((row) => !existingKeys.has(rowKey(row)))
    .map((row) => ({
      id: crypto.randomUUID(),
      request_code: `REQ-2025-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      ...row,
    }));

  if (toInsert.length) {
    const { error } = await supabase.from("requests").insert(toInsert);
    if (error) throw error;
  }

  console.log(JSON.stringify({
    candidateRows: rows.length,
    candidateOutputTotal: outputTotal,
    inserted: toInsert.length,
    alreadyPresent: desiredRows.length - toInsert.length,
    excludedByUser: [...excluded],
    stillPendingWorkArea: [...stillPendingArea],
  }, null, 2));
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
