import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

const [type, slug, date] = process.argv.slice(2);
const collection = { work: 'writing', issue: 'issues', special: 'issues', contributor: 'contributors', update: 'updates' }[type];
if (!collection || !slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error('Usage: pnpm new:content <work|issue|special|contributor|update> <lowercase-slug> [publication-date]');
  process.exit(1);
}
let published;
if (type !== 'contributor') {
  if (!date || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2}))?$/.test(date) || !Number.isFinite(Date.parse(date))) {
    console.error('Supply the intended publication date: YYYY-MM-DD (UTC midnight), or an ISO timestamp with timezone. No date is invented.');
    process.exit(1);
  }
  published = new Date(date).toISOString();
  if (date.length === 10 && published.slice(0, 10) !== date) throw new Error('Invalid calendar date');
}
const fields = type === 'contributor' ? ['name: BLANK'] : type === 'work'
  ? ['title: BLANK', 'kind: prose', 'contributors: []', `published: ${JSON.stringify(published)}`, 'summary: BLANK']
  : type === 'update' ? ['title: BLANK', 'summary: BLANK', `published: ${JSON.stringify(published)}`]
  : ['title: BLANK', `edition: ${type === 'special' ? 'special' : 'monthly'}`, ...(type === 'issue' ? [`month: "${published.slice(0, 7)}"`] : []), `published: ${JSON.stringify(published)}`, 'description: BLANK', 'cover: BLANK', 'credits: []', 'contents: []'];
const file = resolve('src/content', collection, slug + '.mdx');
await mkdir(dirname(file), { recursive: true });
await writeFile(file, ['---', ...fields, 'approved: false', 'draft: true', '---', '', 'BLANK', ''].join('\n'), { flag: 'wx' });
console.log(`Created unpublished draft: ${file}`);
