import { ArrowUpRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SET_ASIDES, daysBetween, formatIdentifier, sourceUrl, type RfqItem } from "@/lib/dibbs-records";

function Deadline({ item, today }: { item: RfqItem; today: string }) {
  if (!item.returnBy) return <span className="text-muted-foreground">Check DIBBS</span>;
  const days = daysBetween(today, item.returnBy);
  const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${item.returnBy}T00:00:00Z`));
  return (
    <div className="space-y-1">
      <p>{date}</p>
      <p className={`font-mono text-[11px] ${days <= 3 ? "text-primary" : "text-muted-foreground"}`}>
        {days === 0 ? "Due today" : days === 1 ? "Tomorrow" : `In ${days} days`}
      </p>
    </div>
  );
}

function SetAside({ item }: { item: RfqItem }) {
  return (
    <Badge variant="outline" className={`h-auto max-w-44 whitespace-normal rounded-sm px-2 py-1 text-[11px] font-normal leading-4 ${item.setAside !== "N" ? "border-primary/20 bg-primary/5 text-primary" : "text-muted-foreground"}`}>
      {SET_ASIDES[item.setAside] ?? "Check DIBBS"}
    </Badge>
  );
}

function ItemName({ item }: { item: RfqItem }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-border bg-muted/40"><Package className="size-4 text-muted-foreground" /></div>
      <div className="min-w-0 space-y-1.5">
        <a href={sourceUrl(item)} target="_blank" rel="noopener noreferrer" className="block font-medium capitalize hover:text-primary">{item.description.toLowerCase().replace(/,+$/, "") || "Unnamed item"}</a>
        <p className="font-mono text-[11px] text-muted-foreground">{item.type === "nsn" ? "NSN" : item.type === "part" ? "Part" : "Item ID"} {formatIdentifier(item)}</p>
        <p className="font-mono text-[10px] text-muted-foreground">{item.fsc ? `FSC ${item.fsc}` : item.type === "part" ? "Manufacturer part number" : "Identifier type unavailable"}</p>
      </div>
    </div>
  );
}

function SourceLink({ item }: { item: RfqItem }) {
  return (
    <Button variant="ghost" asChild className="px-0 font-mono text-xs text-primary hover:bg-transparent hover:text-primary/80">
      <a href={sourceUrl(item)} target="_blank" rel="noopener noreferrer" aria-label={`View solicitation ${item.solicitation} on DIBBS`}>View RFQ <ArrowUpRight className="size-3.5" /></a>
    </Button>
  );
}

export function OpportunityList({ items, today }: { items: RfqItem[]; today: string }) {
  return (
    <>
      <div>
        <Table>
          <TableHeader>
            <TableRow className="border-y border-border hover:bg-transparent">
              {["Item / identifier", "Solicitation", "Quantity", "Return by", "Set-aside", ""].map((label) => <TableHead key={label} className="h-11 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className="transition-colors hover:bg-muted/40">
                <TableCell className="min-w-56 py-6 pl-2"><ItemName item={item} /></TableCell>
                <TableCell className="font-mono text-xs"><p>{item.solicitation}</p><p className="mt-2 text-[10px] text-muted-foreground">Posted {item.posted.slice(5).replace("-", "/")}</p></TableCell>
                <TableCell><p className="tabular-nums">{item.quantity?.toLocaleString() ?? "—"}</p><p className="mt-1 font-mono text-[11px] text-muted-foreground">{item.unit}</p></TableCell>
                <TableCell className="text-sm"><Deadline item={item} today={today} /></TableCell>
                <TableCell><SetAside item={item} /></TableCell>
                <TableCell className="pr-2 text-right"><SourceLink item={item} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
