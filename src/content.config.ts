import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { isAssetUrl } from './lib/assets';
const asset = z.string().refine(isAssetUrl, 'Use an HTTPS URL or a safe absolute asset path');
const release = { approved: z.boolean().default(false), draft: z.boolean().default(false) };

const writing = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    kind: z.enum(['prose', 'poetry', 'essay', 'experimental', 'visual-art']),
    presentation: z.enum(['default', 'verbatim']).default('default'),
    contributors: z.array(z.string()).default([]),
    published: z.coerce.date(),
    summary: z.string(),
    cover: asset.optional(),
    coverAlt: z.string().optional(),
    thumbnail: z.object({
      src: asset,
      alt: z.string().optional(),
      fit: z.enum(['contain', 'cover']).default('contain'),
      position: z.tuple([z.number().min(0).max(100), z.number().min(0).max(100)]).default([50, 50]),
    }).optional(),
    audio: asset.optional(),
    assets: z.array(asset).default([]),
    issue: z.string().optional(),
    featured: z.boolean().default(false),
    ...release,
  }),
});

const issues = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/issues' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    published: z.coerce.date(),
    description: z.string(),
    cover: z.union([asset, z.literal('BLANK')]),
    coverAlt: z.string().optional(),
    pdf: asset.optional(),
    assets: z.array(asset).default([]),
    edition: z.enum(['monthly', 'special']).default('monthly'),
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
    contents: z.array(z.string()).default([]),
    credits: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    ...release,
  }),
});

const contributors = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/contributors' }),
  schema: z.object({
    name: z.string(),
    role: z.string().optional(),
    location: z.string().optional(),
    portrait: asset.optional(),
    portraitAlt: z.string().optional(),
    assets: z.array(asset).default([]),
    website: z.string().url().optional(),
    ...release,
  }),
});

const updates = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/updates' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    published: z.coerce.date(),
    href: z.string().refine((value) => /^\/(?!\/)/.test(value) || /^https:\/\//.test(value), 'Use a local path or HTTPS URL').optional(),
    ...release,
  }),
});

export const collections = { writing, issues, contributors, updates };
