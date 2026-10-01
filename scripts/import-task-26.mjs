import fs from "node:fs";

const sourcePath = "md/task-26.md";
const source = fs.readFileSync(sourcePath, "utf8");
const dryRun = process.argv.includes("--dry-run") || process.argv.includes("--report");
const candidatesApproved = process.argv.includes("--approve-candidates") || process.argv.includes("--skip-candidates");
const expectedRows = 773;
const year = 2026;
const allowedMonths = new Set(["Jan", "Feb", "Mar", "Apr", "May", "Jun"]);
const monthNumber = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06" };
const monthNames = { Jan: "January", Feb: "February", Mar: "March", Apr: "April", May: "May", Jun: "June" };
const monthPattern = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/gi;
const designVariantPattern = /^(?:design|edit|redesign|resize|re[- ]?edit|motion|revisi|desain|\[interior\]|interior\b)/i;
const approvedSkippedIds = new Set(["DESIGN-3087", "DESIGN-3495"]);
const rowOverrides = new Map([
  ["DESIGN-3449", { output: "1" }],
  ["DESIGN-3452", { output: "1" }],
  ["DESIGN-3457", { output: "1" }],
  ["DESIGN-3462", { output: "3" }],
  ["DESIGN-3483", { output: "1" }],
  ["DESIGN-3487", { output: "1" }],
  ["DESIGN-3489", { output: "1" }],
  ["DESIGN-3569", { output: "1", work: "Content Social Media" }],
  ["DESIGN-3702", { output: "1" }],
  ["DESIGN-3877", { usage: "Timedoor Academy", work: "Merchandise" }],
]);
const candidateReasonPattern = [
  ["meeting", /\bmeeting\b/i],
  ["discuss", /\bdiscus+\b/i],
  ["take", /\btake\b/i],
  ["cuti", /\bcuti\b/i],
  ["day off", /\bday[ -]?off\b/i],
  ["event", /\bevent\b/i],
];

const teamAliases = new Map([
  ["marketing team (online)", "Marketing Team Online"],
  ["marketing team online", "Marketing Team Online"],
  ["marketing team (offline)", "Marketing Team Offline"],
  ["marketing team offline", "Marketing Team Offline"],
  ["curricullum", "Curriculum"],
  ["curriculum", "Curriculum"],
  ["hisensei", "Hisensei"],
  ["timedoor academy", "Timedoor"],
  ["offline id", "Marketing Team Offline"],
  ["online team - admin", "Online Team - Admin"],
]);
const canonicalTeams = new Set([
  "Expansion", "Marketing Team Online", "Curriculum", "HQ", "Hisensei", "Overseas",
  "Marketing Team Offline", "Timedoor", "Playschool", "Designer", "Online Team - Admin",
  "Web Team", "HR - Academy", "HR - Timedoor", "Content Creator", "Academy Pro", "LPK", "System Support",
]);
const categoryAliases = new Map([
  ["general request", "General Request"],
  ["content media social", "Content Media Social"],
  ["content social media", "Content Media Social"],
  ["branch interior & exterior", "Branch Interior & Exterior"],
  ["web", "WEB"],
  ["marketing things / ads", "Marketing Things / ADS"],
  ["meta ads / custom ads", "Marketing Things / ADS"],
  ["lms / system", "LMS"],
  ["collect footage", "Collect Footage"],
  ["internal / coordination", "Internal / Coordination"],
  ["training / team develop / bonding", "Training / Team Development"],
  ["training / team development", "Training / Team Development"],
  ["team system", "Team System"],
  ["campaign/event", "Campaign / Event"],
  ["campaign / event", "Campaign / Event"],
  ["property event / merchandise", "Merchandise"],
  ["offline marketing", "Offline Ads"],
  ["curriculum materials", "Curriculum Materials"],
  ["teacher support", "Teacher Support"],
  ["certificate", "Certificate"],
  ["hiring", "Hiring"],
  ["guideline", "Guideline"],
  ["greetings", "Greetings"],
  ["uniform design", "Uniform Design"],
]);
const categoryIds = new Map([
  ["General Request", "general"],
  ["Content Media Social", "content-social"],
  ["Branch Interior & Exterior", "branch"],
  ["WEB", "web"],
  ["Marketing Things / ADS", "marketing-ads"],
  ["LMS", "lms"],
  ["Collect Footage", "footage"],
  ["Internal / Coordination", "internal"],
  ["Training / Team Development", "training"],
  ["Team System", "team-system"],
  ["Campaign / Event", "campaign"],
  ["Merchandise", "merchandise"],
  ["Guideline", "guideline"],
  ["Teacher Support", "teacher-support"],
  ["Certificate", "certificate"],
  ["Hiring", "hiring"],
  ["Offline Ads", "offline-ads"],
  ["Greetings", "greetings"],
  ["Curriculum Materials", "curriculum-materials"],
  ["Uniform Design", "uniform"],
]);

