import { isFutureMonth, parseISODate, today } from "@/lib/date-utils";

export const maxBulkRows = 50;

export type BulkRow = { title: string; notionId: string };

function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Date the bulk rows are recorded on: today for the current month, otherwise the
 * last day of the selected month, so the rows land in the month the user picked.
 */
export function dateForMonth(month: string, now = today()): string {
  if (!/^20\d\d-(0[1-9]|1[0-2])$/.test(month)) throw new Error("Invalid month");
  const first = parseISODate(`${month}-01`);
  if (isFutureMonth(first, now)) throw new Error("Month cannot be in the future");
  if (
    first.getFullYear() === now.getFullYear() &&
    first.getMonth() === now.getMonth()
  ) {
    return isoDate(now);
  }
  return isoDate(new Date(first.getFullYear(), first.getMonth() + 1, 0));
}

/**
 * Pairs the repeated title/notionId inputs into rows, dropping rows the user left
 * entirely blank. Row numbers in errors match the numbers shown in the form.
 */
export function parseBulkRows(titles: string[], notionIds: string[]): BulkRow[] {
  const rows = titles
    .map((title, index) => ({
      title: title.trim(),
      notionId: (notionIds[index] ?? "").trim(),
      number: index + 1,
    }))
    .filter((row) => row.title || row.notionId);

  if (!rows.length) throw new Error("Add at least one request");
  if (rows.length > maxBulkRows) {
    throw new Error(`Add at most ${maxBulkRows} requests at a time`);
  }
  for (const row of rows) {
    if (!row.title) throw new Error(`Title is required on row ${row.number}`);
    if (!row.notionId) {
      throw new Error(`Notion ID is required on row ${row.number}`);
    }
  }
  return rows.map(({ title, notionId }) => ({ title, notionId }));
}
