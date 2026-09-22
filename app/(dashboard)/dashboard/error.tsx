"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <div className="flex min-h-[60vh] items-center justify-center px-6"><div className="max-w-sm rounded-2xl border border-border bg-card p-8 text-center"><h2 className="text-xl font-medium">Dashboard unavailable</h2><p className="mt-2 text-[13px] text-muted-foreground">We couldn&apos;t load the request overview. Try again.</p><Button className="mt-6" onClick={() => reset()}>Try again</Button></div></div>;
}
