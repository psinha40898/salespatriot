export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  ) {
    const { getDibbsData } = await import("./lib/dibbs");
    // Start loading in the background so the app can serve its loading screen.
    void getDibbsData().catch((error) => console.error("[DIBBS] Import failed:", error));
  }
}
