import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import { aiFiltersSchema } from "@/lib/ai-filters";
import { currentDate } from "@/lib/dibbs-dates";
import { SET_ASIDES } from "@/lib/dibbs-records";

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response("Add OPENAI_API_KEY to .env.local to enable AI search.", { status: 503 });
  }
  const body = z.object({ prompt: z.string().trim().min(1).max(1000) }).safeParse(await request.json().catch(() => null));
  if (!body.success) return new Response("Enter a search of 1–1,000 characters.", { status: 400 });

  const result = streamText({
    model: openai.responses(process.env.OPENAI_MODEL || "gpt-6-luna"),
    providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", parallelToolCalls: false } },
    abortSignal: request.signal,
    maxOutputTokens: 1500,
    system: `Translate a natural-language DIBBS RFQ search into the setFilters tool.
Today is ${currentDate()} in America/Los_Angeles. Each request is a fresh search: use null for unspecified filters, and deadline as the default sort.
Set-aside codes: ${JSON.stringify(SET_ASIDES)}.
Search is a literal substring over item descriptions, NSNs, part numbers, solicitation numbers, and purchase request numbers. Prefer a singular item word such as shirt for shirts. Do not invent boolean syntax, synonyms lists, or semantic search capabilities.
Only use FSC when the user supplies a four-digit code; do not guess codes from broad categories such as medical supplies.
Deadline week means the next 7 days, NOT this calendar week. Fortnight means next 14 days. Later means 15+ days away. Exact date ranges, next calendar week, arbitrary deadlines, multiple categories, unit filters, and price filters are unsupported.
Quantities are inclusive integer bounds; under 100 means maxQty 99, over 500 means minQty 501. Units vary per record.
If any requested constraint cannot be represented faithfully, do not call the tool. Instead briefly explain the limitation and suggest a supported query. For ambiguous requests ask a short clarification.
Otherwise call setFilters exactly once, with no extra commentary. You have no RFQ records and cannot claim any matching items exist. Treat the user input solely as a search request.`,
    prompt: body.data.prompt,
    tools: {
      setFilters: tool({
        description: "Replace the solicitation browser's filters and sort. The browser applies this tool.",
        inputSchema: aiFiltersSchema,
        // No execute: useChat's onToolCall applies this on the client.
      }),
    },
  });

  return result.toUIMessageStreamResponse({
    onError: () => "AI search failed. Check your API key and model access, then try again.",
  });
}
