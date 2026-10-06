import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[1480px] space-y-8 px-5 py-14 sm:px-8 lg:px-12" aria-busy="true">
      <div className="space-y-4"><Skeleton className="h-3 w-40" /><Skeleton className="h-12 w-72" /><p role="status" className="text-sm text-muted-foreground">Loading recent DIBBS opportunities…</p></div>
      <Skeleton className="h-12 w-full" />
      {[1, 2, 3, 4, 5].map((row) => <div key={row} className="flex gap-6 border-b border-border py-6"><Skeleton className="size-9" /><Skeleton className="h-12 w-1/3" /><Skeleton className="ml-auto h-8 w-24" /></div>)}
    </main>
  );
}
