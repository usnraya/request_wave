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
  "hisensei": "hisensei",
  "HQ": "hq",
  "Overseas": "overseas",
  "HR - Academy": "hr-academy-dd16e6dd",
  "Expansion": "expansion",
  "Designer": "designer-27db1d11",
  "Online Team - Admin": "online-team-admin-ebd54d95",
  "Academy Pro": "academy-pro-9e510332",
  "Marketing Team (Online)": "marketing-online",
  "Curricullum": "curriculum",
  "Web Team": "web-team-75aafce1",
  "LPK": "lpk-cda12f15",
};

const categoryIds = {
  "General Request": "general",
  "Content Media Social": "content-social",
  "Branch Interior & Exterior": "branch",
  "WEB": "web",
  "Marketing Things / ADS": "marketing-ads",
  "Internal / Coordination": "internal",
  "Collect Footage": "footage",
  "Team System": "team-system",
  "LMS / System": "lms",
};

function parseRows() {
  const lines = fs.readFileSync("md/july.md", "utf8").split(/\r?\n/);
  return lines.flatMap((line) => {
    if (!line.startsWith("| DESIGN-")) return [];
    const cells = line
      .replace(/\\\|/g, "\u0001")
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim().replace(/\u0001/g, "|"));
    if (cells.length !== 5) throw new Error(`Malformed source row: ${line}`);
    const [notionId, title, outputText, usage, workAreaText] = cells;
    const outputCount = Number(outputText);
    const teamPart = usage
      .split(",")
      .map((part) => part.trim())
      .find((part) => part.startsWith("[Team] "));
    if (!Number.isInteger(outputCount) || outputCount < 1 || !teamPart) return [];
    const teamName = teamPart.slice("[Team] ".length).trim();
    const workAreaName = workAreaText.split(",")[0].trim();
    if (!workAreaName) return [];
    if (!teamIds[teamName]) throw new Error(`Unknown team: ${teamName} (${notionId})`);
    if (!categoryIds[workAreaName]) throw new Error(`Unknown work area: ${workAreaName} (${notionId})`);
    return [{ notionId, title, outputCount, teamName, workAreaName }];
  });
}

function rowKey(row) {
  return [row.notion_id, row.title, row.team_id, row.category_id, row.request_date].join("\u001f");
}

(async () => {
  const sourceRows = parseRows();
  const outputTotal = sourceRows.reduce((sum, row) => sum + row.outputCount, 0);
  if (sourceRows.length !== 109 || outputTotal !== 116) {
    throw new Error(`Source validation failed: ${sourceRows.length} rows, ${outputTotal} outputs`);
  }

  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const [{ data: teams, error: teamsError }, { data: categories, error: categoriesError }, { data: pm, error: pmError }] = await Promise.all([
    supabase.from("teams").select("id"),
    supabase.from("categories").select("id"),
    supabase.from("profiles").select("id").eq("role", "PM").order("created_at").limit(1).maybeSingle(),
  ]);
  if (teamsError || categoriesError || pmError) throw teamsError || categoriesError || pmError;
  const existingTeamIds = new Set((teams || []).map((row) => row.id));
  const existingCategoryIds = new Set((categories || []).map((row) => row.id));
  for (const row of sourceRows) {
    if (!existingTeamIds.has(teamIds[row.teamName])) throw new Error(`Missing team ID: ${row.teamName}`);
    if (!existingCategoryIds.has(categoryIds[row.workAreaName])) throw new Error(`Missing category ID: ${row.workAreaName}`);
  }
  if (!pm) throw new Error("No PM profile found");

  const desiredRows = sourceRows.map((row) => ({
    notion_id: row.notionId,
    title: row.title,
    team_id: teamIds[row.teamName],
    category_id: categoryIds[row.workAreaName],
    request_date: "2025-07-31",
    deadline: "2025-07-31",
    completed_date: "2025-07-31",
    requester_id: pm.id,
    designer_id: null,
    priority: "medium",
    status: "done",
    estimated_hours: 0,
    actual_hours: null,
    description: null,
    figma_url: null,
    drive_url: null,
    output_count: row.outputCount,
  }));

  const { data: existing, error: existingError } = await supabase
    .from("requests")
    .select("id, notion_id, title, team_id, category_id, request_date")
    .eq("request_date", "2025-07-31");
  if (existingError) throw existingError;
  const existingKeys = new Set((existing || []).map(rowKey));
  const rows = desiredRows
    .filter((row) => !existingKeys.has(rowKey(row)))
    .map((row) => ({
      id: crypto.randomUUID(),
      request_code: `REQ-2025-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      ...row,
    }));

  if (rows.length) {
    const { error } = await supabase.from("requests").insert(rows);
    if (error) throw error;
  }
  console.log(JSON.stringify({ sourceRows: sourceRows.length, sourceOutputTotal: outputTotal, inserted: rows.length, alreadyPresent: desiredRows.length - rows.length }, null, 2));
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
