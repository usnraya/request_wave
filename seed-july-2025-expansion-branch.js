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
  ["DESIGN-1225", "[Interior] Main Mural"],
  ["DESIGN-1217", "[Exterior] Signboard / Front Banner"],
  ["DESIGN-1221", "[Exterior] Big Banner"],
  ["DESIGN-1315", "[Interior] Secondary Mural"],
  ["DESIGN-1404", "[Interior] Main Mural Sidoarjo"],
  ["DESIGN-1406", "[Interior] [Lobby] Door Sticker Sidoarjo"],
  ["DESIGN-1405", "[Interior] [Glass Door] Door Sticker Sidoarjo"],
  ["DESIGN-1411", "[Interior] Main Mural"],
  ["DESIGN-1410", "[Interior] [Lobby] Door Sticker"],
  ["DESIGN-1408", "[Interior] [Glass Door] Door Sticker"],
  ["DESIGN-1448", "[Exterior] Big Banner"],
  ["DESIGN-1422", "[Exterior] Neonbox"],
  ["DESIGN-1421", "[Grand Opening] Spanduk"],
  ["DESIGN-1429", "[Grand Opening] Spanduk"],
  ["DESIGN-1476", "[Interior] Main Mural"],
  ["DESIGN-1472", "[Exterior] Big Banner"],
  ["DESIGN-1471", "[Grand Opening] Spanduk"],
  ["DESIGN-1470", "[NEW] X-Banner - Pak Gita Wirjawan"],
  ["DESIGN-1503", "Revisi - Design X-Banner - Pak Gita Wirja..."],
  ["DESIGN-1528", "Re Design - Main mural"],
  ["DESIGN-1541", "[Interior] Secondary Mural - Sidoarjo"],
  ["DESIGN-1542", "[Exterior] Signboard / Front Banner - BSD"],
  ["DESIGN-1537", "[Exterior] Big Banner - BSD"],
  ["DESIGN-1543", "[Interior] [Lobby] Door Sticker - BSD"],
  ["DESIGN-1557", "[Exterior] Facade 3D Panel"],
  ["DESIGN-1571", "[Interior] [Glass & Wook Door] Door Sticker - BSD"],
  ["DESIGN-1581", "Mockup Facade BSD"],
];

const requestDate = "2025-07-31";

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
    .select("id, notion_id")
    .in("notion_id", notionIds)
    .eq("team_id", team.id)
    .eq("category_id", category.id)
    .eq("request_date", requestDate);
  if (existingError) throw existingError;

  const existingById = new Map((existing ?? []).map((row) => [row.notion_id, row]));
  const rows = tasks
    .filter(([notionId]) => !existingById.has(notionId))
    .map(([notionId, title]) => ({
      id: crypto.randomUUID(),
      request_code: `REQ-2025-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      notion_id: notionId,
      title,
      team_id: team.id,
      category_id: category.id,
      requester_id: pm.id,
      designer_id: null,
      request_date: requestDate,
      deadline: requestDate,
      completed_date: requestDate,
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
    .eq("team_id", team.id)
    .eq("category_id", category.id)
    .eq("request_date", requestDate)
    .order("notion_id");
  if (verifyError) throw verifyError;
  console.log(JSON.stringify({ inserted: rows.length, alreadyPresent: existingById.size, totalVerified: verified?.length ?? 0, verified }, null, 2));
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
