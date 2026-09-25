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

const batches = [
  {
    date: "2025-06-30",
    category: "branch",
    tasks: [
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
    ],
  },
  {
    date: "2025-07-31",
    category: "general",
    tasks: [
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
      ["DESIGN-1502", "Re-Design Merchandise Parententrepreneur..."],
      ["DESIGN-1523", "Design - Voucher Beasiswa Coding"],
    ],
  },
  {
    date: "2025-07-31",
    category: "content-social",
    tasks: [
      ["DESIGN-1203", "Edit - GO Yogyakarta"],
      ["DESIGN-1269", "Edit - Revisi GO Yogyakarta"],
      ["DESIGN-1270", "Edit - GO Jombang"],
      ["DESIGN-1267", "Edit - GO Jombang"],
      ["DESIGN-1402", "Edit - GO Lamongan"],
      ["DESIGN-1456", "Edit - Video Pelatihan Guru"],
      ["DESIGN-1457", "Edit - Video Pelatihan Guru (Testimony)"],
      ["DESIGN-1458", "Edit - GO Gianyar"],
      ["DESIGN-1464", "Edit - Video Event Timedoor Academy Sentul"],
      ["DESIGN-1576", "Edit GO - Sidoarjo"],
    ],
  },
  {
    date: "2025-07-31",
    category: "branch",
    tasks: [
      ["DESIGN-1225", "[Interior] Main Mural"],
      ["DESIGN-1217", "[Exterior] Signboard / Front Banner"],
      ["DESIGN-1221", "[Exterior] Big Banner"],
      ["DESIGN-1233", "[Interior] Main Mural"],
      ["DESIGN-1242", "[Interior] [Lobby] Door Sticker"],
      ["DESIGN-1241", "[Exterior] Signboard / Front Banner"],
      ["DESIGN-1213", "[Exterior] Glass Sticker Illustration"],
      ["DESIGN-1253", "[Exterior] Neonbox"],
      ["DESIGN-1295", "[Interior] Main Mural"],
      ["DESIGN-1301", "[Interior] [Lobby] Door Sticker"],
      ["DESIGN-1315", "[Interior] Secondary Mural"],
      ["DESIGN-1299", "[Interior] [Glass Door] Door Sticker"],
      ["DESIGN-1308", "[Exterior] Signboard / Front Banner"],
      ["DESIGN-1314", "[Exterior] Big Banner"],
      ["DESIGN-1297", "[Soft Opening] Spanduk"],
      ["DESIGN-1310", "[Exterior] Glass Sticker Illustration"],
      ["DESIGN-1359", "[Exterior] Signboard / Front Banner New Branch Sidoarjo"],
      ["DESIGN-1354", "[Exterior] Big Banner New Branch Sidoarjo, Jatim"],
      ["DESIGN-1372", "[Exterior] Big Banner Sidoarj..."],
      ["DESIGN-1374", "[Exterior] Signboard / Front Banner New Bra..."],
      ["DESIGN-1387", "Design - Lamongan Door Sticker"],
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
    ],
  },
  {
    date: "2025-07-31",
    category: "branch",
    tasks: [
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
    ],
  },
];

const expectedTotal = batches.reduce((total, batch) => total + batch.tasks.length, 0);
const rowKey = (row) => [row.notion_id, row.title, row.team_id, row.category_id, row.request_date].join("\u001f");

(async () => {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const [{ data: team, error: teamError }, { data: categories, error: categoriesError }, { data: pm, error: pmError }] = await Promise.all([
    supabase.from("teams").select("id").eq("id", "expansion").maybeSingle(),
    supabase.from("categories").select("id").in("id", ["branch", "general", "content-social"]),
    supabase.from("profiles").select("id").eq("role", "PM").order("created_at").limit(1).maybeSingle(),
  ]);
  if (teamError || categoriesError || pmError) throw teamError || categoriesError || pmError;
  if (!team || !pm || categories?.length !== 3) throw new Error("Target team, work areas, or PM requester not found");

  const categoryMap = new Map(categories.map((category) => [category.id, category.id]));
  const { data: existing, error: existingError } = await supabase
    .from("requests")
    .select("id, notion_id, title, team_id, category_id, request_date")
    .eq("team_id", team.id)
    .in("category_id", [...categoryMap.keys()])
    .in("request_date", ["2025-06-30", "2025-07-31"]);
  if (existingError) throw existingError;

  const existingCounts = new Map();
  for (const row of existing ?? []) {
    const key = rowKey(row);
    existingCounts.set(key, (existingCounts.get(key) ?? 0) + 1);
  }

  const desiredCounts = new Map();
  const desiredRows = [];
  for (const batch of batches) {
    for (const [notionId, title] of batch.tasks) {
      const row = {
        notion_id: notionId,
        title,
        team_id: team.id,
        category_id: categoryMap.get(batch.category),
        request_date: batch.date,
      };
      const key = rowKey(row);
      desiredCounts.set(key, (desiredCounts.get(key) ?? 0) + 1);
      desiredRows.push(row);
    }
  }

  const rows = [];
  for (const row of desiredRows) {
    const key = rowKey(row);
    const existingCount = existingCounts.get(key) ?? 0;
    const desiredCount = desiredCounts.get(key);
    const alreadyQueued = rows.filter((queued) => rowKey(queued) === key).length;
    if (existingCount + alreadyQueued >= desiredCount) continue;
    rows.push({
      id: crypto.randomUUID(),
      request_code: `REQ-${row.request_date.slice(0, 4)}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      ...row,
      requester_id: pm.id,
      designer_id: null,
      deadline: row.request_date,
      completed_date: row.request_date,
      priority: "medium",
      status: "done",
      estimated_hours: 0,
      actual_hours: null,
      description: null,
      figma_url: null,
      drive_url: null,
    });
  }

  if (rows.length) {
    const { error } = await supabase.from("requests").insert(rows);
    if (error) throw error;
  }

  const targetKeys = new Set(desiredCounts.keys());
  const finalCounts = new Map(existingCounts);
  for (const row of rows) {
    const key = rowKey(row);
    finalCounts.set(key, (finalCounts.get(key) ?? 0) + 1);
  }
  const finalTotal = [...targetKeys].reduce((total, key) => total + (finalCounts.get(key) ?? 0), 0);
  console.log(JSON.stringify({ expectedTotal, inserted: rows.length, finalTargetTotal: finalTotal, targetGroups: { juneBranch: 17, julyGeneral: 13, julySocial: 10, julyBranchOriginal: 44, julyBranchAdditional: 27 } }, null, 2));
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
