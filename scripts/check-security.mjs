import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { privatePath, hasCredential, inspectTree } from './lib/exposure.mjs';
import { createTestCompiler } from './lib/test-module.mjs';

const load = createTestCompiler();
const { isWebsiteUrl, isUpdateUrl } = await load('src/lib/links.ts');
for (const url of ['javascript:alert(1)', 'data:text/html,test', '//example.org', 'https://user:password@example.org', 'https://example.org\n', 'https:\\example.org']) assert.equal(isWebsiteUrl(url), false, url);
for (const url of ['https://example.org/', 'http://example.org/a?b=c#d']) assert.equal(isWebsiteUrl(url), true, url);
for (const url of ['/read/work/', '/issues/?edition=special', 'https://example.org']) assert.equal(isUpdateUrl(url), true, url);
for (const url of ['/\\example.org', '//example.org', '/\n/example.org', 'javascript:alert(1)', 'https://user:password@example.org', 'https://']) assert.equal(isUpdateUrl(url), false, url);
for (const path of ['nested/legal-review/draft.txt', 'nested/PRIVATE-RECORDS/data.csv', '.DEV.VARS', '.env.local', 'PUBLIC/.npmrc', 'private.PEM']) assert.equal(privatePath(path), true, path);
assert.equal(privatePath('.env.example'), false);
assert.equal(privatePath('.env.example', { output: true }), true);
for (const path of ['bundle.js.map', 'db.SQL', 'backup.zip', 'publication-assets/work.png', 'src/config.ts']) assert.equal(privatePath(path, { output: true }), true, path);
assert.equal(hasCredential(Buffer.from('ghp_' + 'a'.repeat(36))), true);
assert.equal(hasCredential(Buffer.from('-----BEGIN ' + 'ENCRYPTED PRIVATE KEY-----')), true);
assert.equal(hasCredential(Buffer.from('BLANK')), false);

const sandbox = await mkdtemp(join(tmpdir(), 'glosso-security-test-'));
try {
  const root = join(sandbox, 'public');
  await mkdir(root);
  await writeFile(join(root, 'llms.txt'), 'BLANK');
  assert.deepEqual(await inspectTree(root, { publicOnly: true }), []);
  await writeFile(join(root, 'innocent.txt'), 'BLANK');
  assert.match((await inspectTree(root, { publicOnly: true })).join('\n'), /unreviewed public file/);
  await rm(join(root, 'innocent.txt'));
  await writeFile(join(root, 'llms.txt'), 'ghp_' + 'a'.repeat(36));
  const credentialErrors = (await inspectTree(root, { publicOnly: true })).join('\n');
  assert.match(credentialErrors, /possible credential/);
  assert.ok(!credentialErrors.includes('a'.repeat(36)), 'Never print credentials');
  await writeFile(join(root, 'llms.txt'), 'OPERATOR INPUT REQUIRED');
  assert.match((await inspectTree(root)).join('\n'), /unreviewed legal material/);
  const privateDir = join(sandbox, 'private');
  await mkdir(privateDir);
  await symlink(privateDir, join(root, 'fonts'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.match((await inspectTree(root, { publicOnly: true })).join('\n'), /symbolic links/);
  console.log('Security regression tests passed: unsafe links, private paths, credentials, public inventory and symlink escape protection.');
} finally {
  assert.ok(sandbox.startsWith(join(tmpdir(), 'glosso-security-test-')));
  await rm(sandbox, { recursive: true, force: true });
}
