"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { deleteRequest } from "@/app/actions";

export default function RequestActions({ requestId, title }: { requestId: string; title: string }) {
  function confirmDelete(event: React.FormEvent<HTMLFormElement>) {
    if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) event.preventDefault();
  }

  return (
    <div className="flex gap-1">
      <Link
        href={`/requests/${requestId}/edit`}
        aria-label={`Edit ${title}`}
        className="flex size-8 items-center justify-center rounded-full bg-[#FFB400]/15 text-[#a66f00] transition-colors hover:bg-[#FFB400]/25 dark:text-[#ffd166]"
      >
        <Pencil className="size-4" />
      </Link>
      <form action={deleteRequest} onSubmit={confirmDelete}>
        <input type="hidden" name="id" value={requestId} />
        <button
          type="submit"
          aria-label={`Delete ${title}`}
          className="flex size-8 items-center justify-center rounded-full text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="size-4" />
        </button>
      </form>
    </div>
  );
}
