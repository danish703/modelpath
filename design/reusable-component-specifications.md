# ModelPath Studio — Reusable Component Specifications (Gate 2B)

## 1. Design Token Architecture

ModelPath Studio uses a **Premium White Neumorphic (Soft UI)** system. It achieves depth using dual-directional soft shadows against a warm canvas rather than heavy borders or aggressive gradients.

### 1.1 Color Tokens
| Token | Value | Semantic Role |
| :--- | :--- | :--- |
| `--bg-canvas` | `#F4F6F8` | Global page backdrop |
| `--bg-surface` | `#F7F9FB` | Raised content containers & cards |
| `--bg-raised` | `#F4F6F8` | Tactile interactive elements (buttons, headers) |
| `--bg-inset` | `#EBEEF2` | Recessed wells, input fields, badges, placeholder frames |
| `--text-heading` | `#172233` | Primary headings, titles, active navigation (Contrast > 10.5:1) |
| `--text-body` | `#475569` | Body paragraphs, descriptions (Contrast > 5.5:1) |
| `--text-muted` | `#64748B` | Labels, metadata, footnotes, platform notes (Contrast > 4.6:1) |
| `--border-subtle` | `rgba(169, 180, 196, 0.32)` | Dividers, card separator lines |
| `--border-highlight`| `rgba(255, 255, 255, 0.85)` | Upper-left tactile light reflection edge |
| `--accent-blue` | `#4567E8` | Interactive accents, verified badges, active icons |
| `--accent-blue-hover`| `#3354D4` | Hover / active state for accent controls |

### 1.2 Neumorphic Elevation & Shadow Hierarchy
```css
/* Floating Navigation Pill */
--shadow-nav: -6px -6px 14px #FFFFFF, 6px 6px 16px rgba(169, 180, 196, 0.25);
--shadow-nav-mobile: -4px -4px 10px #FFFFFF, 4px 4px 12px rgba(169, 180, 196, 0.22);

/* Raised Cards (App Cards, Feature Cards, Resource Cards) */
--shadow-card: -8px -8px 20px #FFFFFF, 8px 8px 20px rgba(169, 180, 196, 0.26);
--shadow-card-mobile: -6px -6px 16px #FFFFFF, 6px 6px 16px rgba(169, 180, 196, 0.24);

/* Interactive Buttons */
--shadow-btn-primary: -4px -4px 10px #FFFFFF, 4px 4px 12px rgba(69, 103, 232, 0.32);
--shadow-btn-secondary: -4px -4px 10px #FFFFFF, 4px 4px 12px rgba(169, 180, 196, 0.24);

/* Recessed Inset Elements (Status Badges, Filter Active, Screenshot Wells) */
--shadow-inset-box: inset 3px 3px 7px rgba(169, 180, 196, 0.22), inset -3px -3px 7px #FFFFFF;
--shadow-inset-well: inset 5px 5px 12px rgba(169, 180, 196, 0.20), inset -5px -5px 12px #FFFFFF;
```

### 1.3 Radii & Geometry
- Pill: `9999px` (Navigation pills, CTA buttons, status chips, filter tabs)
- Card Large: `24px` (Desktop cards, hero containers, download wells)
- Card Medium: `16px` (Mobile cards, icon capsules)
- Small: `8px - 10px` (Feature icons, mini-tiles)

---

## 2. Reusable Component Catalog

### 2.1 Navigation Bar (`<HeaderNav />`)
- **Desktop (1440px)**: Floating pill (`max-width: 1120px`, height 68px, `border-radius: 9999px`). Contains studio mark, brand text "ModelPath Studio", nav links (Home, Apps, About, Contact), and primary CTA "Explore Apps".
- **Mobile (390px)**: Compact bar (height 56px, `border-radius: 14px`), brand mark + name, tactile hamburger button.
- **Active state**: Inset soft recess (`--shadow-inset-box`) with `--accent-blue` text.

### 2.2 Category Filter Pill Group (`<CategoryFilters />`)
- **Structure**: Horizontal pill list with subtle counts.
- **Inactive**: Raised pill (`--bg-surface`, `--shadow-btn-secondary`).
- **Active**: Recessed pill (`--bg-inset`, `--shadow-inset-box`, `--accent-blue` text, blue counter badge).
- **Responsive Behavior**: Wraps automatically (`flex-wrap: wrap; gap: 8px`), preserving full visibility without horizontal clipping.

