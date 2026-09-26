import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve, dirname, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const astroRequire = createRequire(require.resolve('astro/package.json'));
const { transform } = astroRequire('@astrojs/compiler');
export const moduleUrl = (code) => 'data:text/javascript;base64,' + Buffer.from(code).toString('base64');

// In-memory server rendering only. Mock content access, never production publication gates.
export function createTestCompiler(overrides = new Map()) {
  const modules = new Map();
  async function compile(file) {
    file = resolve(file);
    if (overrides.has(file)) return overrides.get(file);
    if (modules.has(file)) return modules.get(file);
    let source = await readFile(file, 'utf8');
    if (file.endsWith('.astro')) {
      // Astro 5's experimental standalone container omits manifest.site. Supply
      // the real project origin at this environment boundary, not in production code.
      source = source.replaceAll('Astro.site', "new URL('https://glosso.org')");
      // Browser behavior is tested in check-browser; standalone SSR has no script manifest.
      source = source.replace(/<script\b(?![^>]*type="application\/ld\+json")[^>]*>[\s\S]*?<\/script>/g, '');
      const result = await transform(source, { filename: pathToFileURL(file).href, internalURL: 'astro/compiler-runtime', renderScript: true, astroGlobalArgs: JSON.stringify('https://glosso.org') });
      source = result.code.replace(/^import ["'][^"']+\?astro[^"']+["'];?\s*$/gm, '')
        .replace(/,\s*createMetadata as \$\$createMetadata/, '')
        .replace(/^export const \$\$metadata = .*;\s*$/gm, '');
    }
    source = source.replace(/^import ["'][^"']+\.css["'];?\s*$/gm, '');
    let code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
    const specs = [...new Set([...code.matchAll(/from ["']([^"']+)["']/g)].map((match) => match[1]))];
    for (const spec of specs) {
      const url = overrides.get(spec) ?? (spec.startsWith('.')
        ? await compile(resolve(dirname(file), extname(spec) ? spec : spec + '.ts'))
        : spec.startsWith('node:') ? spec : pathToFileURL(require.resolve(spec)).href);
      code = code.replaceAll("'" + spec + "'", JSON.stringify(url)).replaceAll('"' + spec + '"', JSON.stringify(url));
    }
    const url = moduleUrl(code);
    modules.set(file, url);
    return url;
  }
  return async (file) => import(await compile(file));
}
