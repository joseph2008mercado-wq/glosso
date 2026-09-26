import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://glosso.org',
  output: 'static',
  trailingSlash: 'always',
  integrations: [mdx()],
});
