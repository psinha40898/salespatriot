import { z } from "zod";
import type { Filters } from "./dibbs-records";

// Null means no restriction. These are exactly the existing browser controls.
export const aiFiltersSchema = z.object({
  q: z.string().max(200).nullable().describe("One literal search term or phrase, or an identifier. No AND/OR syntax."),
  fsc: z.string().regex(/^\d{4}$/).nullable().describe("Explicitly requested four-digit Federal Supply Class."),
  setAside: z.enum(["Y", "H", "R", "L", "A", "E", "N"]).nullable(),
  deadline: z.enum(["today", "week", "fortnight", "later"]).nullable().describe("today; within 7 days; within 14 days; 15+ days away."),
  posted: z.enum(["3", "7", "14"]).nullable().describe("Posted in the last N calendar days, including today."),
  type: z.enum(["nsn", "part"]).nullable(),
  minQty: z.number().int().min(0).max(9999999).nullable(),
  maxQty: z.number().int().min(0).max(9999999).nullable(),
  sort: z.enum(["deadline", "newest", "quantity"]).describe("Earliest deadline; newest posting; highest quantity."),
}).refine((value) => value.minQty === null || value.maxQty === null || value.minQty <= value.maxQty, {
  message: "Minimum quantity must not exceed maximum quantity.",
});

export function toBrowserFilters(input: unknown): Filters {
  const parsed = aiFiltersSchema.parse(input);
  return Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, value === null ? "" : String(value)])) as Filters;
}
