import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';
import path from 'node:path';

// Dynamically discover which app privacy policies are verified
const verifiedPrivacySlugs = new Set();
try {
  const contentDir = path.resolve('src/content/apps');
  const files = fs.readdirSync(contentDir);
  for (const file of files) {
    if (file.endsWith('.md')) {
      const content = fs.readFileSync(path.join(contentDir, file), 'utf-8');
      if (content.includes('privacyPolicyStatus: "verified"')) {
        const slugMatch = content.match(/slug:\s*"([^"]+)"/);
        if (slugMatch) verifiedPrivacySlugs.add(slugMatch[1]);
      }
    }
  }
} catch {
  // Fallback gracefully
}

// https://astro.build/config
export default defineConfig({
  site: 'https://modelpath.app',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => {
        // Exclude unverified / draft application privacy pages from sitemap
        const appPrivacyMatch = page.match(/\/apps\/([^/]+)\/privacy\/?$/);
        if (appPrivacyMatch) {
          const slug = appPrivacyMatch[1];
          return verifiedPrivacySlugs.has(slug);
        }
        // Exclude 404 error page and design assets
        return !page.includes('/404') && !page.includes('/design/');
      },
    }),
  ],
  build: {
    format: 'directory'
  }
});
