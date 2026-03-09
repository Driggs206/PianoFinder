import { prisma } from "@/lib/prisma";
import type { PianoResult } from "@/lib/types";

const TTL_S = parseInt(process.env.CACHE_TTL_SECONDS ?? "86400", 10);

export async function getCachedResults(
  cacheKey: string
): Promise<PianoResult[] | null> {
  try {
    const row = await prisma.searchCache.findUnique({ where: { cacheKey } });
    if (!row) return null;
    if (row.expiresAt < new Date()) {
      // stale
      await prisma.searchCache.delete({ where: { cacheKey } }).catch(() => {});
      return null;
    }
    return JSON.parse(row.payload) as PianoResult[];
  } catch {
    return null;
  }
}

export async function setCachedResults(
  cacheKey: string,
  results: PianoResult[]
): Promise<void> {
  const expiresAt = new Date(Date.now() + TTL_S * 1000);
  try {
    await prisma.searchCache.upsert({
      where: { cacheKey },
      create: { cacheKey, payload: JSON.stringify(results), expiresAt },
      update: {
        payload: JSON.stringify(results),
        cachedAt: new Date(),
        expiresAt,
      },
    });
  } catch {
    // Non-fatal
  }
}

export async function purgeStaleCaches(): Promise<void> {
  try {
    await prisma.searchCache.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  } catch {
    // Non-fatal
  }
}
