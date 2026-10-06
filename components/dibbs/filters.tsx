import type { ReactNode } from "react";
import Link from "next/link";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import { SET_ASIDES, type Filters } from "@/lib/dibbs-records";

function FilterSelect({ name, label, value, children }: {
  name: string; label: string; value: string; children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-xs text-muted-foreground">{label}</Label>
      <NativeSelect id={name} name={name} defaultValue={value} className="w-full [&_select]:h-10 [&_select]:rounded-sm">
        {children}
      </NativeSelect>
    </div>
  );
}

function MultiFilter({ name, label, value, options }: {
  name: string; label: string; value: string; options: [string, string][];
}) {
  const selected = value.split(",").filter(Boolean);
  // Preserve selections from shared URLs even if an FSC has no current rows.
  const choices = [...options, ...selected.filter((code) => !options.some(([key]) => key === code)).map((code): [string, string] => [code, code])];
  return (
    <fieldset className="min-w-0 space-y-2">
      <legend className="mb-2 text-xs text-muted-foreground">{label}</legend>
      <details className="rounded-sm border border-input bg-background">
        <summary className="cursor-pointer px-3 py-2.5 text-xs">{selected.length ? `${selected.length} selected` : "All"}</summary>
        <div className="max-h-64 space-y-1 overflow-y-auto border-t border-border p-2">
          {choices.map(([code, text]) => (
            <label key={code} className="flex cursor-pointer items-start gap-2 rounded-sm p-1.5 text-xs leading-5 hover:bg-muted">
              <Input type="checkbox" name={name} value={code} defaultChecked={selected.includes(code)} className="mt-1 size-3.5 shrink-0 rounded-sm p-0 accent-primary" />
              <span>{text}</span>
            </label>
          ))}
        </div>
      </details>
      <p className="text-[11px] text-muted-foreground">Matches any selected. None selected means all.</p>
    </fieldset>
  );
}

export function RfqFilters({ filters, categories, activeCount }: {
  filters: Filters; categories: [string, number][]; activeCount: number;
}) {
  return (
    <aside className="space-y-6 lg:border-r lg:border-border lg:pr-7">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-medium"><SlidersHorizontal className="size-4 text-primary" /> Filters</h2>
        {activeCount > 0 && <span className="font-mono text-xs text-muted-foreground">{activeCount} active</span>}
      </div>
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-1">
        <MultiFilter name="fsc" label="FSC / item category" value={filters.fsc}
          options={categories.map(([code, count]) => [code, `FSC ${code} · ${count.toLocaleString()}`])} />
        <FilterSelect name="deadline" label="Quote deadline" value={filters.deadline}>
          <NativeSelectOption value="">Any upcoming date</NativeSelectOption>
          <NativeSelectOption value="today">Due today</NativeSelectOption>
          <NativeSelectOption value="week">Within 7 days</NativeSelectOption>
          <NativeSelectOption value="fortnight">Within 14 days</NativeSelectOption>
          <NativeSelectOption value="later">15+ days to quote</NativeSelectOption>
        </FilterSelect>
        <MultiFilter name="setAside" label="Set-aside eligibility" value={filters.setAside} options={Object.entries(SET_ASIDES)} />
        <FilterSelect name="posted" label="Posted within" value={filters.posted}>
          <NativeSelectOption value="">All loaded dates</NativeSelectOption>
          <NativeSelectOption value="3">Last 3 days</NativeSelectOption>
          <NativeSelectOption value="7">Last 7 days</NativeSelectOption>
          <NativeSelectOption value="14">Last 14 days</NativeSelectOption>
        </FilterSelect>
        <FilterSelect name="type" label="Item identifier" value={filters.type}>
          <NativeSelectOption value="">NSN & part number</NativeSelectOption>
          <NativeSelectOption value="nsn">NSN only</NativeSelectOption>
          <NativeSelectOption value="part">Part number only</NativeSelectOption>
        </FilterSelect>
        <fieldset className="space-y-2">
          <legend className="mb-2 text-xs text-muted-foreground">Quantity range</legend>
          <div className="flex items-center gap-2">
            <Input name="minQty" type="number" min="0" step="1" aria-label="Minimum quantity" placeholder="Min" defaultValue={filters.minQty} className="h-10 min-w-0 bg-background" />
            <span className="text-muted-foreground">–</span>
            <Input name="maxQty" type="number" min="0" step="1" aria-label="Maximum quantity" placeholder="Max" defaultValue={filters.maxQty} className="h-10 min-w-0 bg-background" />
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">Check the unit: each, pair, box, and more.</p>
        </fieldset>
      </div>
      <div className="flex gap-2 lg:flex-col">
        <Button variant="ghost" asChild className="h-10 text-muted-foreground"><Link href="/dibbs"><RotateCcw className="size-3.5" /> Reset all</Link></Button>
      </div>
      <Separator />
      <p className="hidden text-xs leading-6 text-muted-foreground lg:block">One row is one requested item. A solicitation may include several items with different quantities.</p>
    </aside>
  );
}
