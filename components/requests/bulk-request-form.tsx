"use client";

import { useActionState, useState } from "react";
import { createRequests } from "@/app/actions";
import { monthKey, today } from "@/lib/date-utils";
import type { Category } from "@/types/category";
import type { Team } from "@/types/team";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const years = ["2025", "2026"];

const selectClass =
  "mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-[13px] outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20";
const inputClass =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-[13px] outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20";

type Row = { title: string; notionId: string };

const emptyRow: Row = { title: "", notionId: "" };

export default function BulkRequestForm({
  teams,
  categories,
}: {
  teams: Team[];
  categories: Category[];
}) {
  const [state, action, pending] = useActionState(createRequests, null);
  const [rows, setRows] = useState<Row[]>([emptyRow, emptyRow, emptyRow]);

  function updateRow(index: number, key: keyof Row, value: string) {
    setRows((current) =>
      current.map((row, position) =>
        position === index ? { ...row, [key]: value } : row,
      ),
    );
  }

  const filledCount = rows.filter((row) => row.title || row.notionId).length;

  return (
    <form
      action={action}
      className="space-y-7 rounded-2xl border border-border bg-card p-5 sm:p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Team
          <select name="teamId" required className={selectClass}>
            <option value="">Choose a team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Month
          <select
            name="month"
            required
            defaultValue={monthKey(today())}
            className={selectClass}
          >
            {years.map((year) => (
              <optgroup key={year} label={year}>
                {monthNames.map((name, index) => (
                  <option
                    key={name}
                    value={`${year}-${String(index + 1).padStart(2, "0")}`}
                  >
                    {name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Category
          <select name="categoryId" required className={selectClass}>
            <option value="">Choose a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-2 border-t border-border/80 pt-5">
        <div className="hidden gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[2rem_1fr_14rem_5rem]">
          <span>#</span>
          <span>Title</span>
          <span>Notion ID</span>
          <span className="sr-only">Actions</span>
        </div>
        {rows.map((row, index) => (
          <div
            key={index}
            className="grid gap-2 sm:grid-cols-[2rem_1fr_14rem_5rem] sm:items-center"
          >
            <span className="text-sm text-muted-foreground">{index + 1}</span>
            <input
              name="title"
              value={row.title}
              onChange={(event) => updateRow(index, "title", event.target.value)}
              aria-label={`Title for row ${index + 1}`}
              placeholder="Title"
              className={inputClass}
            />
            <input
              name="notionId"
              value={row.notionId}
              onChange={(event) =>
                updateRow(index, "notionId", event.target.value)
              }
              aria-label={`Notion ID for row ${index + 1}`}
              placeholder="Notion ID"
              className={inputClass}
            />
            <button
              type="button"
              disabled={rows.length === 1}
              onClick={() =>
                setRows((current) =>
                  current.filter((_, position) => position !== index),
                )
              }
              className="h-9 cursor-pointer rounded-md px-2 text-sm text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setRows((current) => [...current, emptyRow])}
          className="h-9 cursor-pointer rounded-full border border-border px-4 text-[13px] font-medium transition-colors hover:border-primary hover:bg-primary/10 hover:text-[#126915] dark:hover:text-[#b8fab8]"
        >
          + Add row
        </button>
      </div>

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-10 cursor-pointer rounded-full bg-primary px-5 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-[#108513] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending
          ? "Adding…"
          : filledCount === 1
            ? "Add 1 request"
            : `Add ${filledCount} requests`}
      </button>
    </form>
  );
}
