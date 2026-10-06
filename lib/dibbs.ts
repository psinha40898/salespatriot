import { load } from "cheerio";
import fetchCookie from "fetch-cookie";

const LISTING_URL =
  "https://www.dibbs.bsm.dla.mil/Rfq/RfqDates.aspx?category=recent";
const FILE_LIMIT = 14;

type IndexFile = {
  name: string;
  url: string;
  rows: string[];
  error?: string;
};

// A fresh cookie jar for each startup import. It handles redirects too.
function createSession() {
  const request = fetchCookie(fetch);

  return async function getText(url: string) {
    let response = await request(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
    let text = new TextDecoder("iso-8859-1").decode(await response.arrayBuffer());
    const $ = load(text);

    // DIBBS serves a consent form before allowing downloads.
    if ($('input[name="butAgree"]').length) {
      const form = $("form").first();
      const fields = new URLSearchParams();
      form.find('input[type="hidden"], input[name="butAgree"]').each((_, input) => {
        const name = $(input).attr("name");
        if (name) fields.set(name, $(input).attr("value") ?? "");
      });
      const action = new URL(form.attr("action") ?? "", response.url);
      response = await request(action.toString(), {
        method: "POST",
        body: fields,
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error(`Consent failed: HTTP ${response.status}`);
      text = new TextDecoder("iso-8859-1").decode(await response.arrayBuffer());
    }

    if (text.includes('name="butAgree"')) {
      throw new Error(`DIBBS consent was not accepted: ${url}`);
    }
    return text;
  };
}

async function loadRecentFiles() {
  console.log("[DIBBS] Loading the first 14 listed index files...");
  const getText = createSession();
  const $ = load(await getText(LISTING_URL));
  const urls = [...new Set(
    $("a[href]").toArray()
      .map((link) => new URL($(link).attr("href")!, LISTING_URL).toString())
      .filter((url) => /\/in\d{6}\.txt$/i.test(url)),
  )].slice(0, FILE_LIMIT);
  if (!urls.length) throw new Error("No RFQ index links found on the DIBBS listing.");

  const files: IndexFile[] = [];
  // Sequential downloads keep requests to DIBBS modest and logs easy to follow.
  for (const url of urls) {
    const name = new URL(url).pathname.split("/").pop()!;
    try {
      const text = await getText(url);
      if (/<html|<!doctype/i.test(text)) throw new Error("Received HTML instead of an index file.");
      const rows = text.split(/\r?\n/).filter((row) => row.trim());
      if (!rows.length || rows.some((row) => row.length !== 140)) {
        throw new Error("Expected nonempty, fixed-width records of 140 characters.");
      }
      files.push({ name, url, rows });
      console.log(`[DIBBS] ${name}: ${rows.length} item rows`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      files.push({ name, url, rows: [], error: message });
      console.error(`[DIBBS] ${name}: ${message}`);
    }
  }

  return { files, loadedAt: new Date().toISOString() };
}

// Share one import between startup and page requests, including dev hot reloads.
const state = globalThis as typeof globalThis & {
  dibbsLoad?: ReturnType<typeof loadRecentFiles>;
};

export function getDibbsData() {
  return state.dibbsLoad ??= loadRecentFiles();
}
