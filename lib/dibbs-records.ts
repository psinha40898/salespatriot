import { parseIndexDate } from "./dibbs-dates";

export const SET_ASIDES: Record<string, string> = {
  Y: "Small business", H: "HUBZone", R: "Service-disabled veteran-owned",
  L: "Women-owned", A: "8(a)", E: "Economically disadvantaged women-owned",
  N: "Unrestricted",
};

export function parseRecord(row: string, filename: string, index: number) {
  const value = (start: number, end: number) => row.slice(start, end).trim();
  const number = (start: number, end: number) => {
    const text = value(start, end);
    return /^\d+$/.test(text) ? Number(text) : null;
  };
  const identifier = value(13, 59);
  const type = value(135, 136) === "1" ? "nsn" : value(135, 136) === "2" ? "part" : "unknown";
  const date = /^in(\d{2})(\d{2})(\d{2})\.txt$/i.exec(filename);
  return {
    id: `${filename}:${index}`, solicitation: value(0, 13), identifier, type,
    fsc: type === "nsn" ? identifier.slice(0, 4) : null,
    purchaseRequest: value(59, 72), returnBy: parseIndexDate(value(72, 80)),
    documentName: value(80, 99), quantity: number(99, 106), unit: value(106, 108),
    description: value(108, 129), buyer: value(129, 134), amsc: value(134, 135),
    setAside: value(136, 137), setAsidePercentage: number(137, 140),
    posted: date ? `20${date[1]}-${date[2]}-${date[3]}` : "",
  };
}

export type RfqItem = ReturnType<typeof parseRecord>;

export function formatIdentifier(item: RfqItem) {
  const id = item.identifier;
  return item.type === "nsn" && /^\d{13}$/.test(id)
    ? `${id.slice(0, 4)}-${id.slice(4, 6)}-${id.slice(6, 9)}-${id.slice(9)}` : id;
}

export function sourceUrl(item: RfqItem) {
  return `https://www.dibbs.bsm.dla.mil/rfq/rfqrec.aspx?sn=${encodeURIComponent(item.solicitation)}`;
}

export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export type Filters = {
  // Multi-select values (fsc and setAside) are comma-separated in the URL.
  q: string; fsc: string; setAside: string; deadline: string; posted: string;
  type: string; minQty: string; maxQty: string; sort: string;
};

export function filterRecords(items: RfqItem[], filters: Filters, today: string) {
  const query = filters.q.trim().toLowerCase();
  const normalized = query.replace(/[^a-z0-9]/g, "");
  const fscs = filters.fsc.split(",").filter(Boolean);
  const setAsides = filters.setAside.split(",").filter(Boolean);
  const filtered = items.filter((item) => {
    const searchable = `${item.description} ${item.solicitation} ${item.identifier} ${item.purchaseRequest}`.toLowerCase();
    if (query && !searchable.includes(query) && (!normalized || !searchable.replace(/[^a-z0-9]/g, "").includes(normalized))) return false;
    if (fscs.length && (!item.fsc || !fscs.includes(item.fsc))) return false;
    if (setAsides.length && !setAsides.includes(item.setAside)) return false;
    if (filters.type && item.type !== filters.type) return false;
    if (filters.minQty && (item.quantity === null || item.quantity < Number(filters.minQty))) return false;
    if (filters.maxQty && (item.quantity === null || item.quantity > Number(filters.maxQty))) return false;
    const dueIn = item.returnBy ? daysBetween(today, item.returnBy) : null;
    if (filters.deadline === "today" && dueIn !== 0) return false;
    if (filters.deadline === "week" && (dueIn === null || dueIn > 7)) return false;
    if (filters.deadline === "fortnight" && (dueIn === null || dueIn > 14)) return false;
    if (filters.deadline === "later" && (dueIn === null || dueIn < 15)) return false;
    if (filters.posted && (!item.posted || daysBetween(item.posted, today) >= Number(filters.posted))) return false;
    return true;
  });
  return filtered.sort((a, b) => {
    if (filters.sort === "newest") return b.posted.localeCompare(a.posted) || a.solicitation.localeCompare(b.solicitation);
    if (filters.sort === "quantity") return (b.quantity ?? -1) - (a.quantity ?? -1);
    return (a.returnBy ?? "9999").localeCompare(b.returnBy ?? "9999") || b.posted.localeCompare(a.posted);
  });
}
