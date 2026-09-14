import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * The tracker stores everything in the browser, so it never needs a database.
 * If DATABASE_URL is configured (optional), this also reports the connection.
 * The DB module is imported lazily so a missing DATABASE_URL can never break
 * the build or the deployment (e.g. on Vercel).
 */
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json({ ok: true, database: "not configured" });
  }
  try {
    const { db } = await import("@/db");
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, database: "connected" });
  } catch {
    return Response.json({ ok: true, database: "unreachable" });
  }
}
