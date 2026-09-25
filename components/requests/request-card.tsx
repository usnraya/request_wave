import type { Request } from "@/types/request";
import type { Team } from "@/types/team";
import type { Category } from "@/types/category";
import RequestActions from "./request-actions";

export default function RequestCard({
  request,
  categories,
  teams,
  canManage,
}: {
  request: Request;
  categories: Category[];
  teams: Team[];
  canManage: boolean;
}) {
  const category = categories.find((item) => item.id === request.categoryId);
  const team = teams.find((item) => item.id === request.teamId);
  return (
    <article className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/60">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs text-muted-foreground">{request.notionId || request.requestCode}</p>
          <p className="mt-1 text-[15px] font-medium">{request.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="shrink-0 rounded-full bg-[#16B1FF]/15 px-2.5 py-1 text-xs font-medium text-[#0a6ea3] dark:text-[#7fd4ff]">{category?.name ?? "Uncategorized"}</span>
          {canManage && <RequestActions requestId={request.id} title={request.title} />}
        </div>
      </div>
      <dl className="mt-4 border-t border-border pt-4 text-[13px]">
        <div>
          <dt className="text-muted-foreground">Team</dt>
          <dd className="mt-0.5 truncate font-medium">{team?.name ?? "—"}</dd>
        </div>
      </dl>
    </article>
  );
}
