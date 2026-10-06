// The index has dates only, so compare calendar days in the demo's timezone.
export function currentDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function parseIndexDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return null;

  const [, month, day, year] = match;
  const date = new Date(Date.UTC(2000 + Number(year), Number(month) - 1, Number(day)));
  // Keep unknown/invalid dates visible instead of silently discarding them.
  if (date.getUTCMonth() !== Number(month) - 1 || date.getUTCDate() !== Number(day)) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

export function isExpiredRow(row: string, today: string) {
  const date = parseIndexDate(row.slice(72, 80));
  return date !== null && date < today;
}
