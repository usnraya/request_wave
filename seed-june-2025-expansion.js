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
  ["DESIGN-1233", "[Interior] Main Mural"],
  ["DESIGN-1242", "[Interior] [Lobby] Door Sticker"],
  ["DESIGN-1241", "[Exterior] Signboard / Front Banner"],
  ["DESIGN-1213", "[Exterior] Glass Sticker Illustration"],
  ["DESIGN-1253", "[Exterior] Neonbox"],
  ["DESIGN-1295", "[Interior] Main Mural"],
  ["DESIGN-1301", "[Interior] [Lobby] Door Sticker"],
  ["DESIGN-1299", "[Interior] [Glass Door] Door Sticker"],
  ["DESIGN-1308", "[Exterior] Signboard / Front Banner"],
  ["DESIGN-1314", "[Exterior] Big Banner"],
  ["DESIGN-1297", "[Soft Opening] Spanduk"],
  ["DESIGN-1310", "[Exterior] Glass Sticker Illustration"],
  ["DESIGN-1359", "[Exterior] Signboard / Front Banner New Branch Sidoarjo"],
  ["DESIGN-1354", "[Exterior] Big Banner New Branch Sidoarjo, Jatim"],
  ["DESIGN-1372", "[Exterior] Big Banner New Branch Sidoarjo"],
  ["DESIGN-1374", "[Exterior] Signboard / Front Banner New Branch"],
  ["DESIGN-1387", "Design - Lamongan Door Sticker"],
];

(async () => {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const [{ data: team, error: teamError }, { data: category, error: categoryError }, { data: pm, error: pmError }] = await Promise.all([
    supabase.from("teams").select("id").eq("id", "expansion").maybeSingle(),
    supabase.from("categories").select("id").eq("id", "branch").maybeSingle(),
    supabase.from("profiles").select("id").eq("role", "PM").order("created_at").limit(1).maybeSingle(),
  ]);
  if (teamError || categoryError || pmError) throw teamError || categoryError || pmError;
  if (!team || !category || !pm) throw new Error("Target team, work area, or PM requester not found");

  const notionIds = tasks.map(([notionId]) => notionId);
  const { data: existing, error: existingError } = await supabase
    .from("requests")
    .select("notion_id")
    .in("notion_id", notionIds);
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
      request_date: "2025-06-30",
      deadline: "2025-06-30",
      completed_date: "2025-06-30",
      priority: "medium",
      status: "done",
      estimated_hours: 0,
      actual_hours: null,
      description: null,
      figma_url: null,
      drive_url: null,
    }));

  if (rows.length) {
    const { error } = await supabase.from("requests").insert(rows);
    if (error) throw error;
  }

  const { data: verified, error: verifyError } = await supabase
    .from("requests")
    .select("notion_id,title,team_id,category_id,request_date,status")
    .in("notion_id", notionIds)
    .order("notion_id");
  if (verifyError) throw verifyError;
  console.log(JSON.stringify({ inserted: rows.length, alreadyPresent: existingIds.size, totalVerified: verified?.length ?? 0, verified }, null, 2));
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
