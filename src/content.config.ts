import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/* --------------------------------------------------------------------------
   Gate 11 — Media asset & store link schema
   Rules:
   - Only reference genuine, studio-supplied media files placed in /public.
   - Never fabricate screenshots, ratings, download counts, or store URLs.
   - Leave a field null/empty when authentic media is not yet available; the
     UI renders a clearly labelled placeholder instead.
   -------------------------------------------------------------------------- */

/** Locally hosted image (path relative to /public, e.g. /images/apps/x/icon.png) */
const imageAsset = z.object({
  src: z.string().startsWith('/'),
  alt: z.string().min(1),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

/** Optional locally hosted demonstration video. Rendered only when verified. */
const videoAsset = z.object({
  src: z.string().startsWith('/'),
  type: z.enum(['video/mp4', 'video/webm']).default('video/mp4'),
  poster: z.string().startsWith('/').optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  verified: z.boolean().default(false),
});

/** Per-platform publication status. Derived automatically when omitted. */
const platformPublicationStatus = z.enum([
  'published',
  'coming-soon',
  'in-development',
  'not-planned',
  'unconfirmed',
]);

const playStoreUrl = z
  .url()
  .refine((u) => /^https:\/\/play\.google\.com\/store\/apps\/details\?id=[\w.]+/.test(u), {
    message: 'playStoreUrl must be a genuine https://play.google.com/store/apps/details?id=… URL',
  });

const appStoreUrl = z
  .url()
  .refine((u) => /^https:\/\/apps\.apple\.com\/[a-z-]*\/?app\/[^/]+\/id\d+/.test(u), {
    message: 'appStoreUrl must be a genuine https://apps.apple.com/…/app/…/id… URL',
  });

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
    /** @deprecated Legacy Gate 1 icon path. Use `media.icon` for genuine icons. */
    icon: z.string().optional(),
    media: z
      .object({
        /** Genuine application icon (square, ≥ 512px recommended). */
        icon: imageAsset.nullable().default(null),
        /** Genuine cover/thumbnail artwork (≈ 16:10 landscape recommended). */
        cover: imageAsset.nullable().default(null),
        /** Optional locally hosted demonstration video. */
        video: videoAsset.nullable().default(null),
      })
      .default({ icon: null, cover: null, video: null }),
    /** Optional explicit per-platform status overrides. */
    platformStatus: z
      .object({
        android: platformPublicationStatus.optional(),
        ios: platformPublicationStatus.optional(),
      })
      .default({}),
    screenshots: z.array(
      z.union([
        z.string(),
        z.object({
          src: z.string(),
          alt: z.string(),
          caption: z.string().optional(),
          width: z.number().int().positive().optional(),
          height: z.number().int().positive().optional(),
        }),
      ])
    ).default([]),
    features: z.array(
      z.union([
        z.string(),
        z.object({
          title: z.string(),
          description: z.string(),
          icon: z.string().optional(),
          status: z.enum(['available', 'planned', 'verification-pending']).optional(),
          category: z.string().optional(),
        }),
      ])
    ).default([]),
    /** Genuine, verified Google Play listing URL. null until publicly released. */
    playStoreUrl: playStoreUrl.nullable().optional(),
    /** Genuine, verified Apple App Store listing URL. null until publicly released. */
    appStoreUrl: appStoreUrl.nullable().optional(),
    privacyPolicyStatus: z.enum(['verified', 'draft', 'pending-review']),
    privacyPolicyEffectiveDate: z.string().optional(),
    privacyPolicyLastUpdated: z.string().optional(),
    privacyDisclosures: z.object({
      dataCollection: z.array(z.string()).default([]),
      dataUsage: z.array(z.string()).default([]),
      storageAndRetention: z.string().optional(),
      sharingAndThirdParties: z.array(z.string()).default([]),
      advertising: z.string().optional(),
      analytics: z.string().optional(),
      permissions: z.array(z.string()).default([]),
      securityPractices: z.string().optional(),
      dataDeletion: z.string().optional(),
      contactEmail: z.string().optional(),
      // Backward compatibility aliases:
      dataCollected: z.array(z.string()).optional(),
      thirdPartyServices: z.array(z.string()).optional(),
      advertisingDisclosures: z.string().optional(),
      dataRetentionInfo: z.string().optional(),
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
