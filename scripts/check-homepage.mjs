import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

// Pure in-memory fixtures only. No content collection entries or public routes.
const source = await readFile(new URL('../src/lib/homepage.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const { newest, mostRead } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
const now = new Date('2026-09-23T12:00:00Z');
const entries = [
  { id: 'a', data: { published: new Date('2026-09-22') } },
  { id: 'b', data: { published: new Date('2026-09-01') } },
  { id: 'c', data: { published: new Date('2026-08-01') } },
  { id: 'future', data: { published: new Date('2026-10-01') } },
];
assert.equal(newest(entries, now).id, 'a');
assert.equal(newest([], now), undefined);
assert.equal(entries[0].id, 'a');
const rows = [
  { date: '2026-09-22', slug: 'a', views: 1000 },
  { date: '2026-09-22', slug: 'b', views: 9 },
  { date: '2026-08-24', slug: 'b', views: 3 },
  { date: '2026-09-22', slug: 'c', views: 10 },
  { date: '2026-08-23', slug: 'c', views: 1000 },
  { date: '2026-09-23', slug: 'c', views: 1000 },
  { date: '2026-09-22', slug: 'future', views: 9999 },
  { date: '2026-09-22', slug: 'unknown', views: 9999 },
];
assert.equal(mostRead(entries, rows, 'a', now).id, 'b');
assert.equal(mostRead(entries, [], 'a', now), undefined);
assert.equal(mostRead([entries[0]], rows, 'a', now), undefined);
assert.equal(mostRead(entries, [{ date: 'invalid', slug: 'b', views: 9 }], 'a', now), undefined);
assert.equal(mostRead(entries, [{ date: '2026-09-22', slug: 'b', views: -1 }], 'a', now), undefined);
assert.equal(mostRead(entries, [{ date: '2026-09-22', slug: 'b', views: 1.5 }], 'a', now), undefined);
assert.equal(mostRead(entries, [{ date: '2026-09-22', slug: 'b', views: 0 }], 'a', now), undefined);
assert.equal(mostRead(entries, [
  { date: '2026-09-22', slug: 'b', views: 1 },
  { date: '2026-09-22', slug: 'b', views: 999 },
  { date: '2026-09-22', slug: 'c', views: 2 },
], 'a', now).id, 'c');
assert.equal(mostRead(entries, [
  { date: '2026-09-22', slug: 'c', views: 2 },
  { date: '2026-09-22', slug: 'b', views: 2 },
], 'a', now).id, 'b');
console.log('Homepage selection checks passed: dates, 30-day boundaries, exclusions, invalid data, duplicates, ties, empty states.');
