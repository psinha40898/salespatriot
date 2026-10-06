# SalesPatriot

Next.js App Router application with a TypeScript DIBBS solicitation browser.
Requires Node.js 20.19+ and outbound internet access.

```sh
npm install
npm run dev
```

Open http://localhost:3000/dibbs. The homepage keeps the standard Next.js template.

For a production-style local demo:

```sh
npm run build
npm start
```

## Custom code

- `lib/dibbs.ts`: HTTP session, consent form submission, discovery of the first 14 index links, and sequential downloads. Validates 140-character records and keeps raw rows in memory.
- `lib/dibbs-dates.ts`: deterministic return-by date parsing. The page hides items due before today in America/Los_Angeles; items due today and unknown dates remain visible. Filtering runs on each page request so it advances without a server restart.
- `instrumentation.ts`: starts the import when the Node.js server starts; skips build-time imports.
- `lib/dibbs-records.ts`: fixed-width parsing, identifier formatting, source URLs, search, filtering, and sorting.
- `app/dibbs/page.tsx`: server-side filtering and 25-item pagination. Filters persist in the URL.
- `components/dibbs/`: filter controls, the opportunity table, and a small client component for automatic sort submission.
- `components/ui/`: shadcn components, generated with the CLI.
- `app/dibbs/layout.tsx` and `app/globals.css`: desktop layout and the route's charcoal/lime shadcn theme tokens.
- `app/dibbs/loading.tsx`: skeleton loading state.
- `app/page.tsx`: one link to `/dibbs` added to the template.

The first 14 entries are posting dates, not necessarily 14 consecutive calendar days. DIBBS publishes complete daily index files one day later.

Reloading the page reuses the same in-memory import. Restart the server to fetch again or retry failures. No database, authentication, browser automation, or disk cache is used by the app. The existing Python test and downloaded text file are earlier reference artifacts; the Next.js app does not use them.

HTML parsing uses `cheerio`; `fetch-cookie` manages cookies and redirects. UI components use shadcn and semantic Tailwind theme variables. The table scrolls horizontally on narrower screens.

Search supports descriptions, solicitation numbers, NSNs (with or without dashes), part numbers, and purchase request numbers. Filters cover FSC, deadline, set-aside, posting recency, identifier type, and minimum/maximum quantity. Sort by deadline, newest posting, or highest quantity. Each item links directly to its original RFQ record on DIBBS.

Setup and startup hook follow the [Next.js installation docs](https://nextjs.org/docs/app/getting-started/installation) and [instrumentation docs](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation).
