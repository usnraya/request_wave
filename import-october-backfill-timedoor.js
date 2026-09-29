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

// Rule confirmed by user: plain "Timedoor Academy" usage (no [Team] tag) => Team = Timedoor Academy.
// Only rows with BOTH resolved team AND nonempty source Work Area are imported here.
const rows = [
  ["DESIGN-1877", "Design - Certif YCWC(Nasional)", 1, "General Request"],
  ["DESIGN-1914", "Design - Foamboard Juara YCWC", 1, "General Request"],
  ["DESIGN-1912", "Design - Sertif TOT YCWC", 1, "General Request"],
  ["DESIGN-1909", "Design - Website & LMS Banner promo YCWC2025", 1, "General Request"],
  ["DESIGN-1924", "Desain - Keperluan Kompetisi Lokal", 2, "General Request"],
  ["DESIGN-1932", "Design - Konten IG - Kenapa Harus Ikut YCWC 2025?", 1, "General Request"],
  ["DESIGN-1947", "Record LMS Freelance", 1, "Collect Footage"],
  ["DESIGN-1939", "Take Content - YCWC #2", 1, "Content Media Social"],
  ["DESIGN-1944", "Design - GoodieBag YCWC", 1, "General Request"],
  ["DESIGN-1949", "Design - Stiker YCWC", 1, "General Request"],
  ["DESIGN-1950", "Edit - Foto MNC Academy X Academy", 1, "General Request"],
  ["DESIGN-1959", "Design - Certif YCWC Lokal AI", 1, "General Request"],
  ["DESIGN-2003", "Edit Content YCWC #2 Kak Dio - Part 2", 1, "Content Media Social"],
  ["DESIGN-2013", "Edit Content YCWC #2 Kak Dio - Part 1", 1, "Content Media Social"],
  ["DESIGN-2020", "Design - Local Event Medal - front design", 1, "General Request"],
  ["DESIGN-2016", "Design - YCWC Flyer Malaysia", 2, "General Request"],
  ["DESIGN-2029", "Design - Denah Skema 2 YCWC", 1, "General Request"],
  ["DESIGN-2028", "Design - Sertif Tambahan YCWC", 1, "General Request"],
  ["DESIGN-2022", "Design - Konten IG - How to Prepare for YCWC 2025", 1, "General Request"],
  ["DESIGN-2034", "Design - Denah YCWC", 1, "General Request"],
  ["DESIGN-2035", "Design - YCWC T-Shirt Merch", 1, "General Request"],
  ["DESIGN-2069", "Design - Local Event Medal - back design", 1, "General Request"],
  ["DESIGN-2070", "Design & Animate - Story Reminder Pendaftaran YCWC", 1, "General Request"],
  ["DESIGN-2080", "Design - Varsity Merch YCWC", 1, "General Request"],
  ["DESIGN-2088", "Design IG - Famous People Who Started with Coding", 1, "General Request"],
  ["DESIGN-2087", "Edit - Ads General", 1, "Marketing Things / ADS"],
  ["DESIGN-2092", "Design - Bag Merch YCWC", 1, "General Request"],
  ["DESIGN-2097", "Take Video - Talent Ads Academy", 1, "Collect Footage"],
  ["DESIGN-2096", "List - Marketing tools Timedoor Academy Pro (Lulusan berangkat ke Jepang)", 1, "Marketing Things / ADS"],
  ["DESIGN-2098", "Design - Poster / Flyer Followup YCWC", 1, "General Request"],
  ["DESIGN-2118", "Design - Ticket YCWC", 1, "General Request"],
  ["DESIGN-2112", "Design - Tambahan Merch YCWC Lokal", 4, "General Request"],
  ["DESIGN-2135", "Take Video - Talent Ads Academy", 1, "Collect Footage"], // area text "Collect Footage, Marketing Things / ADS" -> first area per existing rule
  ["DESIGN-2131", "Design - YCWC Twibbon", 1, "General Request"],
  ["DESIGN-2148", "Design - Perpanjangan Pendaftaran YCWC", 1, "General Request"],
].map(([notionId, title, outputCount, workAreaName]) => ({ notionId, title, outputCount, workAreaName, teamName: "Timedoor Academy" }));

rows.push(
  ...[
    ["DESIGN-1926", "Post - Alur Kompetisi YCWC", 1, "Content Media Social", "Timedoor Academy"],
    ["DESIGN-1930", "Post - Expansion Event", 1, "Content Media Social", "Timedoor Academy"],
    ["DESIGN-2021", "Post - Kenapa harus Ikut YCWC", 1, "Content Media Social", "Timedoor Academy"],
    ["DESIGN-2079", "Post - 03. Kenapa Harus Ikut YCWC?", 1, "Content Media Social", "Timedoor Academy"],
    ["DESIGN-1886", "Design - Walking Customer - Direction ke Resepsionis", 1, "General Request", "Timedoor Academy"],
    ["DESIGN-2055", "Edit - Badung Education Fest 2025 Puspem", 1, "Content Media Social", "Timedoor Academy"],
    ["DESIGN-2108", "Design - Main Mural KG", 1, "Branch Interior & Exterior", "Expansion"],
    ["DESIGN-2100", "Design - Door Sticker", 1, "Branch Interior & Exterior", "Expansion"],
    ["DESIGN-2126", "Design - Main Mural KG", 1, "Branch Interior & Exterior", "Expansion"],
  ].map(([notionId, title, outputCount, workAreaName, teamName]) => ({ notionId, title, outputCount, workAreaName, teamName })),
);

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
const teamIds = {
  "Timedoor Academy": "timedoor-academy-b6dd83ba",
  Expansion: "expansion",
};

function rowKey(row) {
  return [row.notion_id, row.title, row.team_id, row.category_id, row.request_date].join("\u001f");
}

(async () => {
  if (rows.length !== 44) throw new Error(`Expected 44 candidate rows, got ${rows.length}`);
  const outputTotal = rows.reduce((s, r) => s + r.outputCount, 0);
  if (outputTotal !== 49) throw new Error(`Expected total output 49, got ${outputTotal}`);
  for (const r of rows) if (!categoryIds[r.workAreaName]) throw new Error(`Unknown work area: ${r.workAreaName} (${r.notionId})`);
  for (const r of rows) if (!teamIds[r.teamName]) throw new Error(`Unknown team: ${r.teamName} (${r.notionId})`);

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
    category_id: categoryIds[r.workAreaName],
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

  console.log(JSON.stringify({
    candidateRows: rows.length,
    candidateOutputTotal: outputTotal,
    inserted: toInsert.length,
    alreadyPresent: desiredRows.length - toInsert.length,
  }, null, 2));
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
