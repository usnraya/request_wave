function LoadingBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl border border-border bg-card ${className}`} />;
}

export default function Loading() {
  return <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10"><LoadingBlock className="h-32 w-full" /><LoadingBlock className="mt-6 h-12 w-full" /><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <LoadingBlock key={index} className="h-28" />)}</div><div className="mt-6 space-y-6"><LoadingBlock className="h-64 w-full" /><LoadingBlock className="h-80 w-full" /><LoadingBlock className="h-72 w-full" /></div></div>;
}