function splitCells(line) {
  const content = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells = [];
  let cell = "";
  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    if (character === "\\" && content[index + 1] === "|") {
      cell += "|";
      index += 1;
    } else if (character === "|") {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += character;
    }
  }
  cells.push(cell.trim());
  return cells;
}
function parseRow(line, lineNumber) {
  const cells = splitCells(line);
  if (cells.length !== 6 || !/^DESIGN-\d+$/.test(cells[0])) {
    throw new Error(`Invalid row at source line ${lineNumber}: ${line}`);
  }
  return { id: cells[0], title: cells[1], output: cells[2], usage: cells[3], work: cells[4], deadline: cells[5], line: lineNumber };
}
function unique(values) { return [...new Set(values)]; }
function parseMonths(deadline) { return unique([...deadline.matchAll(monthPattern)].map((match) => match[1][0].toUpperCase() + match[1].slice(1).toLowerCase())); }
function slug(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function normalizeTeamName(name) { return teamAliases.get(name.trim().toLowerCase()) ?? name.trim(); }
function parseTeams(usage) {
  const explicit = [...usage.matchAll(/\[Team\]\s*([^,\]]+)/gi)].map((match) => normalizeTeamName(match[1]));
  if (explicit.length) return unique(explicit);
  if (/timedoor academy|^timedoor\b/i.test(usage)) return ["Timedoor"];
  if (/playschool/i.test(usage)) return ["Playschool"];
  if (/overseas/i.test(usage)) return ["Overseas"];
  if (/\bbali\b/i.test(usage)) return ["Timedoor"];
  return ["Expansion"];
}
function teamForUsage(usage) { return parseTeams(usage)[0] ?? ""; }
function parseCategories(work) {
  return unique(work.split(",").map((part) => part.trim()).filter(Boolean));
}
function normalizeCategoryName(name) { return categoryAliases.get(name.trim().toLowerCase()) ?? name.trim(); }
function categoryForWork(work) { return normalizeCategoryName(parseCategories(work)[0] ?? "General Request"); }
function firstMonth(deadline) { return parseMonths(deadline)[0] ?? ""; }
function dateFor(month) {
  const monthValue = monthNumber[month];
  if (!monthValue) throw new Error(`Invalid source month '${month}'`);
  return `${year}-${monthValue}-${new Date(year, Number(monthValue), 0).getDate()}`;
}
function candidateReasons(row) {
  const reasons = [];
  const match = candidateReasonPattern.find(([, pattern]) => pattern.test(row.title));
  if (match) reasons.push(`title:${match[0]}`);
  if (!designVariantPattern.test(row.title)) reasons.push("title:non-design-prefix");
  return unique(reasons);
}
function isCandidate(row) { return !designVariantPattern.test(row.title); }
function effectiveRow(row) {
  return { ...row, ...(rowOverrides.get(row.id) ?? {}) };
}
function incompleteReasons(row) {
  const effective = effectiveRow(row);
  const reasons = [];
  if (!effective.output.trim()) reasons.push("blank-output");
  if (!effective.usage.trim()) reasons.push("blank-usage-location");
  if (!effective.work.trim()) reasons.push("blank-work-area");
  return reasons;
}
function mappingIssues(row) {
  const effective = effectiveRow(row);
  const issues = [];
  const team = teamForUsage(effective.usage);
  const category = categoryForWork(effective.work);
  if (!effective.usage.trim()) issues.push("missing-team-source");
  if (!canonicalTeams.has(team)) issues.push(`unmapped-team:${team}`);
  if (!effective.work.trim()) issues.push("missing-work-area-source");
  if (!categoryIds.has(category)) issues.push(`unmapped-work-area:${category}`);
  if (!/^\d+$/.test(effective.output.trim()) || Number(effective.output) < 1) issues.push(`invalid-output:${effective.output}`);
  const month = firstMonth(effective.deadline);
  if (!allowedMonths.has(month)) issues.push(`out-of-scope-month:${month || "none"}`);
  return issues;
}
function chunk(values, size = 100) {
  const result = [];
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size));
  return result;
}
function idFilter(ids) { return `in.(${ids.map((id) => `"${id}"`).join(",")})`; }
function loadEnv() {
  return Object.fromEntries(fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter((line) => line && !line.startsWith("#")).map((line) => {
    const index = line.indexOf("=");
    return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
  }));
}
function headers(env) {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation,resolution=ignore-duplicates" };
}
async function request(env, path, init = {}) {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase environment is not configured");
  if (!/^https:\/\//.test(env.NEXT_PUBLIC_SUPABASE_URL)) throw new Error("Supabase URL must use HTTPS");
  const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...headers(env), ...(init.headers ?? {}) } });
  const body = await response.text();
  if (!response.ok) throw new Error(`${init.method ?? "GET"} ${path}: ${response.status} ${body}`);
  return body ? JSON.parse(body) : [];
}

