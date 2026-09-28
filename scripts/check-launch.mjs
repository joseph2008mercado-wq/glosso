import { readFile } from 'node:fs/promises';
import { inspectTree } from './lib/exposure.mjs';
const approval = JSON.parse(await readFile('launch-approval.json', 'utf8'));
const blocked = [];
// Operator authorization is distinct from independent legal review or an account audit.
// The owner explicitly approved public policies and removal of those review gates.
for (const key of ['operatorApproved', 'publicPoliciesApproved', 'publicContentAndRightsReviewed']) if (approval[key] !== true) blocked.push(`${key}: OPERATOR INPUT REQUIRED`);
blocked.push(...await inspectTree('dist'));
if (blocked.length) { console.error('LAUNCH BLOCKED — local previews still work.\n' + blocked.join('\n')); process.exitCode = 1; }
else {
  console.log('Launch guard passed: operator approval recorded; output/private-file checks passed.');
  if (!approval.legalReviewComplete) console.log('Informational: independent legal review is not recorded; no legal-compliance certification is made.');
  if (!approval.accountConfigurationVerified) console.log('Informational: Cloudflare account configuration still requires operator verification.');
}
