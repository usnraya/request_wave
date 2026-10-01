import fs from "node:fs";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
    }),
);

const sourcePath = "md/task-25.md";
const source = fs.readFileSync(sourcePath, "utf8");
const dryRun = process.argv.includes("--dry-run");
const reportOnly = process.argv.includes("--report");
const validationOnly = dryRun || reportOnly;
const allowedMonths = new Set(["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]);
const approvedSkippedIds = new Set([
  "DESIGN-1400",
  "DESIGN-1569",
  "DESIGN-1638",
  "DESIGN-1668",
  "DESIGN-2017",
  "DESIGN-2044",
  "DESIGN-2079",
  "DESIGN-2127",
  "DESIGN-2205",
  "DESIGN-2207",
]);
const titleSkipRules = [
  ["meeting", /\bmeeting\w*\b/i],
  ["discuss", /\bdiscuss\w*\b/i],
  ["take", /\btake\w*\b/i],
  ["file", /\bfile\b/i],
  ["web", /\bweb\b/i],
  ["day off", /\bday[\s-]+off\b/i],
  ["documentation", /\bdocumentation\b/i],
  ["internal event", /\binternal[\s-]+event\b/i],
  ["list portfolio", /\blist[\s-]+portfolio\b/i],
  ["last day", /\blast[\s-]+day\b/i],
  ["manage data", /\bmanage[\s-]+data\b/i],
  ["scripting content carousel", /\bscripting[\s-]+content[\s-]+carousel\b/i],
];
const monthNumber = { Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
const knownCategories = new Set([
  "General Request",
  "Content Media Social",
  "Branch Interior & Exterior",
  "WEB",
  "Marketing Things / ADS",
  "LMS / System",
  "Collect Footage",
  "Internal / Coordination",
  "Training / Team Develop / Bonding",
  "Training / Team Development",
  "Team System",
]);
const monthNames = { Jun: "June", Jul: "July", Aug: "August", Sep: "September", Oct: "October", Nov: "November", Dec: "December" };
const monthPattern = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g;
const categoryAliases = new Map([
  ["General Request", "General Request"],
  ["Content Media Social", "Content Media Social"],
  ["Branch Interior & Exterior", "Branch Interior & Exterior"],
  ["WEB", "WEB"],
  ["Marketing Things / ADS", "Marketing Things / ADS"],
  ["LMS / System", "LMS"],
  ["Collect Footage", "Collect Footage"],
  ["Internal / Coordination", "Internal / Coordination"],
  ["Training / Team Develop / Bonding", "Training / Team Development"],
  ["Training / Team Development", "Training / Team Development"],
  ["Team System", "Team System"],
]);
const teamAlias = new Map([
  ["Marketing Team (Online)", "Marketing Team Online"],
  ["Marketing Team (Offline)", "Marketing Team Offline"],
  ["Curricullum", "Curriculum"],
  ["hisensei", "Hisensei"],
  ["Timedoor Academy", "Timedoor"],
  ["Offline ID", "Marketing Team Offline"],
]);
const teamNameAliases = new Map([
  ["Timedoor Academy", "Timedoor"],
  ["[Timedoor Academy] C-Level", "Timedoor"],
  ["[Event] Empty", "Timedoor"],
  ["[Overseas] Egypt", "Overseas"],
  ["[Overseas] : Egypt", "Overseas"],
  ["[Overseas] : Malaysia", "Overseas"],
  ["[Overseas : Bangladesh]", "Overseas"],
  ["Offline ID", "Marketing Team Offline"],
]);
const canonicalTeamNames = new Set([
  "Expansion",
  "Marketing Team Online",
  "Curriculum",
  "HQ",
  "Hisensei",
  "Overseas",
  "Marketing Team Offline",
  "Timedoor",
  "Designer",
  "Online Team - Admin",
  "Web Team",
  "HR - Academy",
  "HR - Timedoor",
  "Content Creator",
  "Academy Pro",
  "LPK",
  "System Support",
]);
const categoryIdAliases = new Map([
  ["LMS", "lms"],
  ["Training / Team Development", "training"],
]);

function csvParts(line) {
  const parts = line.trim().replace(/^\||\|$/g, "").split("|").map((part) => part.trim());
  if (parts.length !== 6 || !/^DESIGN-\d+$/.test(parts[0])) throw new Error(`Invalid row: ${line}`);
  return parts;
}
function primaryTeam(usage) {
  const teams = normalizedTeamNames(parseTeams(usage));
  return teams[0];
}
function unique(values) { return [...new Set(values)]; }
function parseTeams(usage) {
  const explicit = [...usage.matchAll(/\[Team\] ([^,\]]+)/g)].map((match) => match[1].trim());
  if (explicit.length) return unique(explicit);
  if (/^Timedoor Academy/i.test(usage)) return ["Timedoor"];
  if (/Bali/i.test(usage)) return ["Timedoor"];
  if (/Overseas/i.test(usage)) return ["Overseas"];
  return ["Expansion"];
}
function parseMonths(deadline) {
  return unique([...deadline.matchAll(monthPattern)].map((match) => match[1]));
}
function parseCategories(work) {
  return unique(work.split(",").map((part) => part.trim()).filter(Boolean));
}
function teamForUsage(usage) {
  const team = primaryTeam(usage) || "Timedoor";
  if (canonicalTeamNames.has(team)) return team;
  throw new Error(`Unmapped team '${team}' in usage '${usage}'`);
}
function slug(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function normalizedTeamNames(teams) {
  return teams.map((team) => teamNameAliases.get(team) ?? teamAlias.get(team) ?? team);
}
function normalizedCategoryNames(categories) {
  return categories.map((category) => categoryAliases.get(category) ?? category);
}
function categoryForWork(work) {
  const sourceCategories = parseCategories(work);
  return sourceCategories.length ? normalizedCategoryNames(sourceCategories)[0] : "General Request";
}
function categoryIdFor(name) {
  return categoryIdAliases.get(name) ?? slug(name);
}
function dateFor(month) { return `2025-${monthNumber[month]}-${new Date(2025, Number(monthNumber[month]), 0).getDate()}`; }
function titleSkipReason(title) {
  return titleSkipRules.find(([, pattern]) => pattern.test(title))?.[0] ?? null;
}
function skipReasons(id, title) {
  const reasons = [];
  if (approvedSkippedIds.has(id)) reasons.push("approved-incomplete");
  const titleReason = titleSkipReason(title);
  if (titleReason) reasons.push(`title:${titleReason}`);
  return reasons;
}
function chunk(values, size = 50) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) chunks.push(values.slice(index, index + size));
  return chunks;
}
function idFilter(ids) { return `in.(${ids.map((id) => `"${id}"`).join(",")})`; }
function jsonHeaders() {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation,resolution=ignore-duplicates" };
}
async function request(path, init = {}) {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase environment is not configured");
  if (!/^https:\/\//.test(env.NEXT_PUBLIC_SUPABASE_URL)) throw new Error("Supabase URL must use HTTPS");
  const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...jsonHeaders(), ...(init.headers ?? {}) } });
  const body = await response.text();
  if (!response.ok) throw new Error(`${init.method ?? "GET"} ${path}: ${response.status} ${body}`);
  return body ? JSON.parse(body) : [];
}

