import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const script = resolve('scripts/check-launch.mjs');
const temp = await mkdtemp(join(tmpdir(), 'glosso-launch-test-'));
const approval = { operatorApproved: true, publicPoliciesApproved: true, publicContentAndRightsReviewed: true, legalReviewComplete: false, accountConfigurationVerified: false };
const run = () => spawnSync(process.execPath, [script], { cwd: temp, encoding: 'utf8' });
try {
  await mkdir(join(temp, 'dist'));
  await writeFile(join(temp, 'launch-approval.json'), JSON.stringify(approval));
  await writeFile(join(temp, 'dist/index.html'), '<p>BLANK</p>');
  assert.equal(run().status, 0, 'Owner-approved release does not assert independent legal/account review');
  for (const key of ['operatorApproved', 'publicPoliciesApproved', 'publicContentAndRightsReviewed']) {
    await writeFile(join(temp, 'launch-approval.json'), JSON.stringify({ ...approval, [key]: false }));
    assert.equal(run().status, 1, `Missing ${key} must block`);
  }
  await writeFile(join(temp, 'launch-approval.json'), JSON.stringify(approval));
  for (const text of ['<div class="legal-draft-notice">BLANK</div>', 'OPERATOR INPUT REQUIRED']) {
    await writeFile(join(temp, 'dist/index.html'), text);
    assert.equal(run().status, 1, 'Draft notices must still block');
  }
  await writeFile(join(temp, 'dist/index.html'), '<p>BLANK</p>');
  await writeFile(join(temp, 'dist/private.key'), 'fixture');
  assert.equal(run().status, 1, 'Private files must still block');
  await rm(join(temp, 'dist/private.key'));
  await mkdir(join(temp, 'dist/private-submissions'));
  assert.equal(run().status, 1, 'Private directories must still block');
  console.log('Launch guard tests passed: owner approval, absent professional/account verification, draft markers and private-file protections.');
} finally {
  assert.ok(temp.startsWith(join(tmpdir(), 'glosso-launch-test-')));
  await rm(temp, { recursive: true, force: true });
}
