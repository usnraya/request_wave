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
  "[Timedoor Academy] C-Level": "timedoor-academy-c-level-42ef0870",
};

const categoryIds = {
  "General Request": "general",
  "Content Media Social": "content-social",
  "Branch Interior & Exterior": "branch",
  "WEB": "web",
  "Marketing Things / ADS": "marketing-ads",
};

// User-confirmed Team + Work Area for previously-skipped, output-positive tasks.
const rows = [
  // June (request_date 2025-06-30)
  { notionId: "DESIGN-1210", title: "Design - Idul Adha", output: 1, team: "Timedoor Academy", area: "Content Media Social", date: "2025-06-30" },
  { notionId: "DESIGN-1286", title: "Design - Soft Opening hisensei Gorontalo", output: 1, team: "Expansion", area: "General Request", date: "2025-06-30" },
  { notionId: "DESIGN-1291", title: "Compile Academy web content", output: 1, team: "Timedoor Academy", area: "WEB", date: "2025-06-30" },
  { notionId: "DESIGN-1324", title: "Edit - Class Activity Branch", output: 1, team: "Timedoor Academy", area: "Content Media Social", date: "2025-06-30" },
  { notionId: "DESIGN-1339", title: "Edit - LPD Timedoor Academy", output: 1, team: "Timedoor Academy", area: "Content Media Social", date: "2025-06-30" },
  { notionId: "DESIGN-1369", title: "Thumbnail Reels LPD kemendikdasmen", output: 1, team: "Timedoor Academy", area: "Content Media Social", date: "2025-06-30" },
  { notionId: "DESIGN-1385", title: "Design - Greeting Tahun Baru Islam", output: 1, team: "Timedoor Academy", area: "Content Media Social", date: "2025-06-30" },
  { notionId: "DESIGN-1386", title: "Design - Admin standby announcement", output: 1, team: "Expansion", area: "General Request", date: "2025-06-30" },
  { notionId: "DESIGN-1396", title: "Edit - Class Activity", output: 1, team: "Timedoor Academy", area: "General Request", date: "2025-06-30" },

  // July (request_date 2025-07-31)
  { notionId: "DESIGN-1437", title: "Design - New Template Class Activity", output: 1, team: "Timedoor Academy", area: "Content Media Social", date: "2025-07-31" },
  { notionId: "DESIGN-1453", title: "Design - Ms Tyo Backdrop", output: 1, team: "Timedoor Academy", area: "General Request", date: "2025-07-31" },
  { notionId: "DESIGN-1488", title: "Design - Twibbon Pelatihan Guru", output: 1, team: "Timedoor Academy", area: "Content Media Social", date: "2025-07-31" },
  { notionId: "DESIGN-1495", title: "[Interior] [Lobby] Door Sticker", output: 1, team: "Expansion", area: "Branch Interior & Exterior", date: "2025-07-31" },
  { notionId: "DESIGN-1485", title: "[Interior] [Glass Door] Door Sticker", output: 1, team: "Expansion", area: "Branch Interior & Exterior", date: "2025-07-31" },
  { notionId: "DESIGN-1483", title: "[Exterior] Signboard / Front Banner", output: 1, team: "Expansion", area: "Branch Interior & Exterior", date: "2025-07-31" },
  { notionId: "DESIGN-1498", title: "Design - NEW LOCATION Twibbon & Backdrop", output: 2, team: "Timedoor Academy", area: "General Request", date: "2025-07-31" },
  { notionId: "DESIGN-1512", title: "Edit - Ads Timedoor Academy [Jully]", output: 6, team: "Timedoor Academy", area: "Marketing Things / ADS", date: "2025-07-31" },
  { notionId: "DESIGN-1514", title: "Design - Facade KG & Cengkareng", output: 1, team: "Expansion", area: "Branch Interior & Exterior", date: "2025-07-31" },
  { notionId: "DESIGN-1532", title: "Edit - Video NEW TV Branch", output: 1, team: "Timedoor Academy", area: "General Request", date: "2025-07-31" },
  { notionId: "DESIGN-1579", title: "Design - Header RSVP - GO Tanjung Duren", output: 1, team: "Expansion", area: "General Request", date: "2025-07-31" },

  // August (request_date 2025-08-31)
  { notionId: "DESIGN-1494", title: "[Interior] Signage", output: 1, team: "Expansion", area: "Branch Interior & Exterior", date: "2025-08-31" },
  { notionId: "DESIGN-1598", title: "Design - Ubah layout Paper Doll", output: 1, team: "Timedoor Academy", area: "General Request", date: "2025-08-31" },
  { notionId: "DESIGN-1607", title: "Design - Ucapan Hari kemerdekaan", output: 1, team: "Timedoor Academy", area: "Content Media Social", date: "2025-08-31" },
  { notionId: "DESIGN-1622", title: "Design - Backdrop khusus Gorontalo", output: 1, team: "Expansion", area: "General Request", date: "2025-08-31" },
  { notionId: "DESIGN-1635", title: "Design - PPT Proposal Ms. Tyo", output: 1, team: "Timedoor Academy", area: "General Request", date: "2025-08-31" },
  { notionId: "DESIGN-1658", title: "Design - Logo YCWC 2025", output: 1, team: "YCWC", area: "General Request", date: "2025-08-31" },
  { notionId: "DESIGN-1654", title: "Edit - Video Kompilasi – Acara 17 Agustusan All Branch", output: 1, team: "Timedoor Academy", area: "Content Media Social", date: "2025-08-31" },
  { notionId: "DESIGN-1662", title: "Design - Event Recap 17 Agustus (Teacher from All Branch)", output: 1, team: "[Timedoor Academy] C-Level", area: "Content Media Social", date: "2025-08-31" },
  { notionId: "DESIGN-1675", title: "Design Landing Page YCWC", output: 1, team: "YCWC", area: "WEB", date: "2025-08-31" },
  { notionId: "DESIGN-1676", title: "Design - Guidebook", output: 1, team: "Timedoor Academy", area: "General Request", date: "2025-08-31" },
  { notionId: "DESIGN-1685", title: "Design Flyer Promo Coding + Merchandise Eksklusif", output: 1, team: "Expansion", area: "General Request", date: "2025-08-31" },
  { notionId: "DESIGN-1679", title: "Design - Pre GO BSD", output: 1, team: "Expansion", area: "Content Media Social", date: "2025-08-31" },
  { notionId: "DESIGN-1686", title: "[Interior] Glass Door Sticker", output: 1, team: "Expansion", area: "Branch Interior & Exterior", date: "2025-08-31" },
  { notionId: "DESIGN-1684", title: "Post - Event Recap 17 Agustus (Teacher from All Branch)", output: 1, team: "Timedoor Academy", area: "Content Media Social", date: "2025-08-31" },
  { notionId: "DESIGN-1687", title: "Post - Pre GO BSD", output: 1, team: "Expansion", area: "Content Media Social", date: "2025-08-31" },
  { notionId: "DESIGN-1690", title: "Post - Video Kompilasi – Acara 17 Agustusan All Branch", output: 1, team: "Timedoor Academy", area: "Content Media Social", date: "2025-08-31" },
  { notionId: "DESIGN-1695", title: "Edit - Video GO BSD", output: 1, team: "Expansion", area: "Content Media Social", date: "2025-08-31" },
  { notionId: "DESIGN-1698", title: "Design - Flyer Event YCWC", output: 1, team: "YCWC", area: "General Request", date: "2025-08-31" },
  { notionId: "DESIGN-1699", title: "Design - Certificate YCWC", output: 1, team: "YCWC", area: "General Request", date: "2025-08-31" },
  { notionId: "DESIGN-1706", title: "Poster YCWC 2025", output: 1, team: "YCWC", area: "General Request", date: "2025-08-31" },
  { notionId: "DESIGN-1708", title: "Design - Media promosi Badung Education Fair", output: 3, team: "Expansion", area: "General Request", date: "2025-08-31" },
  { notionId: "DESIGN-1569", title: "Post - Testimony Academy (Potrait)", output: 1, team: "Timedoor Academy", area: "Content Media Social", date: "2025-08-31" },
  { notionId: "DESIGN-1649", title: "Post - Video GO Mataram", output: 1, team: "Expansion", area: "General Request", date: "2025-08-31" },
  { notionId: "DESIGN-1646", title: "Post - Video GO Jagakarsa", output: 1, team: "Expansion", area: "General Request", date: "2025-08-31" },
];

function rowKey(row) {
  return [row.notion_id, row.title, row.team_id, row.category_id, row.request_date].join("\u001f");
}

(async () => {
  if (rows.length !== 44) throw new Error(`Expected 44 rows, got ${rows.length}`);
  const outputTotal = rows.reduce((sum, r) => sum + r.output, 0);
  if (outputTotal !== 52) throw new Error(`Expected total output 52, got ${outputTotal}`);

  for (const r of rows) {
    if (!teamIds[r.team]) throw new Error(`Unknown team: ${r.team} (${r.notionId})`);
    if (!categoryIds[r.area]) throw new Error(`Unknown work area: ${r.area} (${r.notionId})`);
  }

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
    request_date: r.date,
    deadline: r.date,
    completed_date: r.date,
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
    .in("request_date", ["2025-06-30", "2025-07-31", "2025-08-31"]);
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