const rows = source.split(/\r?\n/).filter((line) => line.startsWith("| DESIGN-")).map(csvParts);
if (!rows.length) throw new Error(`No source rows found in ${sourcePath}`);
const ids = rows.map(([id]) => id);
if (rows.length !== 734) throw new Error(`Expected 734 source rows, found ${rows.length}`);
if (new Set(ids).size !== rows.length) throw new Error("Source contains duplicate DESIGN IDs");
if (!ids.every((id) => /^DESIGN-\d+$/.test(id))) throw new Error("Source contains an invalid DESIGN ID");
const skippedRows = rows.filter(([id, title]) => skipReasons(id, title).length);
const skippedIdSet = new Set(skippedRows.map(([id]) => id));
const importIds = ids.filter((id) => !skippedIdSet.has(id));
const sourceIdSet = new Set(importIds);
const selected = rows.filter(([id, title, , , , deadline]) => !skippedIdSet.has(id) && parseMonths(deadline).some((month) => allowedMonths.has(month)));
if (selected.length !== importIds.length) throw new Error(`Expected ${importIds.length} selected import rows, found ${selected.length}`);
const sourceMonths = rows.flatMap(([, , , , , deadline]) => parseMonths(deadline));
const outOfScopeMonths = sourceMonths.filter((month) => !allowedMonths.has(month));
if (outOfScopeMonths.length) throw new Error(`Source contains deadline months outside June-December 2025: ${unique(outOfScopeMonths).join(", ")}`);
const sourceMonthCounts = Object.fromEntries([...allowedMonths].map((month) => [month, selected.filter(([, , , , , deadline]) => parseMonths(deadline)[0] === month).length]));
const sourceOutputByMonth = Object.fromEntries([...allowedMonths].map((month) => [month, selected.filter(([, , , , , deadline]) => parseMonths(deadline)[0] === month).reduce((total, [, , output]) => total + Number(output), 0)]));
const sourceTeamCounts = Object.fromEntries([...new Set(selected.map(([, , , usage]) => teamForUsage(usage)))].map((team) => [team, selected.filter(([, , , usage]) => teamForUsage(usage) === team).length]));
const sourceCategoryCounts = Object.fromEntries([...new Set(selected.map(([, , , , work]) => categoryForWork(work)))].map((category) => [category, selected.filter(([, , , , work]) => categoryForWork(work) === category).length]));
const sourceCategoryOutputTotals = Object.fromEntries(Object.entries(sourceCategoryCounts).map(([category]) => [category, selected.filter(([, , , , work]) => categoryForWork(work) === category).reduce((total, [, , output]) => total + (output === "" ? 1 : Number(output)), 0)]));
const multiMonthRows = selected.filter(([, , , , , deadline]) => parseMonths(deadline).length > 1).map(([id, , , , , deadline]) => ({ id, months: parseMonths(deadline) }));
const sourceOutputTotal = selected.reduce((total, [, , output]) => total + Number(output), 0);
if (!Number.isInteger(sourceOutputTotal) || sourceOutputTotal < selected.length) throw new Error("Source output totals are invalid");
if (Object.values(sourceMonthCounts).some((count) => count === 0)) throw new Error("Source does not cover all seven requested months");
const errors = [];
for (const [id, title, output, usage, work, deadline] of selected) {
  const months = parseMonths(deadline);
  if (months.some((month) => !allowedMonths.has(month))) errors.push(`${id}: out-of-scope month in deadline '${deadline}'`);
  const teams = parseTeams(usage);
  const categories = parseCategories(work);
  if (!months.length) errors.push(`${id}: no June-December month in deadline`);
  if (!teams.length || !teams[0]) {
    errors.push(`${id}: no team in usage '${usage}'`);
  } else if (!canonicalTeamNames.has(normalizedTeamNames(teams)[0])) {
    errors.push(`${id}: unmapped team '${normalizedTeamNames(teams)[0]}'`);
  }
  if (!categories.length) {
    categories.push("General Request");
  } else if (categories.some((category) => !knownCategories.has(category))) {
    errors.push(`${id}: unmapped work area '${categories.find((category) => !knownCategories.has(category))}'`);
  }
  if (!Number.isInteger(Number(output)) || Number(output) < 1) errors.push(`${id}: invalid output '${output}'`);
}
if (errors.length) throw new Error(`Validation failed (${errors.length}):\n${errors.slice(0, 20).join("\n")}`);

