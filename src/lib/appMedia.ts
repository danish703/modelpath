/* ==========================================================================
   ModelPath — Application media & store availability helpers (Gate 11)

   Single source of truth for:
   - Resolving genuine media assets (icons, covers, screenshots, video)
   - Clearly labelled placeholder content when authentic media is absent
   - Per-platform publication status and store-link enablement

   Honesty rules enforced here:
   - A media reference is only used if the file genuinely exists in /public.
   - A store button is only enabled when the platform is published AND a
     schema-validated store URL exists. Nothing is ever invented.
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import type { CollectionEntry } from 'astro:content';

export type AppData = CollectionEntry<'apps'>['data'];
export type PlatformId = 'android' | 'ios';
export type PlatformStatus =
  | 'published'
  | 'coming-soon'
  | 'in-development'
  | 'not-planned'
  | 'unconfirmed';

export interface ImageAsset {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface VideoAsset {
  src: string;
  type: 'video/mp4' | 'video/webm';
  poster?: string;
  title: string;
  description: string;
}

export interface ScreenshotSlide {
  kind: 'genuine' | 'placeholder';
  src?: string;
  alt: string;
  title: string;
  caption: string;
  note?: string;
  icon?: string;
  width?: number;
  height?: number;
}

export interface PlatformAvailability {
  platform: PlatformId;
  platformLabel: string;
  storeName: string;
  storeActionLabel: string;
  status: PlatformStatus;
  statusLabel: string;
  statusDescription: string;
  url: string | null;
  enabled: boolean;
}

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const warned = new Set<string>();

/** True only when a referenced public asset actually exists on disk. */
export function publicAssetExists(src: string | undefined | null): boolean {
  if (!src || !src.startsWith('/') || src.includes('..')) return false;
  const exists = fs.existsSync(path.join(PUBLIC_DIR, src));
  if (!exists && !warned.has(src)) {
    warned.add(src);
    console.warn(`[appMedia] Referenced media not found in /public: ${src} — rendering placeholder.`);
  }
  return exists;
}

export function resolveImage(asset: ImageAsset | null | undefined): ImageAsset | null {
  return asset && publicAssetExists(asset.src) ? asset : null;
}

export function resolveIcon(data: AppData): ImageAsset | null {
  return resolveImage(data.media?.icon ?? null);
}

export function resolveCover(data: AppData): ImageAsset | null {
  return resolveImage(data.media?.cover ?? null);
}

/** Video is only rendered when explicitly verified and the file exists. */
export function resolveVideo(data: AppData): VideoAsset | null {
  const v = data.media?.video;
  if (!v || !v.verified || !publicAssetExists(v.src)) return null;
  return {
    src: v.src,
    type: v.type,
    poster: v.poster && publicAssetExists(v.poster) ? v.poster : undefined,
    title: v.title,
    description: v.description,
  };
}

/* --------------------------------------------------------------------------
   Screenshots
   -------------------------------------------------------------------------- */

const placeholderSets: Record<string, Array<{ title: string; note: string; caption: string; icon: string }>> = {
  signmint: [
    { title: 'Document Viewer & Signature Canvas', note: 'Touch and pen input for signature placement', caption: 'Signature & Document Canvas', icon: 'canvas' },
    { title: 'Document Navigation & Review', note: 'Document page viewing and layout inspection for signature placement', caption: 'Document Review View', icon: 'organizer' },
    { title: 'Signature Profiles', note: 'Stored signature and date presets', caption: 'Signature Profiles', icon: 'profile' },
  ],
  ehub: [
    { title: 'Distraction-Free Reading Canvas', note: 'EPUB reader view with typography adjustments', caption: 'EPUB Reader Canvas', icon: 'canvas' },
    { title: 'PDF Document Navigation', note: 'PDF document viewer and page navigation', caption: 'PDF Viewer', icon: 'organizer' },
    { title: 'Local Book Library', note: 'On-device library collection and shelf view', caption: 'Library Management', icon: 'profile' },
  ],
  pylab: [
    { title: 'Interactive Syntax Lessons', note: 'Structured Python lesson progression and syntax practice', caption: 'Lesson Canvas', icon: 'canvas' },
    { title: 'Guided Code Challenges', note: 'Hands-on code quizzes and exercises', caption: 'Challenge View', icon: 'organizer' },
    { title: 'Curriculum Progression', note: 'Module roadmap from beginner to intermediate concepts', caption: 'Curriculum Path', icon: 'profile' },
  ],
  'modelpath-ml': [
    { title: 'ModelPath ML Application Interface', note: 'Studio machine learning application view', caption: 'Application View', icon: 'canvas' },
    { title: 'Planned Workflow Interface', note: 'Exploratory machine learning workflow view', caption: 'Workflow Preview', icon: 'organizer' },
    { title: 'Studio Research Canvas', note: 'Internal ModelPath Studio experiment canvas', caption: 'Studio Project', icon: 'profile' },
  ],
};

