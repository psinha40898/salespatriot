import Link from "next/link";
import { ArrowUpRight, ScanLine } from "lucide-react";

export default function DibbsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dibbs-theme dark min-h-screen bg-background font-sans text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-20 max-w-[1480px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          <Link href="/dibbs" className="flex items-center gap-3" aria-label="SalesPatriot opportunities">
            <span className="flex size-9 items-center justify-center rounded-sm bg-primary text-primary-foreground"><ScanLine className="size-5" /></span>
            <span className="text-base font-semibold tracking-tight">SalesPatriot<span className="text-primary">/</span></span>
            <span className="ml-5 hidden border-l border-border pl-6 text-xs text-muted-foreground sm:block">Opportunity browser</span>
          </Link>
          <a href="https://www.dibbs.bsm.dla.mil/RFQ/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground hover:text-primary">DIBBS <ArrowUpRight className="size-3.5" /></a>
        </div>
      </header>
      {children}
    </div>
  );
}
