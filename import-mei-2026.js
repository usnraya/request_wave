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
  Timedoor: "timedoor",
  Playschool: "playschool",
  Expansion: "expansion",
  YCWC: "ycwc",
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
  "System Support": "system-support-fb07d9ec",
  "Online Team - Admin": "online-team-admin-ebd54d95",
  "HR - Academy": "hr-academy-dd16e6dd",
};

const categoryIds = {
  "General Request": "general",
  "Content Media Social": "content-social",
  "Branch Interior & Exterior": "branch",
  WEB: "web",
  "Marketing Things / ADS": "marketing-ads",
  "Marketing Things/ ADS": "marketing-ads",
  "Internal / Coordination": "internal",
  "Collect Footage": "footage",
  "Training / Team Develop / Bonding": "training",
  "LMS / System": "lms",
  Guideline: "guideline",
  "Campaign/Event": "campaign",
  "Campaign / Event": "campaign",
  "Teacher Support": "teacher-support",
  "Merchandise / Property Event": "merchandise",
  "Property Event / Merchandise": "merchandise",
  "Meta Ads / Custom Ads": "meta-ads-custom-ads-8dce2e6c",
  Certificate: "certificate",
  Hiring: "hiring",
  "Offline Marketing": "offline-ads",
  "Offline Ads": "offline-ads",
  Greetings: "greetings",
  "Curriculum Materials": "curriculum-materials",
  "Team System": "team-system",
  "Uniform Design": "uniform",
};

const inferredTeams = {
  "DESIGN-3877": "Expansion",
  "DESIGN-3891": "YCWC",
  "DESIGN-3898": "Marketing Team (Online)",
  "DESIGN-4067": "Playschool",
  "DESIGN-4077": "YCWC",
  "DESIGN-4078": "YCWC",
  "DESIGN-4080": "Playschool",
  "DESIGN-4099": "Marketing Team (Online)",
  "DESIGN-4119": "YCWC",
  "DESIGN-4124": "Marketing Team (Online)",
  "DESIGN-4126": "Marketing Team (Online)",
  "DESIGN-4196": "Marketing Team (Online)",
  "DESIGN-4203": "Marketing Team (Online)",
  "DESIGN-4207": "Playschool",
  "DESIGN-4232": "Expansion",
  "DESIGN-4233": "Expansion",
  "DESIGN-4234": "Expansion",
  "DESIGN-4264": "YCWC",
  "DESIGN-4266": "Expansion",
  "DESIGN-4267": "Expansion",
};

const requestDate = "2026-05-31";
const sourcePath = "2026_md/task_design_mei.md";
const excludedIds = new Set(["DESIGN-3966", "DESIGN-3898", "DESIGN-4203"]);

function parseRows() {
  return fs.readFileSync(sourcePath, "utf8").split(/\r?\n/).flatMap((line) => {
    if (!line.startsWith("| DESIGN-")) return [];
    const cells = line
      .replace(/\\\|/g, "\u0001")
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim().replace(/\u0001/g, "|"));
    if (cells.length !== 5) throw new Error(`Malformed source row: ${line}`);
    const [notionId, title, outputText, usage, workAreaText] = cells;
    return {
      notionId,
      title,
      outputText,
      outputCount: outputText === "" ? null : Number(outputText),
      usage,
      workAreaText,
    };
  });
}

function firstTeam(usage) {
  const parts = usage.split(",").map((value) => value.trim());
  const marker = parts.find((value) => value.startsWith("[Team] "));
  if (marker) return marker.slice("[Team] ".length).trim();
  const namedTeam = parts.find((value) =>
    value === "Timedoor" ||
    value === "Timedoor Academy" ||
    value === "YCWC",
  );
  if (namedTeam) return namedTeam;
  if (parts.some((value) => /^\[Overseas\s*\]/.test(value))) return "Overseas";
  return null;
}

function firstArea(workAreaText) {
  return workAreaText.split(",")[0].trim() || null;
}

function rowKey(row) {
  return [row.notion_id, row.title, row.team_id, row.category_id, row.request_date].join("\u001f");
}

