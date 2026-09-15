// Static-safe health check. The Play Points Tracker stores all data in the
// browser (localStorage) and needs no database, so this endpoint simply
// reports that the app bundle is being served. Being static also means it
// survives `next build` with `output: "export"` for GitHub Pages.
export const dynamic = "force-static";

export async function GET() {
  return Response.json({ ok: true });
}