if (validationOnly) {
  console.log(JSON.stringify({ rows: selected.length, skipped: skippedRows.map(([id, title]) => ({ id, title, reasons: skipReasons(id, title) })), outputTotal: sourceOutputTotal, outputByMonth: sourceOutputByMonth, months: sourceMonthCounts, primaryTeams: sourceTeamCounts, primaryWorkAreas: sourceCategoryCounts, categoryOutputTotals: sourceCategoryOutputTotals, blankWorkAreaRows: rows.filter(([, , , , work]) => !work.trim()).map(([id]) => id), mapping: "first [Team]; unmarked Bali=Timedoor, Overseas=Overseas, otherwise=Expansion; first work area; title exclusions only; original values retained in description" }, null, 2));
  process.exit(0);
}

const existingTeams = await request("teams?select=id,name,short_name");
const existingCategories = await request("categories?select=id,name");
if (!Array.isArray(existingTeams) || !Array.isArray(existingCategories)) throw new Error("Reference data response is invalid");
const teamByName = new Map(existingTeams.map((row) => [row.name, row]));
const categoryByName = new Map(existingCategories.map((row) => [row.name, row]));
const categoryById = new Map(existingCategories.map((row) => [row.id, row]));
for (const [name, id] of categoryIdAliases) {
  const existing = categoryById.get(id);
  if (existing) {
    categoryByName.set(name, existing);
    categoryById.set(id, existing);
  }
}
for (const name of unique(selected.map(([, , , usage]) => teamForUsage(usage)))) {
  if (!teamByName.has(name)) {
    const id = slug(name);
    await request("teams", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify({ id, name, short_name: name.slice(0, 12) }) });
    teamByName.set(name, { id, name, short_name: name.slice(0, 12) });
  }
}
for (const name of unique(selected.map(([, , , , work]) => categoryForWork(work)))) {
  const existing = categoryByName.get(name) ?? categoryById.get(categoryIdFor(name));
  if (!existing) throw new Error(`Missing category reference '${name}'. Add it before importing.`);
  categoryByName.set(name, existing);
  categoryById.set(existing.id, existing);
}
const requester = (await request("profiles?select=id&role=eq.PM&order=created_at.asc&limit=1"))[0];
if (!requester?.id) throw new Error("No PM profile found; no requests were inserted.");

