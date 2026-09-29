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
  Expansion: "expansion",
  HQ: "hq",
  Overseas: "overseas",
  Designer: "designer-27db1d11",
  "Content Creator": "content-creator-34bf3f68",
  Curricullum: "curriculum",
  "Marketing Team (Online)": "marketing-online",
  "Marketing Team (Offline)": "marketing-offline",
  "Web Team": "web-team-75aafce1",
  "Academy Pro": "academy-pro-9e510332",
  hisensei: "hisensei",
  LPK: "lpk-cda12f15",
};

const categoryIds = {
  "General Request": "general",
  "Content Media Social": "content-social",
  "Branch Interior & Exterior": "branch",
  WEB: "web",
  "Marketing Things / ADS": "marketing-ads",
  "Internal / Coordination": "internal",
  "Collect Footage": "footage",
  "Training / Team Develop / Bonding": "training",
};

function parseRows() {
  return fs.readFileSync("md/november.md", "utf8").split(/\r?\n/).flatMap((line) => {
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
  const trimmed = usage.trim();
  // Existing import convention: a bare Timedoor Academy usage identifies that team.
  if (trimmed === "Timedoor Academy") return "Timedoor Academy";
  const part = usage.split(",").map((value) => value.trim()).find((value) => value.startsWith("[Team] "));
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
  if (allRows.length !== 152) throw new Error(`Expected 152 source rows, got ${allRows.length}`);

  const zero = allRows.filter((row) => !Number.isInteger(row.outputCount) || row.outputCount < 1);
  const positive = allRows.filter((row) => Number.isInteger(row.outputCount) && row.outputCount >= 1);
  const ready = [];
  const pending = [];

  for (const row of positive) {
    const teamName = firstTeam(row.usage);
    const workAreaName = teamName ? firstArea(row.workAreaText) : null;
    if (!teamName || !workAreaName) {
      pending.push(row);
      continue;
    }
    if (!teamIds[teamName]) throw new Error(`Unknown team: ${teamName} (${row.notionId})`);
    if (!categoryIds[workAreaName]) throw new Error(`Unknown work area: ${workAreaName} (${row.notionId})`);
    ready.push({ ...row, teamName, workAreaName });
  }

  if (zero.length !== 36) throw new Error(`Expected 36 zero-output rows, got ${zero.length}`);
  if (positive.length !== 116) throw new Error(`Expected 116 positive rows, got ${positive.length}`);
  if (ready.length !== 100) throw new Error(`Expected 100 ready rows, got ${ready.length}`);
  if (pending.length !== 16) throw new Error(`Expected 16 pending rows, got ${pending.length}`);
  if (ready.reduce((sum, row) => sum + row.outputCount, 0) !== 108) {
    throw new Error("Ready output total must be 108");
  }

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const [{ data: teams, error: teamsError }, { data: categories, error: categoriesError }, { data: pm, error: pmError }] = await Promise.all([
    supabase.from("teams").select("id"),
    supabase.from("categories").select("id"),
    supabase.from("profiles").select("id").eq("role", "PM").order("created_at").limit(1).maybeSingle(),
  ]);
  if (teamsError || categoriesError || pmError) throw teamsError || categoriesError || pmError;
  if (!pm) throw new Error("No PM profile found");

  const existingTeamIds = new Set((teams || []).map((row) => row.id));
  const existingCategoryIds = new Set((categories || []).map((row) => row.id));
  for (const row of ready) {
    if (!existingTeamIds.has(teamIds[row.teamName])) throw new Error(`Missing team ID: ${row.teamName}`);
    if (!existingCategoryIds.has(categoryIds[row.workAreaName])) throw new Error(`Missing work area ID: ${row.workAreaName}`);
  }

  const requestDate = "2025-11-30";
  const desiredRows = ready.map((row) => ({
    notion_id: row.notionId,
    title: row.title,
    team_id: teamIds[row.teamName],
    category_id: categoryIds[row.workAreaName],
    request_date: requestDate,
    deadline: requestDate,
    completed_date: requestDate,
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
    .eq("request_date", requestDate);
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

  const { data: novemberRows, error: verifyError } = await supabase
    .from("requests")
    .select("notion_id, title, team_id, category_id, request_date, output_count")
    .eq("request_date", requestDate);
  if (verifyError) throw verifyError;
  const positiveIds = new Set(positive.map((row) => row.notionId));
  const zeroIds = new Set(zero.map((row) => row.notionId));
  const invalidRows = (novemberRows || []).filter((row) =>
    row.output_count < 1 || zeroIds.has(row.notion_id) || !positiveIds.has(row.notion_id),
  );
  if (invalidRows.length) {
    throw new Error(`Verification failed: ${invalidRows.length} invalid November rows found`);
  }
  const importedIds = new Set((novemberRows || []).map((row) => row.notion_id));
  for (const row of ready) {
    if (!importedIds.has(row.notionId)) throw new Error(`Verification missing imported row: ${row.notionId}`);
  }

  console.log(JSON.stringify({
    sourceRows: allRows.length,
    zeroOutputCount: zero.length,
    positiveCount: positive.length,
    readyCount: ready.length,
    readyOutputTotal: ready.reduce((sum, row) => sum + row.outputCount, 0),
    pendingCount: pending.length,
    inserted: toInsert.length,
    alreadyPresent: desiredRows.length - toInsert.length,
    verifiedNovemberRows: novemberRows.length,
    verifiedInvalidRows: invalidRows.length,
  }, null, 2));

  console.log("\n---ZERO OUTPUT (excluded)---");
  for (const row of zero) console.log(`${row.notionId}\t${row.title}\toutput=${row.outputCount}`);

  console.log("\n---PENDING POSITIVE (not imported; source lacks Team or Work Area)---");
  for (const row of pending) console.log(`${row.notionId}\t${row.title}\toutput=${row.outputCount}\tusage=\"${row.usage}\"\tarea=\"${row.workAreaText}\"`);
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
