import { CheckCircle2, Layers3, Tags, UsersRound } from "lucide-react";
import DashboardCard from "./dashboard-card";
import { getRequestsThisMonth, getTotalRequests } from "@/lib/dashboard-utils";
import type { Request } from "@/types/request";

export default function DashboardSummary({ requests, teamCount, categoryCount }: { requests: Request[]; teamCount: number; categoryCount: number }) {
  const values = [
    ["Total requests", getTotalRequests(requests), CheckCircle2, "border-t-primary", "text-primary"],
    ["This month", getRequestsThisMonth(requests), Layers3, "border-t-[#16B1FF]", "text-[#0b8ccc]"],
    ["Teams", teamCount, UsersRound, "border-t-[#FFB400]", "text-[#b47d00]"],
    ["Categories", categoryCount, Tags, "border-t-[#8A8D93]", "text-secondary"],
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {values.map(([label, value, Icon, accent, iconColor]) => (
        <DashboardCard key={label} className={`border-t-4 p-4 sm:p-5 ${accent}`}>
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] text-muted-foreground">{label}</p>
            <Icon className={`size-4 ${iconColor}`} aria-hidden="true" />
          </div>
          <p className="mt-3 text-xl font-semibold tabular-nums tracking-tight sm:text-2xl">{value}</p>
        </DashboardCard>
      ))}
    </div>
  );
}
