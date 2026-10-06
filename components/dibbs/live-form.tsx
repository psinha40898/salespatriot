"use client";

import { useEffect, useRef, useTransition, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LiveForm({ children }: { children: ReactNode }) {
  const router = useRouter();
  const params = useSearchParams();
  const query = params.toString();
  const form = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ownNavigations = useRef(new Set<string>());
  const [pending, startTransition] = useTransition();

  function cancelDebounce() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }

  function updateResults() {
    cancelDebounce();
    if (!form.current?.checkValidity()) return;
    const next = new URLSearchParams();
    for (const [name, value] of new FormData(form.current)) {
      if (typeof value === "string" && value && !(name === "sort" && value === "deadline")) next.set(name, value);
    }
    // A changed search/filter always starts at page 1. Replace avoids a history
    // entry for every keystroke, while pagination still uses normal links.
    const nextQuery = next.toString();
    if (nextQuery === new URLSearchParams(window.location.search).toString()) return;
    ownNavigations.current.add(nextQuery);
    startTransition(() => router.replace(`/dibbs${nextQuery ? `?${nextQuery}` : ""}`, { scroll: false }));
  }

  useEffect(() => {
    // Our own result updates must not reset input values or steal focus from a
    // user who has already typed the next character. External navigation (reset,
    // removing a chip, or browser Back) synchronizes the uncontrolled inputs.
    if (ownNavigations.current.delete(query) || timer.current) return;
    const values = new URLSearchParams(query);
    for (const field of Array.from(form.current?.elements ?? [])) {
      if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) {
        field.value = values.get(field.name) ?? (field.name === "sort" ? "deadline" : "");
      }
    }
  }, [query]);

  useEffect(() => {
    const cancel = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      ownNavigations.current.clear();
    };
    window.addEventListener("popstate", cancel);
    return () => { cancel(); window.removeEventListener("popstate", cancel); };
  }, []);

  return (
    <form ref={form} action="/dibbs" method="get" className="group/live" data-pending={pending} aria-busy={pending}
      onSubmit={(event) => { event.preventDefault(); updateResults(); }}
      onChange={(event) => {
        if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement)) return;
        cancelDebounce();
        if (event.target instanceof HTMLSelectElement) updateResults();
        else timer.current = setTimeout(updateResults, 300);
      }}
      onClickCapture={(event) => {
        // Cancel queued typing before an explicit reset/chip/pagination link.
        if (event.target instanceof Element && event.target.closest('a[href^="/dibbs"]')) {
          cancelDebounce(); ownNavigations.current.clear();
        }
      }}>
      {children}
      <span role="status" className="sr-only">{pending ? "Updating results" : "Results updated"}</span>
    </form>
  );
}
