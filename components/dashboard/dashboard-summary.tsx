import { CheckCircle2, Tags, UsersRound } from "lucide-react";
import DashboardCard from "./dashboard-card";
import { getTotalRequests } from "@/lib/dashboard-utils";
import type { Request } from "@/types/request";

export default function DashboardSummary({ requests, teamCount, categoryCount }: { requests: Request[]; teamCount: number; categoryCount: number }) {
  const values = [
    ["Total outputs", getTotalRequests(requests), CheckCircle2, "border-t-primary", "text-primary"],
    ["Teams", teamCount, UsersRound, "border-t-[#FFB400]", "text-[#b47d00]"],
    ["Work Areas", categoryCount, Tags, "border-t-[#8A8D93]", "text-secondary"],
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
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
