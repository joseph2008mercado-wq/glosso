import { getCollection } from 'astro:content';
import { selectPublishedContent } from './publication';
import { validateMediaFiles } from './media-files';

// One policy feeds routes, archives, homepage, media and sitemap in dev and production.
export async function publishedContent() {
  const [writing, issues, contributors, updates] = await Promise.all([
    getCollection('writing'), getCollection('issues'), getCollection('contributors'), getCollection('updates'),
  ]);
  const content = selectPublishedContent({ writing, issues, contributors, updates });
  await validateMediaFiles(content);
  return content;
}
export async function publishedWriting() { return (await publishedContent()).writing; }
export async function publishedIssues() { return (await publishedContent()).issues; }
export async function publishedContributors() { return (await publishedContent()).contributors; }
export async function publishedUpdates() { return (await publishedContent()).updates; }
export { displayDate, displayPublicationDate, displayKind } from './format';