const payload = selected.map(([id, title, output, usage, work, deadline]) => {
  const months = parseMonths(deadline);
  const teams = [teamForUsage(usage)];
  const categories = [categoryForWork(work)];
  const month = months[0];
  const team = teamByName.get(teams[0]);
  const category = categoryByName.get(categories[0]) ?? categoryById.get(categoryIdFor(categories[0]));
  if (!team || !category) throw new Error(`${id}: reference mapping failed`);
  return {
    id,
    request_code: id,
    notion_id: id,
    title,
    team_id: team.id,
    category_id: category.id,
    requester_id: requester.id,
    designer_id: null,
    request_date: dateFor(month),
    deadline: dateFor(month),
    completed_date: dateFor(month),
    priority: "medium",
    status: "done",
    estimated_hours: 0,
    actual_hours: null,
    output_count: Number(output),
    description: `Source: ${sourcePath}. Month: ${monthNames[month]} 2025. Usage Location: ${usage}. Work Area(s): ${work}. Deadline reference: ${deadline}.`,
    figma_url: null,
    drive_url: null,
  };
});

for (let index = 0; index < payload.length; index += 100) {
  await request("requests?on_conflict=id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(payload.slice(index, index + 100)) });
  console.log(`Upserted ${Math.min(index + 100, payload.length)}/${payload.length}`);
}
const check = [];
for (const idsChunk of chunk([...sourceIdSet])) {
  check.push(...await request(`requests?select=id,request_date,output_count&request_code=${idFilter(idsChunk)}&order=id.asc`, { headers: { Prefer: "count=exact" } }));
}
if (new Set(check.map((row) => row.id)).size !== check.length) throw new Error("Verification failed: duplicate imported IDs");
const importedIds = new Set(check.map((row) => row.id));
const missing = selected.map(([id]) => id).filter((id) => !importedIds.has(id));
const unexpected = check.map((row) => row.id).filter((id) => !sourceIdSet.has(id));
const invalidMonths = check.filter((row) => !/^2025-(0[6-9]|1[0-2])-/.test(row.request_date));
const importedOutputTotal = check.reduce((total, row) => total + Number(row.output_count), 0);
const importedOutputByMonth = Object.fromEntries([...allowedMonths].map((month) => [month, check.filter((row) => row.request_date.slice(5, 7) === monthNumber[month]).reduce((total, row) => total + Number(row.output_count), 0)]));
const importedRowCountsByMonth = Object.fromEntries([...allowedMonths].map((month) => [month, check.filter((row) => row.request_date.slice(5, 7) === monthNumber[month]).length]));
if (missing.length || unexpected.length || invalidMonths.length || check.length !== selected.length || importedOutputTotal !== sourceOutputTotal || JSON.stringify(importedOutputByMonth) !== JSON.stringify(sourceOutputByMonth) || JSON.stringify(importedRowCountsByMonth) !== JSON.stringify(sourceMonthCounts)) {
  throw new Error(`Verification failed: expected ${selected.length} rows; got ${check.length}; missing=${missing.length}; unexpected=${unexpected.length}; invalidMonths=${invalidMonths.length}; expectedOutputs=${sourceOutputTotal}; gotOutputs=${importedOutputTotal}; expectedOutputByMonth=${JSON.stringify(sourceOutputByMonth)}; gotOutputByMonth=${JSON.stringify(importedOutputByMonth)}; expectedRowsByMonth=${JSON.stringify(sourceMonthCounts)}; gotRowsByMonth=${JSON.stringify(importedRowCountsByMonth)}`);
}
console.log(`Verified ${selected.length} rows and ${importedOutputTotal} outputs. Dates used only for month grouping; all imported request_date/deadline values are month-end markers.`);
const excludedIds = skippedRows.filter(([id, title]) => titleSkipReason(title)).map(([id]) => id);
const existingExcluded = [];
for (const idsChunk of chunk(excludedIds)) {
  existingExcluded.push(...await request(`requests?select=id,request_code&request_code=${idFilter(idsChunk)}&order=id.asc`));
}
if (existingExcluded.length) {
  console.log(`Found excluded requests: ${existingExcluded.map(({ request_code }) => request_code).join(", ")}`);
}
for (const idsChunk of chunk([...new Set(existingExcluded.map(({ id }) => id))])) {
  if (idsChunk.length) {
    await request(`requests?id=${idFilter(idsChunk)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
  }
}
const remainingExcluded = [];
for (const idsChunk of chunk(excludedIds)) {
  remainingExcluded.push(...await request(`requests?select=id&request_code=${idFilter(idsChunk)}&order=id.asc`));
}
if (remainingExcluded.length) throw new Error(`Excluded request cleanup failed for ${remainingExcluded.map(({ id }) => id).join(", ")}`);
console.log(`Deleted ${existingExcluded.length} excluded title-match requests.`);
