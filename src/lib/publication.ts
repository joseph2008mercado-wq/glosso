import type { CollectionEntry } from 'astro:content';
export interface PublicationContent {
  writing: CollectionEntry<'writing'>[];
  issues: CollectionEntry<'issues'>[];
  contributors: CollectionEntry<'contributors'>[];
  updates: CollectionEntry<'updates'>[];
}
export function hasSuppliedText(value?: string): boolean {
  return Boolean(value?.trim()) && value?.trim() !== 'BLANK';
}
export function isReleased(data: { approved: boolean; draft?: boolean; published?: Date }, now = new Date()): boolean {
  return data.approved && !data.draft && (!data.published || data.published.valueOf() <= now.valueOf());
}
export function issueMonth(issue: CollectionEntry<'issues'>): string {
  return issue.data.month ?? issue.data.published.toISOString().slice(0, 7);
}
const newestFirst = (a: { id: string; data: { published: Date } }, b: { id: string; data: { published: Date } }) =>
  b.data.published.valueOf() - a.data.published.valueOf() || a.id.localeCompare(b.id);
export function issueContents(issue: CollectionEntry<'issues'>, works: CollectionEntry<'writing'>[]) {
  const order = issue.data.contents ?? [];
  return works.filter((work) => work.data.issue === issue.id).sort((a, b) => {
    const rank = (id: string) => order.includes(id) ? order.indexOf(id) : Number.MAX_SAFE_INTEGER;
    return rank(a.id) - rank(b.id) || a.data.published.valueOf() - b.data.published.valueOf() || a.id.localeCompare(b.id);
  });
}
// Broken public credits/relationships must stop publication, not silently lose credit.
export function validatePublication(content: PublicationContent, all: PublicationContent = content): void {
  const people = new Set(content.contributors.map((entry) => entry.id));
  const issues = new Set(all.issues.map((entry) => entry.id));
  const works = new Map(all.writing.map((entry) => [entry.id, entry]));
  const months = new Map<string, string>();
  for (const issue of content.issues) {
    if (issue.data.edition === 'monthly') {
      const month = issueMonth(issue);
      if (months.has(month)) throw new Error(`Monthly issue conflict for ${month}: ${months.get(month)}, ${issue.id}`);
      months.set(month, issue.id);
    }
    for (const id of issue.data.credits) if (!people.has(id)) throw new Error(`Issue ${issue.id}: credit ${id} must be an approved contributor`);
    if (new Set(issue.data.contents).size !== issue.data.contents.length) throw new Error(`Issue ${issue.id}: duplicate contents slugs`);
    for (const id of issue.data.contents) if (works.get(id)?.data.issue !== issue.id) throw new Error(`Issue ${issue.id}: contents entry ${id} must exist and reference this issue`);
  }
  for (const work of content.writing) {
    if (!work.data.contributors.length || work.data.contributors.some((id) => !people.has(id))) throw new Error(`Work ${work.id}: all credits must reference approved profiles; at least one is required`);
    if (work.data.issue && !issues.has(work.data.issue)) throw new Error(`Work ${work.id}: unknown issue ${work.data.issue}`);
  }
  for (const [collection, entries] of Object.entries(all)) {
    for (const entry of entries) if (!/^[a-z0-9]+(?:[-/][a-z0-9]+)*$/.test(entry.id)) throw new Error(`${collection}: use a stable lowercase hyphenated slug: ${entry.id}`);
  }
}
export function selectPublishedContent(all: PublicationContent, now = new Date()): PublicationContent {
  const content = {
    contributors: all.contributors.filter(({ data }) => isReleased(data, now) && hasSuppliedText(data.name)).sort((a, b) => a.data.name.localeCompare(b.data.name)),
    issues: all.issues.filter(({ data }) => isReleased(data, now) && hasSuppliedText(data.title) && hasSuppliedText(data.description) && hasSuppliedText(data.cover)).sort(newestFirst),
    writing: all.writing.filter(({ data, body }) => isReleased(data, now) && hasSuppliedText(data.title) && hasSuppliedText(data.summary) &&
      (hasSuppliedText(body) || (data.kind === 'visual-art' && Boolean(data.cover)))).sort(newestFirst),
    updates: all.updates.filter(({ data }) => isReleased(data, now) && hasSuppliedText(data.title) && hasSuppliedText(data.summary)).sort(newestFirst),
  };
  validatePublication(content, all);
  return content;
}