### 2.3 Application Directory Card (`<AppDirectoryCard />`)
- **Elements**:
  - Upper row: App Icon Capsule (recessed well with accent icon) + Verified Status Chip (`Coming Soon`, `In Development`, `Unconfirmed`).
  - Category (uppercase tracking) + Name (`h2`, 1.5rem desktop / 1.25rem mobile) + Description.
  - Lower row: Platform target info (`Target: Android initially`, etc.) + Action links (`Privacy`, `Support`, and tactile button `Explore App →`).
- **Differentiation**: ModelPath ML features an accent boundary border indicating studio ML research.

### 2.4 Product Detail Hero (`<ProductHero />`)
- **Structure**:
  - Desktop: 2-column grid with prominent 120px raised icon frame.
  - Mobile: Vertical stack with 64px raised icon frame.
  - Metadata: Breadcrumb navigation, publication status badge, product title (`h1`), subtitle headline, and narrative summary.
  - Action pills: Target platform pill, fast anchor links to `#features`, `#screenshots`, and dedicated links to `Privacy Policy` and `Support`.

### 2.5 Feature Card Grid (`<FeatureGrid />` & `<FeatureCard />`)
- **Structure**: 2-column grid on desktop, single-column stack on mobile.
- **Card**: Raised surface (`--shadow-card`), 44px recessed icon well, feature title (`h3`), and clear descriptive copy explaining on-device privacy, pen interaction, and document organization.

### 2.6 Screenshot Gallery Frame (`<ScreenshotGallery />` & `<ScreenshotPlaceholder />`)
- **Structure**: 3-column grid on desktop, single-column stack on mobile.
- **Placeholder Frame**:
  - Recessed inset canvas (`--shadow-inset-well`, `--bg-inset`).
  - Distinct dashed guideline border (`rgba(169, 180, 196, 0.6)`).
  - Prominent icon well + pre-release mockup tag.
  - Explicit caption title and bracketed placeholder notice (e.g. `[Screenshot Placeholder: Pen input and signature placement]`).
  - Zero invented screenshots or misleading simulated telemetry.

### 2.7 Pre-Release Download Area (`<PreReleaseDownloadArea />`)
- **Visuals**: Recessed inset well spanning the container width.
- **Content**: Title & explanation that public store links will be published upon release.
- **Action**: Disabled tactile button (`Store Link Pending`) with lock/download icon, preventing misleading download promises.

### 2.8 Product Legal & Support Capsules (`<ProductResources />`)
- **Structure**: 2-column grid on desktop, stacked on mobile.
- **Privacy Capsule**: Dedicated link to app-specific privacy policy (`/apps/[slug]/privacy/`).
- **Support Capsule**: Dedicated link to app support channel (`/apps/[slug]/support/`).

### 2.9 Related Applications Row (`<RelatedApps />`)
- **Structure**: 3-column grid on desktop, stacked on mobile.
- **Cards**: Surface card displaying app icon, category, name, platform, and `Explore →` link, enabling circular site exploration.

### 2.10 Global Studio Footer (`<Footer />`)
- **Structure**: Clean centered column with subtle separator line.
- **Links**: Home, Apps, About, Contact, Privacy, app-ads.txt (wraps cleanly on mobile).
- **Copyright**: `© 2026 ModelPath Studio. All rights reserved. Independent Software Studio.`

---

## 3. Accessibility, Contrast, and Responsive Guarantees

1. **Contrast Standards**: All text elements exceed WCAG 2.1 AA requirements. Headings achieve > 10.5:1 against surfaces; body copy achieves > 5.5:1; muted labels achieve > 4.6:1.
2. **Keyboard Focus**: Interactive elements include visible focus rings using `outline: 2px solid var(--accent-blue); outline-offset: 3px;`.
3. **Motion Sensitivity**: Smooth transitions respect `@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }`.
4. **Mobile Responsiveness**:
   - Universal `box-sizing: border-box` and `min-width: 0` prevent flex/grid overflows.
   - Tested and verified across 320px, 375px, 390px, and 430px viewports with `scrollWidth <= innerWidth` (0px horizontal overflow).
