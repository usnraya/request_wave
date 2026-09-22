import type { ReactNode } from "react";

export default function DashboardHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="surface-panel flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-primary">Design workspace</p>
        <h1 className="mt-2 text-2xl font-medium leading-tight tracking-tight sm:text-3xl">Request overview</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">Track completed design work across teams and categories.</p>
      </div>
      {children && <div className="lg:pb-0.5">{children}</div>}
    </header>
  );
}