function sourceKey(row) {
  return [row.notionId, row.title].join("\u001f");
}

(async () => {
  const allRows = parseRows();
  if (allRows.length !== 271) throw new Error(`Expected 271 source rows, got ${allRows.length}`);

  const zero = allRows.filter((row) => row.outputText === "0");
  const blank = allRows.filter((row) => row.outputText === "");
  const malformed = allRows.filter((row) =>
    row.outputText !== "0" && row.outputText !== "" &&
    (!/^\d+$/.test(row.outputText) || !Number.isInteger(row.outputCount) || row.outputCount < 0),
  );
  const positive = allRows.filter((row) =>
    /^\d+$/.test(row.outputText) && Number.isInteger(row.outputCount) && row.outputCount >= 1,
  );
  if (malformed.length) {
    throw new Error(`Malformed Output Task values: ${malformed.map((row) => row.notionId).join(", ")}`);
  }

  const ready = [];
  const pending = [];
  for (const row of positive) {
    if (excludedIds.has(row.notionId)) continue;
    const teamName = firstTeam(row.usage) || inferredTeams[row.notionId];
    const workAreaName = firstArea(row.workAreaText);
    if (!teamName || !workAreaName || !teamIds[teamName] || !categoryIds[workAreaName]) {
      pending.push({ ...row, teamName, workAreaName });
      continue;
    }
    ready.push({ ...row, teamName, workAreaName });
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
      request_code: `REQ-2026-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      ...row,
    }));

  if (toInsert.length) {
    const { error } = await supabase.from("requests").insert(toInsert);
    if (error) throw error;
  }

  const { data: mayRows, error: verifyError } = await supabase
    .from("requests")
    .select("notion_id, title, team_id, category_id, request_date, output_count")
    .eq("request_date", requestDate);
  if (verifyError) throw verifyError;

  const positiveKeys = new Set(ready.map(sourceKey));
  const zeroIds = new Set(zero.map((row) => row.notionId));
  const maySourceRows = (mayRows || []).filter((row) =>
    positiveKeys.has(sourceKey({ notionId: row.notion_id, title: row.title })),
  );
  if (maySourceRows.length !== ready.length) {
    throw new Error(`Verification expected ${ready.length} May rows, found ${maySourceRows.length}`);
  }
  const invalidRows = (mayRows || []).filter((row) =>
    row.request_date !== requestDate ||
    row.output_count < 1 ||
    zeroIds.has(row.notion_id) ||
    !positiveKeys.has(sourceKey({ notionId: row.notion_id, title: row.title })),
  );
  if (invalidRows.length) throw new Error(`Verification failed: ${invalidRows.length} invalid May rows found`);

  console.log(JSON.stringify({
    sourceRows: allRows.length,
    zeroOutputCount: zero.length,
    blankOutputCount: blank.length,
    malformedOutputCount: malformed.length,
    positiveCount: positive.length,
    readyCount: ready.length,
    readyOutputTotal: ready.reduce((sum, row) => sum + row.outputCount, 0),
    pendingCount: pending.length,
    inserted: toInsert.length,
    alreadyPresent: desiredRows.length - toInsert.length,
    verifiedMayRows: maySourceRows.length,
    verifiedInvalidRows: invalidRows.length,
  }, null, 2));

  console.log("\n---INPUT (positive output)---");
  for (const row of ready) console.log(`${row.notionId}\t${row.title}\tteam=${row.teamName}\tworkArea=${row.workAreaName}\toutput=${row.outputCount}`);
  console.log("\n---ZERO OUTPUT (excluded)---");
  for (const row of zero) console.log(`${row.notionId}\t${row.title}\toutput=${row.outputText}`);
  console.log("\n---BLANK OUTPUT (excluded)---");
  for (const row of blank) console.log(`${row.notionId}\t${row.title}\toutput=blank`);
  console.log("\n---PENDING POSITIVE (not imported; source lacks Team or Work Area)---");
  for (const row of pending) console.log(`${row.notionId}\t${row.title}\toutput=${row.outputCount}\tusage=\"${row.usage}\"\tarea=\"${row.workAreaText}\"`);
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
