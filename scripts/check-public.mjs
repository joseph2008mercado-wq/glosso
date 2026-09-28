import { inspectTree } from './lib/exposure.mjs';
const problems = await inspectTree('public', { publicOnly: true });
if (problems.length) { console.error(problems.join('\n')); process.exitCode = 1; }
else console.log('Public directory passed: reviewed inventory, no links or detected private material.');
