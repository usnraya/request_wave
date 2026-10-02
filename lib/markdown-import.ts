import { dateForMonth } from "@/lib/bulk-requests";
import type { Category } from "@/types/category";
import type { Team } from "@/types/team";

export const maxMarkdownRows = 200;

const monthNumbers: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

const categoryAliases = new Map([
  ["campaign/event", "campaign / event"],
  ["property event / merchandise", "merchandise / property event"],
]);

export type MarkdownSourceRow = {
  notionId: string;
  title: string;
  outputCount: number | null;
  usage: string;
  workArea: string;
  deadline: string;
};

// One entry per (row, team): a row shared by two teams is imported once for each.
export type MarkdownImportRow = MarkdownSourceRow & {
  date: string;
  teamId: string | null;
  teamName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  status: "new" | "duplicate" | "invalid";
  reason?: string;
};

export type MarkdownImportSummary = {
  sourceRows: number;
  newRows: number;
  newOutputs: number;
  duplicateRows: number;
  invalidRows: number;
  byTeam: Record<string, { rows: number; outputs: number }>;
};

export type MarkdownClassifyOptions = {
  month: string; // YYYY-MM, authoritative for every row
  teams: Team[];
  categories: Category[];
  existing: Set<string>; // existingKey(teamId, notionId)
  onlyTeamId?: string; // team page: other teams' entries become invalid
};

export const existingKey = (teamId: string, notionId: string) => `${teamId}:${notionId}`;

export function normalizeMarkdownValue(value: string): string {
  return value.trim().toLowerCase().replace(/[()]/g, "").replace(/\s+/g, " ");
}

export function parseTaskMarkdown(text: string): MarkdownSourceRow[] {
  return text.split(/\r?\n/)
    .filter((line) => line.trim().startsWith("| DESIGN-"))
    .map((line) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()))
    .map(([notionId = "", title = "", output, usage = "", workArea = "", deadline = ""]) => ({
      notionId,
      title,
      outputCount: output?.trim() ? Number(output.trim()) : null,
      usage,
      workArea,
      deadline,
    }));
}

function categoryFor(workArea: string, categories: Category[]): Category | null {
  const normalized = normalizeMarkdownValue(workArea.split(",")[0] ?? "");
  const name = categoryAliases.get(normalized) ?? normalized;
  return categories.find((category) => normalizeMarkdownValue(category.name) === name) ?? null;
}

// "[Team] X" markers, plus bare parts that are exactly a team name (e.g. "Timedoor Academy").
function teamsFor(usage: string, teams: Team[]) {
  const found = new Map<string, Team>();
  const unknown: string[] = [];
  for (const part of usage.split(",").map((p) => p.trim())) {
    const marked = part.match(/^\[Team\]\s*(.+)$/i)?.[1];
    const key = normalizeMarkdownValue(marked ?? part);
    const team = teams.find((t) => normalizeMarkdownValue(t.name) === key || normalizeMarkdownValue(t.shortName ?? "") === key);
    if (team) found.set(team.id, team);
    else if (marked) unknown.push(marked);
  }
  return { found: [...found.values()], unknown };
}

function deadlineMonth(deadline: string): number | null {
  const name = deadline.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i)?.[1];
  return name ? monthNumbers[name.toLowerCase()] : null;
}

export function classifyMarkdownRows(sourceRows: MarkdownSourceRow[], options: MarkdownClassifyOptions): MarkdownImportRow[] {
  const { month, teams, categories, existing, onlyTeamId } = options;
  const date = dateForMonth(month); // throws on an invalid month
  const monthNumber = Number(month.slice(5, 7));
  const seen = new Set<string>();

  return sourceRows.flatMap((source): MarkdownImportRow[] => {
    const { found, unknown } = teamsFor(source.usage, teams);
    const category = categoryFor(source.workArea, categories);
    const base = {
      ...source,
      date,
      teamId: null,
      teamName: found.map((t) => t.name).join(", ") || null,
      categoryId: category?.id ?? null,
      categoryName: category?.name ?? null,
    };
    const invalid = (reason: string): MarkdownImportRow[] => [{ ...base, status: "invalid", reason }];
    const rowMonth = deadlineMonth(source.deadline);

    if (!/^DESIGN-[A-Za-z0-9_-]+$/.test(source.notionId)) return invalid("Notion ID is missing or invalid");
    if (!source.title) return invalid("Title is missing");
    if (source.outputCount === null || !Number.isInteger(source.outputCount) || source.outputCount < 1) return invalid("Output Task must be a positive whole number");
    if (rowMonth !== null && rowMonth !== monthNumber) return invalid(`Deadline (${source.deadline}) is outside the selected month`);
    if (!category) return invalid(`Unknown Work Area: ${source.workArea || "(blank)"}`);
    if (!found.length && !unknown.length) return invalid("No team found in Usage Location");

    const entries: MarkdownImportRow[] = unknown.map((name) => ({ ...base, status: "invalid", reason: `Unknown team: ${name}` }));
    for (const team of found) {
      const entry = { ...base, teamId: team.id, teamName: team.name };
      const key = existingKey(team.id, source.notionId);
      if (onlyTeamId && team.id !== onlyTeamId) entries.push({ ...entry, status: "invalid", reason: "Belongs to another team" });
      else if (seen.has(key)) entries.push({ ...entry, status: "invalid", reason: "Duplicate Notion ID in this file" });
      else if (existing.has(key)) { seen.add(key); entries.push({ ...entry, status: "duplicate", reason: "Already exists for this team" }); }
      else { seen.add(key); entries.push({ ...entry, status: "new" }); }
    }
    return entries;
  });
}

export function summarizeMarkdownRows(rows: MarkdownImportRow[]): MarkdownImportSummary {
  const fresh = rows.filter((row) => row.status === "new");
  const byTeam: MarkdownImportSummary["byTeam"] = {};
  for (const row of fresh) {
    const name = row.teamName ?? "";
    byTeam[name] ??= { rows: 0, outputs: 0 };
    byTeam[name].rows += 1;
    byTeam[name].outputs += row.outputCount ?? 0;
  }
  return {
    sourceRows: rows.length,
    newRows: fresh.length,
    newOutputs: fresh.reduce((total, row) => total + (row.outputCount ?? 0), 0),
    duplicateRows: rows.filter((row) => row.status === "duplicate").length,
    invalidRows: rows.filter((row) => row.status === "invalid").length,
    byTeam,
  };
}