const rows = source.split(/\r?\n/).map((line, index) => ({ line, lineNumber: index + 1 })).filter(({ line }) => line.startsWith("| DESIGN-")).map(({ line, lineNumber }) => parseRow(line, lineNumber));
if (rows.length !== expectedRows) throw new Error(`Expected ${expectedRows} source rows, found ${rows.length}`);
const ids = rows.map(({ id }) => id);
if (new Set(ids).size !== rows.length) throw new Error("Source contains duplicate DESIGN IDs");
const allIncomplete = rows.filter((row) => incompleteReasons(row).length).map((row) => ({ ...effectiveRow(row), reasons: incompleteReasons(row) }));
const candidates = rows.filter((row) => !approvedSkippedIds.has(row.id) && isCandidate(row)).map((row) => ({ ...effectiveRow(row), reasons: candidateReasons(row) }));
const selected = rows.filter((row) => !approvedSkippedIds.has(row.id) && !isCandidate(row)).map(effectiveRow);
const blocking = selected.flatMap((row) => mappingIssues(row).length ? [{ ...row, reasons: mappingIssues(row) }] : []);
const monthCounts = Object.fromEntries([...allowedMonths].map((month) => [month, selected.filter((row) => firstMonth(row.deadline) === month).length]));
const outputByMonth = Object.fromEntries([...allowedMonths].map((month) => [month, selected.filter((row) => firstMonth(row.deadline) === month).reduce((total, row) => total + Number(row.output || 0), 0)]));
const sourceCategories = Object.fromEntries(unique(rows.flatMap((row) => parseCategories(row.work))).map((category) => [category, normalizeCategoryName(category)]));
const report = {
  source: sourcePath,
  sourceRows: rows.length,
  approvedSkipped: [...approvedSkippedIds],
  appliedOverrides: Object.fromEntries([...rowOverrides].map(([id, override]) => [id, override])),
  candidateCount: candidates.length,
  candidates,
  incompleteCount: allIncomplete.length,
  incompleteRows: allIncomplete,
  blockingCount: blocking.length,
  blockingRows: blocking,
  selectedRows: selected.length,
  outputTotal: selected.reduce((total, row) => total + Number(row.output || 0), 0),
  outputByMonth,
  monthCounts,
  sourceCategories,
  mapping: "first [Team]; Timedoor Academy/Bali=Timedoor, Playschool=Playschool, Overseas=Overseas, otherwise=Expansion; first work area; source deadline used only for month",
};
if (dryRun) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}
if (!candidatesApproved) throw new Error("Import blocked: review the dry-run candidate report, then rerun with --approve-candidates.");
if (blocking.length) throw new Error(`Import blocked by ${blocking.length} incomplete or unmapped rows. ${blocking.map(({ id, reasons }) => `${id} (${reasons.join(", ")})`).join("; ")}`);

