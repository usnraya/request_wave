"use client";

import { useActionState, useState, useTransition } from "react";
import { importMarkdownRequests, previewMarkdownImport } from "@/app/actions";
import { today } from "@/lib/date-utils";
import type { MarkdownImportRow, MarkdownImportSummary } from "@/lib/markdown-import";

const selectClass =
  "mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-[13px] outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type Preview = { rows: MarkdownImportRow[]; summary: MarkdownImportSummary };

// One Markdown file = one month. Team and Work Area are read from every row.
// onlyTeamId (team page): rows for other teams are shown as invalid and skipped.
export default function MarkdownImportForm({
  onlyTeamId,
  returnTo = "/requests",
}: {
  onlyTeamId?: string;
  returnTo?: string;
}) {
  const [state, action, pending] = useActionState(importMarkdownRequests, null);
  const [now] = useState(() => today());
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [markdown, setMarkdown] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, startChecking] = useTransition();
  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(String);

  function runPreview(nextMarkdown: string, nextYear: string, nextMonth: string) {
    setPreview(null);
    setError(null);
    if (!nextMarkdown) return;
    const formData = new FormData();
    formData.set("markdown", nextMarkdown);
    formData.set("year", nextYear);
    formData.set("month", nextMonth);
    if (onlyTeamId) formData.set("onlyTeamId", onlyTeamId);
    startChecking(async () => {
      const result = await previewMarkdownImport(formData);
      if ("error" in result) setError(result.error ?? "Invalid Markdown import");
      else setPreview(result as Preview);
    });
  }

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setMarkdown(text);
    runPreview(text, year, month);
  }

  const summary = preview?.summary;
  const teams = summary ? Object.entries(summary.byTeam).sort(([a], [b]) => a.localeCompare(b)) : [];

  return (
    <form action={action} className="space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="markdown" value={markdown} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Month
          <select
            name="month"
            value={month}
            onChange={(event) => {
              setMonth(event.target.value);
              runPreview(markdown, year, event.target.value);
            }}
            className={selectClass}
          >
            {monthNames.map((name, index) => (
              <option key={name} value={String(index + 1).padStart(2, "0")}>{name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Year
          <select
            name="year"
            value={year}
            onChange={(event) => {
              setYear(event.target.value);
              runPreview(markdown, event.target.value, month);
            }}
            className={selectClass}
          >
            {years.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm font-medium">
        Markdown file (.md)
        <input
          type="file"
          accept=".md,text/markdown,text/plain"
          onChange={onFile}
          className="mt-1.5 block w-full cursor-pointer text-[13px] file:mr-3 file:h-10 file:cursor-pointer file:rounded-full file:border file:border-border file:bg-background file:px-4 file:text-[13px] file:font-medium hover:file:border-primary"
        />
        <span className="mt-1 block text-xs font-normal text-muted-foreground">
          1 file = 1 month. Every row is dated to the selected month; Team comes from Usage Location, category from Work Area.
          {onlyTeamId && " Only this team's rows are imported."}
        </span>
      </label>

      {checking && <p className="text-sm text-muted-foreground">Checking file…</p>}
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

      {summary && preview && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <span><b>{summary.newRows}</b> new ({summary.newOutputs} outputs)</span>
            <span className="text-muted-foreground"><b>{summary.duplicateRows}</b> duplicate (skipped)</span>
            <span className={summary.invalidRows ? "text-destructive" : "text-muted-foreground"}><b>{summary.invalidRows}</b> invalid (skipped)</span>
            {teams.map(([name, value]) => (
              <span key={name} className="text-muted-foreground">{name}: {value.rows} rows / {value.outputs} outputs</span>
            ))}
          </div>
          <div className="max-h-72 overflow-auto rounded-xl border border-border">
            <table className="w-full min-w-[720px] text-[13px]">
              <thead>
                <tr className="border-b border-border bg-muted/60 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">ID</th>
                  <th className="px-3 py-2 font-medium">Title</th>
                  <th className="px-3 py-2 font-medium">Team</th>
                  <th className="px-3 py-2 font-medium">Work Area</th>
                  <th className="px-3 py-2 text-right font-medium">Out</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, index) => (
                  <tr key={`${row.notionId}-${row.teamId}-${index}`} className="border-b border-border last:border-0">
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{row.notionId || "—"}</td>
                    <td className="px-3 py-2">{row.title}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.teamName ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.categoryName ?? row.workArea}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.outputCount ?? "—"}</td>
                    <td className={`px-3 py-2 ${row.status === "invalid" ? "text-destructive" : row.status === "duplicate" ? "text-muted-foreground" : ""}`}>
                      {row.status === "new" ? "New" : `${row.status === "duplicate" ? "Duplicate" : "Invalid"}: ${row.reason}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {state?.error && <p className="text-sm text-destructive" role="alert">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || checking || !summary || summary.newRows === 0}
        className="h-10 cursor-pointer rounded-full bg-primary px-5 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-[#108513] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Importing…" : `Import ${summary?.newRows ?? 0} request${summary?.newRows === 1 ? "" : "s"}`}
      </button>
    </form>
  );
}
