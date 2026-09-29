const crypto = require("crypto");
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

const teamIds = { Expansion: "expansion", "HR - Timedoor": "hr-timedoor-f2aa1ee8" };
const categoryIds = { "Content Media Social": "content-social" };

// User confirmed Work Area = "social media" (-> Content Media Social) for the last 3 pending rows.
// Team already resolved from source [Team] tag.
const rows = [
  { notionId: "DESIGN-2017", title: "Post - Video Workshop SMKN 3 TangSel", outputCount: 1, teamName: "Expansion" },
  { notionId: "DESIGN-2044", title: "🟡 Event - Marketing Discuss", outputCount: 1, teamName: "HR - Timedoor" },
  { notionId: "DESIGN-2127", title: "Post- GO (Bandar Lampung)", outputCount: 1, teamName: "Expansion" },
];

function rowKey(row) {
  return [row.notion_id, row.title, row.team_id, row.category_id, row.request_date].join("\u001f");
}

(async () => {
  if (rows.length !== 3) throw new Error(`Expected 3 candidate rows, got ${rows.length}`);
  const outputTotal = rows.reduce((s, r) => s + r.outputCount, 0);
  if (outputTotal !== 3) throw new Error(`Expected total output 3, got ${outputTotal}`);

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const [{ data: pm, error: pmError }, { data: existing, error: existingError }] = await Promise.all([
    supabase.from("profiles").select("id").eq("role", "PM").order("created_at").limit(1).maybeSingle(),
    supabase.from("requests").select("notion_id, title, team_id, category_id, request_date").eq("request_date", "2025-10-31"),
  ]);
  if (pmError || existingError) throw pmError || existingError;
  if (!pm) throw new Error("No PM profile found");

  const desiredRows = rows.map((r) => ({
    notion_id: r.notionId,
    title: r.title,
    team_id: teamIds[r.teamName],
    category_id: categoryIds["Content Media Social"],
    request_date: "2025-10-31",
    deadline: "2025-10-31",
    completed_date: "2025-10-31",
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
