import { CheckCircle2, Tags, UsersRound } from "lucide-react";
import DashboardCard from "./dashboard-card";
import InfoTooltip from "@/components/ui/info-tooltip";
import { getTotalRequests } from "@/lib/dashboard-utils";
import type { Request } from "@/types/request";

export default function DashboardSummary({ requests, teamCount, categoryCount }: { requests: Request[]; teamCount: number; categoryCount: number }) {
  const values = [
    ["Total outputs", getTotalRequests(requests), CheckCircle2, "border-t-primary", "text-primary", "Jumlah semua hasil desain yang sudah selesai pada tampilan ini. Satu request bisa menghasilkan lebih dari satu output."],
    ["Teams", teamCount, UsersRound, "border-t-[#FFB400]", "text-[#b47d00]", "Jumlah tim yang punya request selesai pada tampilan ini."],
    ["Work Areas", categoryCount, Tags, "border-t-[#8A8D93]", "text-secondary", "Jumlah jenis pekerjaan (mis. Social Media, Campaign) yang muncul pada tampilan ini."],
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
      {values.map(([label, value, Icon, accent, iconColor, help]) => (
        <DashboardCard key={label} className={`border-t-4 p-4 sm:p-5 ${accent}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-1">
              <p className="text-[13px] text-muted-foreground">{label}</p>
              <InfoTooltip text={help} label={label} />
            </div>
            <Icon className={`size-4 ${iconColor}`} aria-hidden="true" />
          </div>
          <p className="mt-3 text-xl font-semibold tabular-nums tracking-tight sm:text-2xl">{value}</p>
        </DashboardCard>
      ))}
    </div>
  );
}
