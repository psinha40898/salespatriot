import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowLeft, ArrowRight, Search, X, SearchX, AlertCircle, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RfqFilters } from "@/components/dibbs/filters";
import { OpportunityList } from "@/components/dibbs/opportunity-list";
import { SortSelect } from "@/components/dibbs/sort-select";
import { LiveForm } from "@/components/dibbs/live-form";
import { getDibbsData } from "@/lib/dibbs";
import { currentDate } from "@/lib/dibbs-dates";
import { SET_ASIDES, parseRecord, filterRecords, type Filters } from "@/lib/dibbs-records";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Opportunities | SalesPatriot", description: "Browse recent DLA RFQs by item, deadline, and eligibility." };
const PAGE_SIZE = 25;

function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return <div className="flex min-h-80 flex-col items-center justify-center gap-4 border-y border-border p-8 text-center"><SearchX className="size-8 text-muted-foreground" /><h2 className="text-lg font-medium">{title}</h2><div className="max-w-sm text-sm leading-6 text-muted-foreground">{children}</div></div>;
}

export default async function DibbsPage({ searchParams }: PageProps<"/dibbs">) {
  const params = await searchParams;
  const get = (name: string) => Array.isArray(params[name]) ? params[name].join(",") : params[name] ?? "";
  const filters: Filters = {
    q: get("q"), fsc: get("fsc"), setAside: get("setAside"), deadline: get("deadline"),
    posted: get("posted"), type: get("type"), minQty: get("minQty"), maxQty: get("maxQty"), sort: get("sort") || "deadline",
  };
  let data;
  try {
    data = await getDibbsData();
  } catch {
    return <main className="mx-auto max-w-6xl px-6 py-20"><EmptyState title="DIBBS is currently unavailable"><p>We couldn’t load the latest postings. Restart the server to try again.</p><Button asChild variant="outline" className="mt-4"><a href="https://www.dibbs.bsm.dla.mil/RFQ/" target="_blank" rel="noopener noreferrer">Visit DIBBS <ArrowUpRight /></a></Button></EmptyState></main>;
  }

  const today = currentDate();
  const items = data.files.flatMap((file) => file.rows.map((row, index) => parseRecord(row, file.name, index)))
    .filter((item) => !item.returnBy || item.returnBy >= today);
  const loaded = data.files.filter((file) => !file.error).length;
  const categoryCounts = new Map<string, number>();
  for (const item of items) if (item.fsc) categoryCounts.set(item.fsc, (categoryCounts.get(item.fsc) ?? 0) + 1);
  const categories = [...categoryCounts.entries()].sort(([a], [b]) => a.localeCompare(b));
  const results = filterRecords(items, filters, today);
  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const requestedPage = Number(get("page")) || 1;
  const page = Math.min(pages, Math.max(1, Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1));
  const visible = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const active = Object.entries(filters).filter(([key, value]) => key !== "sort" && value);
  const deadlineLabels: Record<string, string> = { today: "Due today", week: "Due within 7 days", fortnight: "Due within 14 days", later: "15+ days to quote" };
  const chipLabels: Record<string, string> = {
    q: `“${filters.q}”`, fsc: `FSC ${filters.fsc.split(",").join(" or ")}`,
    setAside: filters.setAside.split(",").map((code) => SET_ASIDES[code] ?? code).join(" or "),
    deadline: deadlineLabels[filters.deadline] ?? filters.deadline, posted: `Posted: last ${filters.posted} days`,
    type: filters.type === "nsn" ? "NSN only" : "Part number only", minQty: `Qty ≥ ${filters.minQty}`, maxQty: `Qty ≤ ${filters.maxQty}`,
  };
  function viewUrl(changes: Record<string, string>) {
    const query = new URLSearchParams({ ...filters, page: String(page), ...changes });
    for (const [key, value] of [...query]) if (!value || (key === "page" && value === "1") || (key === "sort" && value === "deadline")) query.delete(key);
    return `/dibbs${query.size ? `?${query}` : ""}`;
  }
  const updated = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles", timeZoneName: "short" }).format(new Date(data.loadedAt));

  return (
    <main className="mx-auto w-full max-w-[1480px] px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
      <section className="mb-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">Opportunities<span className="text-primary">.</span></h1>
        </div>
        <dl className="flex gap-7 sm:gap-10">
          {[["Available items", items.length], ["Solicitations", new Set(items.map((item) => item.solicitation)).size], ["Posting dates", loaded]].map(([label, count]) => (
            <div key={label} className="space-y-2 border-l border-border pl-5"><dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt><dd className="text-2xl font-light tabular-nums">{Number(count).toLocaleString()}</dd></div>
          ))}
        </dl>
      </section>

      <LiveForm>
        <div className="mb-9 flex items-center gap-3 border-b border-border pb-6">
          <div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input name="q" defaultValue={filters.q} aria-label="Search opportunities" placeholder="Search items, NSNs, part numbers, or solicitations…" className="h-12 rounded-sm bg-muted/20 pl-11 text-sm" /></div>
          <span className="hidden items-center gap-2 whitespace-nowrap font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:flex">
            <span className="size-1.5 rounded-full bg-primary group-data-[pending=true]/live:hidden" />
            <LoaderCircle className="hidden size-3 animate-spin text-primary group-data-[pending=true]/live:block" />
            <span className="group-data-[pending=true]/live:hidden">Live search</span>
            <span className="hidden group-data-[pending=true]/live:inline">Updating</span>
          </span>
        </div>
        <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          <RfqFilters filters={filters} categories={categories} activeCount={active.length} />
          <section className="min-w-0 transition-opacity group-data-[pending=true]/live:opacity-60" aria-label="Opportunity results">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div><h2 className="text-sm font-medium">{results.length.toLocaleString()} matching items</h2><p className="mt-1 text-xs text-muted-foreground">Return-by dates today or later · Updated {updated}</p></div>
              <SortSelect value={filters.sort} />
            </div>
            {active.length > 0 && <div className="mb-5 flex flex-wrap gap-2">{active.map(([key]) => <Badge key={key} variant="secondary" asChild className="rounded-sm border border-border font-normal"><Link href={viewUrl({ [key]: "", page: "1" })} aria-label={`Remove filter: ${chipLabels[key]}`}>{chipLabels[key]}<X className="size-3" /></Link></Badge>)}</div>}
            {loaded < data.files.length && <p role="status" className="mb-5 flex items-center gap-2 text-xs text-muted-foreground"><AlertCircle className="size-4" /> {data.files.length - loaded} posting files could not be loaded. Showing available data.</p>}
            {visible.length ? <OpportunityList items={visible} today={today} /> : <EmptyState title={loaded === 0 ? "No postings could be loaded" : "No matching opportunities"}><p>{loaded === 0 ? "Restart the server to retry, or visit DIBBS directly." : "Try a broader search or remove a filter to find more items."}</p><Button variant="outline" asChild className="mt-4"><Link href="/dibbs">Clear filters</Link></Button></EmptyState>}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <p className="font-mono text-[11px] text-muted-foreground">{results.length ? `${((page - 1) * PAGE_SIZE + 1).toLocaleString()}–${Math.min(page * PAGE_SIZE, results.length).toLocaleString()} of ${results.length.toLocaleString()}` : "0 items"}</p>
              <nav aria-label="Results pages" className="flex items-center gap-3">
                {page > 1 ? <Button variant="outline" size="sm" asChild><Link href={viewUrl({ page: String(page - 1) })} prefetch={false}><ArrowLeft className="size-3.5" /> Previous</Link></Button> : <Button variant="outline" size="sm" disabled><ArrowLeft className="size-3.5" /> Previous</Button>}
                <span className="font-mono text-[11px] text-muted-foreground">{page} / {pages}</span>
                {page < pages ? <Button variant="outline" size="sm" asChild><Link href={viewUrl({ page: String(page + 1) })} prefetch={false}>Next <ArrowRight className="size-3.5" /></Link></Button> : <Button variant="outline" size="sm" disabled>Next <ArrowRight className="size-3.5" /></Button>}
              </nav>
            </div>
          </section>
        </div>
      </LiveForm>
      <footer className="mt-12 flex flex-wrap justify-between gap-3 border-t border-border pt-5 font-mono text-[10px] leading-5 text-muted-foreground"><span>PUBLIC DIBBS POSTINGS · {loaded} RECENT POSTING DATES</span><span>Confirm current status, requirements, and exact closing time on DIBBS.</span></footer>
    </main>
  );
}
