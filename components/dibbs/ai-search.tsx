"use client";

import { useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toBrowserFilters } from "@/lib/ai-filters";
import type { Filters } from "@/lib/dibbs-records";

const transport = new DefaultChatTransport({
  api: "/api/ai-search",
  // Each submission stands alone; don't send a growing chat history.
  prepareSendMessagesRequest: ({ messages }) => ({
    body: { prompt: messages.at(-1)?.parts.filter((part) => part.type === "text").map((part) => part.text).join(" ") },
  }),
});

export function AiSearch({ onApply }: { onApply: (filters: Filters) => void }) {
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState("");
  const applied = useRef(false);
  const { sendMessage, setMessages, addToolOutput, status, error, clearError } = useChat({
    transport,
    onToolCall: ({ toolCall }) => {
      if (toolCall.toolName !== "setFilters") return;
      try {
        if (applied.current) throw new Error("Only one filter update is allowed per search.");
        onApply(toBrowserFilters(toolCall.input));
        applied.current = true;
        setFeedback("Filters applied. You can fine-tune them below.");
        // No automatic resubmission: a second model response is unnecessary.
        void addToolOutput({ tool: "setFilters", toolCallId: toolCall.toolCallId, output: { applied: true } });
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : "Could not apply these filters.";
        setFeedback(message);
        void addToolOutput({ tool: "setFilters", toolCallId: toolCall.toolCallId, state: "output-error", errorText: message });
      }
    },
    onFinish: ({ message }) => {
      if (!applied.current) {
        const text = message.parts.filter((part) => part.type === "text").map((part) => part.text).join("");
        if (text) setFeedback(text);
      }
    },
  });
  const busy = status === "submitted" || status === "streaming";

  return (
    <form className="mb-5 space-y-3 rounded-sm border border-primary/25 bg-primary/5 p-4" aria-busy={busy}
      onSubmit={(event) => {
        event.preventDefault();
        if (busy || !input.trim()) return;
        clearError(); setFeedback(""); setMessages([]); applied.current = false;
        void sendMessage({ text: input.trim() });
      }}>
      <label htmlFor="ai-search" className="font-mono text-[11px] uppercase tracking-wider text-primary">AI search</label>
      <div className="flex gap-3">
        <Input id="ai-search" value={input} onChange={(event) => setInput(event.target.value)} maxLength={1000} disabled={busy}
          placeholder="Shirts with at least 500 units, due in the next 7 days" className="h-11 rounded-sm bg-background" />
        <Button type="submit" disabled={busy || !input.trim()} className="h-11 rounded-sm px-4">
          {busy && <LoaderCircle className="size-4 animate-spin" />}{busy ? "Thinking…" : "Search"}
        </Button>
      </div>
      <p role={error ? "alert" : "status"} className={error ? "text-xs text-destructive" : "text-xs leading-5 text-muted-foreground"}>
        {error?.message || feedback || "Each AI search replaces the filters below."}
      </p>
    </form>
  );
}
