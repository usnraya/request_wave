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
  "Expansion": "expansion",
  "HR - Academy": "hr-academy-dd16e6dd",
  "Web Team": "web-team-75aafce1",
  "HR - Timedoor": "hr-timedoor-f2aa1ee8",
  "Designer": "designer-27db1d11",
  "Marketing Team (Offline)": "marketing-offline",
  "Overseas": "overseas",
  "HQ": "hq",
  "hisensei": "hisensei",
  "Content Creator": "content-creator-34bf3f68",
  "[Timedoor Academy] C-Level": "timedoor-academy-c-level-42ef0870",
  "Curricullum": "curriculum",
  "System Support": "system-support-fb07d9ec",
};

const categoryIds = {
  "General Request": "general",
  "WEB": "web",
  "Internal / Coordination": "internal",
  "Marketing Things / ADS": "marketing-ads",
  "Content Media Social": "content-social",
  "Collect Footage": "footage",
  "Branch Interior & Exterior": "branch",
  "LMS / System": "lms",
};

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

function firstTeam(usage) {
  if (usage.trim() === "[Timedoor Academy] C-Level") return "[Timedoor Academy] C-Level";
  const part = usage.split(",").map((p) => p.trim()).find((p) => p.startsWith("[Team] "));
  return part ? part.slice("[Team] ".length).trim() : null;
}

function firstArea(workAreaText) {
  return workAreaText.split(",")[0].trim() || null;
}

function rowKey(row) {
  return [row.notion_id, row.title, row.team_id, row.category_id, row.request_date].join("\u001f");
}

(async () => {
  const allRows = parseRows();
  if (allRows.length !== 150) throw new Error(`Expected 150 source rows, got ${allRows.length}`);

  const zero = allRows.filter((r) => !Number.isInteger(r.outputCount) || r.outputCount < 1);
  const positive = allRows.filter((r) => Number.isInteger(r.outputCount) && r.outputCount >= 1);

  const ready = [];
  const pendingClarification = [];
  for (const r of positive) {
    const teamName = firstTeam(r.usage);
    const workAreaName = teamName ? firstArea(r.workAreaText) : null;
    if (teamName && workAreaName) {
      if (!teamIds[teamName]) throw new Error(`Unknown team: ${teamName} (${r.notionId})`);
      if (!categoryIds[workAreaName]) throw new Error(`Unknown work area: ${workAreaName} (${r.notionId})`);
      ready.push({ ...r, teamName, workAreaName });
    } else {
      pendingClarification.push(r);
    }
  }

  if (ready.length !== 77) throw new Error(`Expected 77 ready rows, got ${ready.length}`);
  const readyOutputTotal = ready.reduce((s, r) => s + r.outputCount, 0);
  if (readyOutputTotal !== 82) throw new Error(`Expected 82 ready outputs, got ${readyOutputTotal}`);

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const [{ data: teams, error: teamsError }, { data: categories, error: categoriesError }, { data: pm, error: pmError }] = await Promise.all([
    supabase.from("teams").select("id"),
    supabase.from("categories").select("id"),
    supabase.from("profiles").select("id").eq("role", "PM").order("created_at").limit(1).maybeSingle(),
  ]);
  if (teamsError || categoriesError || pmError) throw teamsError || categoriesError || pmError;
  const existingTeamIds = new Set((teams || []).map((row) => row.id));
  const existingCategoryIds = new Set((categories || []).map((row) => row.id));
  for (const row of ready) {
    if (!existingTeamIds.has(teamIds[row.teamName])) throw new Error(`Missing team ID: ${row.teamName}`);
    if (!existingCategoryIds.has(categoryIds[row.workAreaName])) throw new Error(`Missing category ID: ${row.workAreaName}`);
  }
  if (!pm) throw new Error("No PM profile found");

  const desiredRows = ready.map((row) => ({
    notion_id: row.notionId,
    title: row.title,
    team_id: teamIds[row.teamName],
    category_id: categoryIds[row.workAreaName],
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
    output_count: row.outputCount,
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
    sourceRows: allRows.length,
    zeroOutputCount: zero.length,
    positiveCount: positive.length,
    readyCount: ready.length,
    readyOutputTotal,
    pendingClarificationCount: pendingClarification.length,
    inserted: toInsert.length,
    alreadyPresent: desiredRows.length - toInsert.length,
  }, null, 2));

  console.log("\n---PENDING CLARIFICATION (positive output, missing Team and/or Work Area — NOT imported)---");
  for (const r of pendingClarification) {
    console.log(`${r.notionId}\t${r.title}\toutput=${r.outputCount}\tusage="${r.usage}"\tarea="${r.workAreaText}"`);
  }
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
