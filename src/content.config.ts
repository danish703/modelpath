import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const apps = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/apps' }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    tagline: z.string(),
    description: z.string(),
    category: z.string(),
    availablePlatforms: z.array(z.enum(['android', 'ios'])).default([]),
    plannedPlatforms: z.array(z.enum(['android', 'ios'])).default([]),
    status: z.enum(['published', 'coming-soon', 'in-development', 'unconfirmed']),
    icon: z.string(),
    screenshots: z.array(z.string()).default([]),
    features: z.array(z.string()).default([]),
    playStoreUrl: z.url().nullable().optional(),
    appStoreUrl: z.url().nullable().optional(),
    privacyPolicyStatus: z.enum(['verified', 'draft', 'pending-review']),
    privacyPolicyEffectiveDate: z.string().optional(),
    privacyPolicyLastUpdated: z.string().optional(),
    privacyDisclosures: z.object({
      dataCollected: z.array(z.string()).default([]),
      thirdPartyServices: z.array(z.string()).default([]),
      advertisingDisclosures: z.string().optional(),
      dataRetentionInfo: z.string().optional(),
      contactEmail: z.email(),
    }).optional(),
    supportEmail: z.email(),
    supportFaqs: z.array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    ).default([]),
    version: z.string().optional(),
    order: z.number().default(0),
  }),
});

export const collections = { apps };