export function getScreenshotSlides(data: AppData): ScreenshotSlide[] {
  const genuine: ScreenshotSlide[] = (data.screenshots || [])
    .map((s, idx) => (typeof s === 'string'
      ? { src: s, alt: `${data.name} interface screenshot ${idx + 1}`, caption: `${data.name} screen ${idx + 1}` }
      : s))
    .filter((s) => publicAssetExists(s.src))
    .map((s) => ({
      kind: 'genuine' as const,
      src: s.src,
      alt: s.alt,
      title: s.caption || s.alt,
      caption: s.caption || '',
      width: 'width' in s ? s.width : undefined,
      height: 'height' in s ? s.height : undefined,
    }));

  if (genuine.length > 0) return genuine;

  const set = placeholderSets[data.slug] || [
    { title: `${data.name} Primary Interface`, note: `${data.name} main application screen`, caption: 'Application Interface', icon: 'canvas' },
    { title: `${data.name} Workflow View`, note: `${data.name} workflow and tool view`, caption: 'Workflow View', icon: 'organizer' },
    { title: `${data.name} Settings & Overview`, note: `${data.name} settings and overview`, caption: 'Settings & Overview', icon: 'profile' },
  ];

  return set.map((p) => ({
    kind: 'placeholder' as const,
    alt: `Placeholder: ${p.title} — genuine screenshot not yet available`,
    title: p.title,
    caption: p.caption,
    note: p.note,
    icon: p.icon,
  }));
}

/* --------------------------------------------------------------------------
   Platform & store availability
   -------------------------------------------------------------------------- */

const STATUS_LABELS: Record<PlatformStatus, string> = {
  published: 'Available',
  'coming-soon': 'Coming Soon',
  'in-development': 'In Development',
  'not-planned': 'Not Currently Planned',
  unconfirmed: 'Unconfirmed',
};

export function derivePlatformStatus(data: AppData, platform: PlatformId): PlatformStatus {
  const override = data.platformStatus?.[platform];
  if (override) return override;
  if (data.availablePlatforms.includes(platform)) return 'published';
  if (data.plannedPlatforms.includes(platform)) {
    return data.status === 'coming-soon' ? 'coming-soon' : 'in-development';
  }
  // Nothing declared at all → platform plans are genuinely unknown.
  if (data.status === 'unconfirmed' || (data.availablePlatforms.length === 0 && data.plannedPlatforms.length === 0)) {
    return 'unconfirmed';
  }
  // Another platform is declared but this one isn't → not planned (never "Coming Soon").
  return 'not-planned';
}

function describe(status: PlatformStatus, name: string, platformLabel: string, storeName: string, hasUrl: boolean): string {
  switch (status) {
    case 'published':
      return hasUrl
        ? `${name} is available for ${platformLabel} on ${storeName}.`
        : `${name} for ${platformLabel} is released; the ${storeName} link is pending verification.`;
    case 'coming-soon':
      return `${name} for ${platformLabel} is being prepared for release. The ${storeName} link will appear here once the listing is live.`;
    case 'in-development':
      return `${name} for ${platformLabel} is in active development. No ${storeName} listing exists yet.`;
    case 'not-planned':
      return `A ${platformLabel} version of ${name} is not currently planned.`;
    case 'unconfirmed':
    default:
      return `${platformLabel} availability for ${name} has not been confirmed by the studio.`;
  }
}

export function getPlatformAvailability(data: AppData): PlatformAvailability[] {
  const defs: Array<{ platform: PlatformId; platformLabel: string; storeName: string; storeActionLabel: string; url: string | null }> = [
    { platform: 'android', platformLabel: 'Android', storeName: 'Google Play', storeActionLabel: 'Get it on Google Play', url: data.playStoreUrl ?? null },
    { platform: 'ios', platformLabel: 'iOS', storeName: 'App Store', storeActionLabel: 'Download on the App Store', url: data.appStoreUrl ?? null },
  ];

  return defs.map((d) => {
    const status = derivePlatformStatus(data, d.platform);
    const enabled = status === 'published' && Boolean(d.url);
    if (d.url && status !== 'published') {
      console.warn(`[appMedia] ${data.slug}: ${d.storeName} URL present but ${d.platformLabel} is not marked published — button kept disabled.`);
    }
    return {
      ...d,
      url: enabled ? d.url : null,
      status,
      statusLabel: STATUS_LABELS[status],
      statusDescription: describe(status, data.name, d.platformLabel, d.storeName, Boolean(d.url)),
      enabled,
    };
  });
}

export function formatPlatforms(list: readonly string[] = []): string {
  return list.map((p) => (p === 'ios' ? 'iOS' : 'Android')).join(' & ');
}

/* --------------------------------------------------------------------------
   Card model (homepage, directory, related apps)
   -------------------------------------------------------------------------- */

export interface AppCardModel {
  slug: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  status: AppData['status'];
  availablePlatforms: string[];
  plannedPlatforms: string[];
  playStoreUrl: string | null;
  appStoreUrl: string | null;
  icon: ImageAsset | null;
  cover: ImageAsset | null;
  order: number;
}

export function toCardModel(data: AppData): AppCardModel {
  return {
    slug: data.slug,
    name: data.name,
    category: data.category,
    tagline: data.tagline,
    description: data.description,
    status: data.status,
    availablePlatforms: data.availablePlatforms,
    plannedPlatforms: data.plannedPlatforms,
    playStoreUrl: data.playStoreUrl ?? null,
    appStoreUrl: data.appStoreUrl ?? null,
    icon: resolveIcon(data),
    cover: resolveCover(data),
    order: data.order,
  };
}
