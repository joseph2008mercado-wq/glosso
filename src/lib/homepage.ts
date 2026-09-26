export interface ViewTotal { date: string; slug: string; views: number; }
interface DatedEntry { id: string; data: { published: Date }; }

export function newest<T extends DatedEntry>(entries: T[], now = new Date()): T | undefined {
  return entries.filter((entry) => entry.data.published <= now)
    .sort((a, b) => b.data.published.valueOf() - a.data.published.valueOf() || a.id.localeCompare(b.id))[0];
}

// Thirty completed UTC calendar days. No current-day estimates or lifetime totals.
// Inputs must be operator-verified daily totals, with one row per date/slug.
export function mostRead<T extends DatedEntry>(
  entries: T[], rows: readonly ViewTotal[], excludedId?: string, now = new Date(),
): T | undefined {
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const start = end - 30 * 86_400_000;
  const eligible = new Map(entries.filter((entry) => entry.id !== excludedId && entry.data.published <= now).map((entry) => [entry.id, entry]));
  const scores = new Map<string, number>();
  const seen = new Set<string>();
  for (const row of rows) {
    const day = Date.parse(row.date + 'T00:00:00Z');
    const key = row.date + '/' + row.slug;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date) || !Number.isFinite(day) ||
        new Date(day).toISOString().slice(0, 10) !== row.date ||
        day < start || day >= end || !eligible.has(row.slug) ||
        !Number.isSafeInteger(row.views) || row.views < 0 || seen.has(key)) continue;
    seen.add(key);
    scores.set(row.slug, (scores.get(row.slug) ?? 0) + row.views);
  }
  const ranked = [...scores].filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return ranked.length ? eligible.get(ranked[0][0]) : undefined;
}
