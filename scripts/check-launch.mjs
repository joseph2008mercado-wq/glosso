import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
const approval = JSON.parse(await readFile('launch-approval.json', 'utf8'));
const blocked = [];
// Operator authorization is distinct from independent legal review or an account audit.
// The owner explicitly approved public policies and removal of those review gates.
for (const key of ['operatorApproved', 'publicPoliciesApproved', 'publicContentAndRightsReviewed']) if (approval[key] !== true) blocked.push(`${key}: OPERATOR INPUT REQUIRED`);
async function inspect(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, item.name);
    if (item.isDirectory()) {
      if (['legal-review', 'private-records', 'private-submissions', '.git'].includes(item.name)) blocked.push(`${path}: private directory in output`);
      await inspect(path);
    } else {
      if (/\.(mdx?|pem|key|p12|pfx)$|^\.env/.test(item.name)) blocked.push(`${path}: source/private file in output`);
      if (item.name.endsWith('.html')) {
        const html = await readFile(path, 'utf8');
        if (/legal-draft-notice|OPERATOR INPUT REQUIRED/.test(html)) blocked.push(`${path}: unreviewed legal material in output`);
      }
    }
  }
}
await inspect('dist');
if (blocked.length) { console.error('LAUNCH BLOCKED — local previews still work.\n' + blocked.join('\n')); process.exitCode = 1; }
else {
  console.log('Launch guard passed: operator approval recorded; output/private-file checks passed.');
  if (!approval.legalReviewComplete) console.log('Informational: independent legal review is not recorded; no legal-compliance certification is made.');
  if (!approval.accountConfigurationVerified) console.log('Informational: Cloudflare account configuration still requires operator verification.');
}
