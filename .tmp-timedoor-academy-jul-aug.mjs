import fs from "node:fs";

const apply = process.argv.includes("--apply");
const copyShared = process.argv.includes("--copy-shared");
const source = "md/timedoor-academy-jul-aug-2026.md";
const teamId = "timedoor-academy-b6dd83ba";
const year = 2026;
const monthNumbers = { Jul: 7, Aug: 8 };
const categoryAliases = new Map([
  ["campaign/event", "campaign / event"],
  ["property event / merchandise", "merchandise / property event"],
]);

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter((line) => line && !line.startsWith("#")).map((line) => {
    const index = line.indexOf("=");
    return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
  }),
);
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const base = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;
async function api(path, init = {}) {
  const response = await fetch(`${base}/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`${init.method ?? "GET"} ${path}: ${response.status} ${body}`);
  return body ? JSON.parse(body) : [];
}
async function all(path) {
  const result = [];
  for (let offset = 0; ; offset += 1000) {
    const page = await api(`${path}&limit=1000&offset=${offset}`);
    result.push(...page);
    if (page.length < 1000) return result;
  }
}
const normalize = (value) => value.trim().toLowerCase().replace(/\s+/g, " ");
function dateFor(deadline, id) {
  const month = deadline.match(/\b(Jul|Aug)\b/)?.[1];
  if (!month) throw new Error(`${id}: no Jul/Aug in '${deadline}'`);
  const monthNumber = monthNumbers[month];
  return `${year}-${String(monthNumber).padStart(2, "0")}-${new Date(year, monthNumber, 0).getDate()}`;
}

const rows = fs.readFileSync(source, "utf8").split(/\r?\n/)
  .filter((line) => line.startsWith("| DESIGN-"))
  .map((line) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()))
  .map(([id, title, output, usage, work, deadline]) => {
    const sourceCategory = normalize(work);
    return { id, title, output: Number(output), usage, work, categoryName: categoryAliases.get(sourceCategory) ?? sourceCategory, date: dateFor(deadline, id), deadline };
  });
if (rows.length !== 23) throw new Error(`Expected 23 source rows, found ${rows.length}`);
if (new Set(rows.map((row) => row.id)).size !== rows.length) throw new Error("Source contains duplicate DESIGN IDs");
if (rows.some((row) => !Number.isInteger(row.output) || row.output < 1)) throw new Error("Source contains invalid output count");

const teams = await all("teams?select=id,name");
const team = teams.find((item) => item.id === teamId);
if (!team) throw new Error(`Missing team '${teamId}'. Available Academy teams: ${teams.filter((item) => normalize(item.name).includes("academy")).map((item) => `${item.id}:${item.name}`).join(" | ")}`);
const categories = await all("categories?select=id,name");
const categoryByName = new Map(categories.map((category) => [normalize(category.name), category]));
const unresolved = [...new Set(rows.map((row) => row.categoryName))].filter((name) => !categoryByName.has(name));
if (unresolved.length) throw new Error(`Unmapped source categories: ${unresolved.join(", ")}. DB categories: ${categories.map((category) => category.name).join(", ")}`);
for (const row of rows) row.category_id = categoryByName.get(row.categoryName).id;

const existing = await all("requests?select=id,notion_id,title,team_id,category_id,request_date,output_count&order=id.asc");
const byNotion = new Map();
for (const request of existing) {
  if (!request.notion_id) continue;
  if (!byNotion.has(request.notion_id)) byNotion.set(request.notion_id, []);
  byNotion.get(request.notion_id).push(request);
}
const insert = [], update = [], unchanged = [], shared = [];
for (const row of rows) {
  const matches = byNotion.get(row.id) ?? [];
  const mine = matches.find((request) => request.team_id === teamId);
  if (mine) {
    const changed = mine.title !== row.title || mine.category_id !== row.category_id || mine.request_date !== row.date || mine.output_count !== row.output;
    (changed ? update : unchanged).push({ row, mine });
  } else if (matches.length) {
    shared.push({ row, existing: matches.map((request) => `${request.team_id}@${request.request_date}/${request.output_count}`) });
  } else insert.push(row);
}
const toInsert = copyShared ? [...insert, ...shared.map(({ row }) => row)] : insert;
const sourceIds = new Set(rows.map((row) => row.id));
const stale = existing.filter((request) => request.team_id === teamId && /^2026-0[78]-/.test(request.request_date) && !sourceIds.has(request.notion_id));
const sum = (values) => values.reduce((total, value) => total + value, 0);
const report = {
  team: { id: team.id, name: team.name },
  sourceRows: rows.length,
  sourceOutputs: sum(rows.map((row) => row.output)),
  byMonth: Object.fromEntries(["2026-07", "2026-08"].map((month) => [month, {
    rows: rows.filter((row) => row.date.startsWith(month)).length,
    outputs: sum(rows.filter((row) => row.date.startsWith(month)).map((row) => row.output)),
  }])),
  categories: Object.fromEntries([...new Set(rows.map((row) => row.categoryName))].map((name) => [name, categoryByName.get(name).id])),
  mode: copyShared ? "copy-shared: shared rows are ALSO inserted into Academy (originals untouched)" : "default: shared rows left only in their existing team",
  toInsert: toInsert.map((row) => row.id),
  toUpdate: update.map(({ row, mine }) => ({ id: row.id, from: { title: mine.title, category: mine.category_id, date: mine.request_date, output: mine.output_count }, to: { title: row.title, category: row.category_id, date: row.date, output: row.output } })),
  unchanged: unchanged.length,
  sharedWithOtherTeams: shared.map(({ row, existing: teamsFound }) => ({ id: row.id, output: row.output, existing: teamsFound })),
  expectedAcademyJulAugAfterApply: {
    rows: unchanged.length + update.length + toInsert.length,
    outputs: sum(unchanged.map(({ row }) => row.output)) + sum(update.map(({ row }) => row.output)) + sum(toInsert.map((row) => row.output)),
  },
  staleAcademyJulAugNotInSource: stale.map((request) => ({ id: request.id, notion: request.notion_id, title: request.title, date: request.request_date, output: request.output_count })),
};
console.log(JSON.stringify(report, null, 2));
if (!apply) { console.log("DRY RUN - nothing written. Rerun with --apply (optionally --copy-shared)."); process.exit(0); }

const requester = (await api("profiles?select=id&role=eq.PM&order=created_at.asc&limit=1"))[0];
if (!requester) throw new Error("No PM profile found");
const fields = (row) => ({ title: row.title, notion_id: row.id, team_id: teamId, category_id: row.category_id, request_date: row.date, deadline: row.date, completed_date: row.date, output_count: row.output });
if (toInsert.length) {
  await api("requests", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(toInsert.map((row) => ({
      id: crypto.randomUUID(), request_code: `REQ-${year}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      ...fields(row), requester_id: requester.id, designer_id: null, priority: "medium", status: "done", estimated_hours: 0, actual_hours: null,
      description: `Source: ${source}. Deadline reference: ${row.deadline}. Usage Location: ${row.usage}. Work Area: ${row.work}.`, figma_url: null, drive_url: null,
    }))),
  });
}
for (const { row, mine } of update) {
  await api(`requests?id=eq.${encodeURIComponent(mine.id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(fields(row)) });
}
const after = await all(`requests?select=notion_id,output_count,request_date&team_id=eq.${teamId}&request_date=gte.2026-07-01&request_date=lte.2026-08-31`);
console.log(JSON.stringify({ applied: { inserted: toInsert.length, updated: update.length }, academyJulAugNow: { rows: after.length, outputs: sum(after.map((row) => row.output_count)) } }, null, 2));
