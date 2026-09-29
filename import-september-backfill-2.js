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
  "Content Media Social": "content-social", // user said "social media" for all three
};

// User-confirmed Team + Work Area ("social media") for these previously-pending September rows.
const rows = [
  { notionId: "DESIGN-1793", title: "Post - YCWC 2025 - Teaser Video", output: 1, team: "Timedoor Academy", area: "Content Media Social" },
  { notionId: "DESIGN-1805", title: "Post - Winner Post Python Olympiad", output: 1, team: "Expansion", area: "Content Media Social" },
  { notionId: "DESIGN-1807", title: "Post - Coming Soon YCWC", output: 1, team: "YCWC", area: "Content Media Social" },
];

function rowKey(row) {
  return [row.notion_id, row.title, row.team_id, row.category_id, row.request_date].join("\u001f");
}

(async () => {
  const source = fs.readFileSync("md/september.md", "utf8").split(/\r?\n/);
  for (const r of rows) {
    const line = source.find((l) => l.startsWith(`| ${r.notionId} `));
    if (!line) throw new Error(`Source row not found: ${r.notionId}`);
    const cells = line.replace(/\\\|/g, "\u0001").split("|").slice(1, -1).map((c) => c.trim().replace(/\u0001/g, "|"));
    if (cells[1] !== r.title) throw new Error(`Title mismatch for ${r.notionId}: source="${cells[1]}"`);
    if (Number(cells[2]) !== r.output) throw new Error(`Output mismatch for ${r.notionId}: source=${cells[2]}`);
    if (cells[4].trim() !== "") throw new Error(`Expected empty source Work Area for ${r.notionId}, got "${cells[4]}"`);
  }

  const outputTotal = rows.reduce((s, r) => s + r.output, 0);
  if (rows.length !== 3 || outputTotal !== 3) throw new Error(`Expected 3 rows / 3 outputs, got ${rows.length}/${outputTotal}`);

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
    if (!existingTeamIds.has(teamIds[r.team])) throw new Error(`Missing team ID: ${r.team}`);
    if (!existingCategoryIds.has(categoryIds[r.area])) throw new Error(`Missing category ID: ${r.area}`);
  }
  if (!pm) throw new Error("No PM profile found");

  const desiredRows = rows.map((r) => ({
    notion_id: r.notionId,
    title: r.title,
    team_id: teamIds[r.team],
    category_id: categoryIds[r.area],
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
    output_count: r.output,
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

  console.log(JSON.stringify({ candidateRows: rows.length, candidateOutputTotal: outputTotal, inserted: toInsert.length, alreadyPresent: desiredRows.length - toInsert.length }, null, 2));
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
