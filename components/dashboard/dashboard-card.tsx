import type { ReactNode } from "react";
import InfoTooltip from "@/components/ui/info-tooltip";
import { cn } from "@/lib/utils";

export default function DashboardCard({
  title,
  subtitle,
  help,
  action,
  children,
  className,
}: {
  title?: string;
  /** Short plain-language explanation shown in an info tooltip beside the title. */
  help?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("surface-panel relative min-w-0 p-5 sm:p-6", className)}>
      {(title || subtitle || action) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title && (
              <div className="flex items-center gap-1">
                <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
                {help && <InfoTooltip text={help} label={title} />}
              </div>
            )}
            {subtitle && <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
