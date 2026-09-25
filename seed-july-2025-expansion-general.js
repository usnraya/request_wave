const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);

const tasks = [
  ["DESIGN-1235", "Event - Discuss Marketing Team"],
  ["DESIGN-1212", "Design - Revisi Marketing Team"],
  ["DESIGN-1262", "Design - Revisi Marketing Team"],
  ["DESIGN-1270", "Edit - GO Jombang"],
  ["DESIGN-1267", "Edit - GO Jombang"],
  ["DESIGN-1293", "Desain - Hampers Spesial untuk Event Webinar Parentpreneurship 2025"],
  ["DESIGN-1335", "Design - Star student (BATCH 01)"],
  ["DESIGN-1373", "Design - Revisi Star student (BATCH 01)"],
  ["DESIGN-1380", "Desain - Hampers Spesial untuk Event Webinar P..."],
  ["DESIGN-1388", "Revisi design hampers"],
  ["DESIGN-1499", "Design - Road Promotion"],
  ["DESIGN-1502", "Re-Design Merchandise Parent..."],
  ["DESIGN-1523", "Design - Voucher Beasiswa Coding"],
];

(async () => {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const [{ data: team, error: teamError }, { data: category, error: categoryError }, { data: pm, error: pmError }] = await Promise.all([
    supabase.from("teams").select("id").eq("id", "expansion").maybeSingle(),
    supabase.from("categories").select("id").eq("id", "general").maybeSingle(),
    supabase.from("profiles").select("id").eq("role", "PM").order("created_at").limit(1).maybeSingle(),
  ]);
  if (teamError || categoryError || pmError) throw teamError || categoryError || pmError;
  if (!team || !category || !pm) throw new Error("Target team, work area, or PM requester not found");

  const notionIds = tasks.map(([notionId]) => notionId);
  const { data: existing, error: existingError } = await supabase
    .from("requests")
    .select("id, notion_id, title")
    .in("notion_id", notionIds)
    .eq("team_id", "expansion")
    .eq("category_id", "general")
    .eq("request_date", "2025-07-31");
  if (existingError) throw existingError;
  const existingIds = new Set((existing ?? []).map((row) => row.notion_id));
  const rows = tasks
    .filter(([notionId]) => !existingIds.has(notionId))
    .map(([notionId, title]) => ({
      id: crypto.randomUUID(),
      request_code: `REQ-2025-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      notion_id: notionId,
      title,
      team_id: team.id,
      category_id: category.id,
      requester_id: pm.id,
      designer_id: null,
      request_date: "2025-07-31",
      deadline: "2025-07-31",
      completed_date: "2025-07-31",
      priority: "medium",
      status: "done",
      estimated_hours: 0,
      actual_hours: null,
      description: null,
      figma_url: null,
      drive_url: null,
    }));

  const existingById = new Map((existing ?? []).map((row) => [row.notion_id, row]));
  const updates = tasks
    .filter(([notionId]) => existingById.has(notionId))
    .map(([notionId, title]) => ({ id: existingById.get(notionId).id, notion_id: notionId, title }));

  if (rows.length) {
    const { error } = await supabase.from("requests").insert(rows);
    if (error) throw error;
  }
  for (const row of updates) {
    const { error } = await supabase
      .from("requests")
      .update({ notion_id: row.notion_id, title: row.title, team_id: team.id, category_id: category.id, request_date: "2025-07-31", deadline: "2025-07-31", completed_date: "2025-07-31", status: "done" })
      .eq("id", row.id);
    if (error) throw error;
  }

  const { data: verified, error: verifyError } = await supabase
    .from("requests")
    .select("notion_id,title,team_id,category_id,request_date,status")
    .in("notion_id", notionIds)
    .order("notion_id");
  if (verifyError) throw verifyError;
  console.log(JSON.stringify({ inserted: rows.length, updated: updates.length, totalVerified: verified?.length ?? 0, verified }, null, 2));
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