const env = loadEnv();
const existingTeams = await request(env, "teams?select=id,name,short_name");
const existingCategories = await request(env, "categories?select=id,name");
const teamByName = new Map(existingTeams.map((row) => [row.name, row]));
const categoryByName = new Map(existingCategories.map((row) => [row.name, row]));
const categoryById = new Map(existingCategories.map((row) => [row.id, row]));
for (const name of unique(selected.map((row) => teamForUsage(row.usage)))) {
  if (!teamByName.has(name)) {
    const id = slug(name);
    await request(env, "teams", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify({ id, name, short_name: name.slice(0, 12) }) });
    teamByName.set(name, { id, name, short_name: name.slice(0, 12) });
  }
}
for (const name of unique(selected.map((row) => categoryForWork(row.work)))) {
  const existing = categoryByName.get(name) ?? categoryById.get(categoryIds.get(name));
  if (!existing) throw new Error(`Missing category reference '${name}'. Add or map it before importing.`);
  categoryByName.set(name, existing);
}
const requester = (await request(env, "profiles?select=id&role=eq.PM&order=created_at.asc&limit=1"))[0];
if (!requester?.id) throw new Error("No PM profile found; no requests were inserted.");
const payload = selected.map((row) => {
  const month = firstMonth(row.deadline);
  const team = teamByName.get(teamForUsage(row.usage));
  const category = categoryByName.get(categoryForWork(row.work));
  if (!team || !category) throw new Error(`${row.id}: reference mapping failed`);
  return {
    id: row.id,
    request_code: row.id,
    notion_id: row.id,
    title: row.title,
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
    output_count: Number(row.output),
    description: `Source: ${sourcePath}. Month: ${monthNames[month]} 2026. Usage Location: ${row.usage}. Work Area(s): ${row.work}. Deadline reference: ${row.deadline}.`,
    figma_url: null,
    drive_url: null,
  };
});
for (let index = 0; index < payload.length; index += 100) {
  await request(env, "requests?on_conflict=id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(payload.slice(index, index + 100)) });
  console.log(`Upserted ${Math.min(index + 100, payload.length)}/${payload.length}`);
}
const check = [];
for (const idsChunk of chunk(selected.map((row) => row.id))) {
  check.push(...await request(env, `requests?select=id,request_date,output_count&request_code=${idFilter(idsChunk)}&order=id.asc`));
}
const expectedIds = new Set(selected.map((row) => row.id));
const actualIds = new Set(check.map((row) => row.id));
const missing = [...expectedIds].filter((id) => !actualIds.has(id));
const unexpected = [...actualIds].filter((id) => !expectedIds.has(id));
const invalidMonths = check.filter((row) => !/^2026-(0[1-6])-/.test(row.request_date));
const expectedOutput = selected.reduce((total, row) => total + Number(row.output), 0);
const actualOutput = check.reduce((total, row) => total + Number(row.output_count), 0);
if (missing.length || unexpected.length || invalidMonths.length || check.length !== selected.length || expectedOutput !== actualOutput) {
  throw new Error(`Verification failed: expected ${selected.length} rows/${expectedOutput} outputs; got ${check.length} rows/${actualOutput} outputs; missing=${missing.length}; unexpected=${unexpected.length}; invalidMonths=${invalidMonths.length}`);
}
console.log(`Verified ${selected.length} rows and ${actualOutput} outputs for January–June 2026. Source dates were not stored.`);
