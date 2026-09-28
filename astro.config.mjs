import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';

export default defineConfig({
  site: 'https://glosso.org',
  output: 'static',
  trailingSlash: 'always',
  // Retain the pre-upgrade Markdown pipeline and HTML whitespace behavior.
  compressHTML: true,
  markdown: { processor: unified() },
  integrations: [mdx()],
  // Emit scripts as local files so CSP can reject inline executable code.
  vite: { build: { assetsInlineLimit: 0 } },
});
