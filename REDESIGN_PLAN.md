# PawCook — UI Redesign Plan

> **Status:** Analysis & planning only. No implementation yet.
> **Branch:** `claude/ui-redesign-analysis-DLHkP`
> **Scope:** 100% rebuild of the presentation layer (`apps/web/src/pages`, `apps/web/src/App.tsx`, `apps/web/src/index.css`).
> **Out of scope:** business logic (`packages/shared`), data (`packages/data`), routing structure, i18n infrastructure, CI/CD, deployment target.

---

## 0. Executive Summary

PawCook is a homemade dog-food calculator and reference app (cooking, nutrition macros, food safety, supplements, about). It is technically solid — TypeScript-strict, Vite, react-hook-form + Zod, i18next across 8 languages — but visually it is a single dark "glassmorphism + amber" theme built entirely with inline Tailwind classes and CSS keyframes, with **no component library**, **no design tokens**, **no light mode**, and **no real motion system**.

The redesign will deliver:

1. A **token-driven design system** with a proper light/dark mode (system-aware + user override, persisted).
2. A **mobile-first, app-shell UI** that feels like a native iOS/Android app on phones and a polished marketing/tool site on desktop.
3. A **layered motion system** powered by **Motion (ex-Framer Motion) + GSAP/ScrollTrigger + Lenis + Vaul**, with reduced-motion fallbacks.
4. A **modern landing page** with hero choreography, bento grid, interactive calculator preview, scroll-revealed sections, and a polished open-source CTA.
5. A small but real **component library** (`src/components/ui/*`) built on Radix primitives + `cva` variants — the foundation every page is composed from.
6. **No regression** to business logic, i18n keys, calculations, or URLs.

Estimated effort: ~5 phases, **~3–4 weeks** of focused work to ship the full redesign to production. Each phase ships green CI and a working app.

---

## 1. What We Are Replacing (current state, compressed)

| Layer | Today | Verdict |
|---|---|---|
| Framework | React 18 + Vite 5 + Tailwind v4 + TS strict | ✅ Keep |
| Routing | react-router-dom 6, 6 routes | ✅ Keep routes & URLs |
| State / forms | react-hook-form + Zod, local state, `localStorage` for inputs | ✅ Keep |
| i18n | i18next, 8 languages, `~src/i18n/locales/*.json` | ✅ Keep (extend keys) |
| Business logic | `packages/shared` (nutrition, cooking, schemas) | ✅ Keep untouched |
| Data | `packages/data` static JSON | ✅ Keep untouched |
| **Pages (6 files, ~1,298 LOC)** | Page-centric, no shared components | ❌ Replace |
| **`App.tsx` shell** (250 LOC) | Header + bottom-tab + portal language switcher | ❌ Replace |
| **`index.css`** | Tailwind + hand-written keyframes, no tokens | ❌ Replace |
| **Color system** | Hardcoded amber + `#07070f`, dark only | ❌ Replace with tokens |
| **Components** | None shared, inline everywhere | ❌ Build `components/ui/*` |
| **Motion** | CSS keyframes + delay utility classes | ❌ Replace with Motion + GSAP |
| **Icons** | Emoji + inline SVG | ❌ Replace with Lucide |
| **Tests** | 1 file, 2 tests on `App.tsx` | ⚠️ Expand alongside rebuild |

---

## 2. Design Vision & Principles

**Personality:** warm, trustworthy, calm-but-energetic. Think "Linear-level polish meets a vet's clinic that loves dogs." Not childish, not corporate.

**Five principles** (every screen is measured against these):

1. **Mobile is the product.** Phones are primary; desktop is the secondary, wider canvas. Every interaction is designed first for thumb-reach and one-handed use.
2. **Calm motion, never decoration.** Motion clarifies state changes and rewards interaction. It never blocks the user. Honors `prefers-reduced-motion`.
3. **Content is the hero.** The calculators and the food safety DB *are* the product. The chrome (nav, hero, sections) frames them; it never out-shouts them.
4. **One source of truth.** Color, spacing, radius, shadow, motion timing all live as tokens. No hex codes in JSX.
5. **Accessible by default.** WCAG AA contrast on both themes, full keyboard nav, ARIA via Radix primitives, focus rings everywhere, semantic HTML.

---

## 3. Design System

### 3.1 Color tokens (HSL CSS variables, both themes)

Defined in `src/styles/tokens.css` and consumed via Tailwind v4's `@theme` directive — no hex in components.

```
--background, --foreground
--card, --card-foreground
--popover, --popover-foreground
--primary, --primary-foreground       /* warm amber — brand */
--secondary, --secondary-foreground   /* soft neutral */
--muted, --muted-foreground
--accent, --accent-foreground         /* cool sage/teal for nutrition accent */
--destructive, --destructive-foreground
--success, --warning, --info          /* food-safety status */
--border, --input, --ring
--radius (default 0.75rem)
```

**Palette direction:**

- **Light mode:** warm cream background (`hsl(40 30% 98%)`), deep slate ink (`hsl(220 25% 12%)`), primary amber `hsl(35 92% 55%)`, sage accent `hsl(155 30% 45%)`.
- **Dark mode:** rich near-black (`hsl(230 18% 7%)`), warm off-white ink, same amber primary but slightly desaturated for retinal calm, sage accent slightly brighter.

Both themes preserve the existing amber brand — no rebrand, just a system around it.

### 3.2 Typography

- **Display / hero:** [Geist](https://vercel.com/font) or [Cal Sans](https://github.com/calcom/font) — tight, modern.
- **Body / UI:** Inter variable.
- **Mono (numbers in calculators, tables):** JetBrains Mono or Geist Mono — calculator values read as code-like, precise.
- Self-hosted via `@fontsource-variable/inter`, etc. — no Google Fonts runtime call.
- Type scale (clamp-based fluid): `xs / sm / base / lg / xl / 2xl / 3xl / 4xl / 5xl / 6xl` from `0.75rem` to `clamp(3rem, 8vw, 5.5rem)` for hero.

### 3.3 Spacing, radius, shadow, elevation

- 4px base spacing scale (Tailwind default).
- Radii: `sm 6 / md 10 / lg 14 / xl 20 / 2xl 28 / full 9999`.
- Elevation: 5 levels via layered shadows (subtle in light, glow-tinted in dark).
- Glass surface utility (refined from current `.glass`) — only used sparingly on the app shell.

### 3.4 Iconography

- **Lucide React** (~1 KB per icon, tree-shaken) replaces all emoji + inline SVG.
- Emoji is kept only for: food items (🥩 🥕 🍎), language flags (already in i18n), and the mascot.

### 3.5 Mascot

A small line-art paw / dog illustration as a **Lottie** file used in the hero and as the loading state. Lightweight (<30 KB), pauseable, respects reduced-motion. Sourced from LottieFiles or hand-crafted.

---

## 4. Theming: Light / Dark Mode

### 4.1 Behavior

- Three states: **System (default) / Light / Dark**.
- Persisted in `localStorage` (`pawcook_theme`).
- Applied via a `data-theme="light|dark"` attribute on `<html>` — set **before React hydrates** by an inline blocking script in `index.html` to avoid the FOUC flash.
- Live system listener (`matchMedia('(prefers-color-scheme: dark)')`) when in "System" mode.
- Theme toggle in the header (sun/moon/laptop icons) + accessible from the mobile language sheet.

### 4.2 Implementation

A tiny custom `ThemeProvider` (~40 LOC, no `next-themes` dependency needed — we're not on Next):

- Context exposes `{ theme, resolvedTheme, setTheme }`.
- `<html>` carries `data-theme` AND `class` (so Tailwind v4's `@variant dark` works seamlessly).
- All color usage in components goes through CSS variables, so theme switch is **one attribute flip** — no re-render needed for repaints.

### 4.3 Theme-aware media

- Lottie mascot has two color palettes (swapped via `useReducedMotion` and resolvedTheme).
- All images and illustrations are SVG with `currentColor` — naturally theme-aware.

---

## 5. Animation Strategy

### 5.1 Library stack (production-tested, ~50 KB gz combined)

| Library | Role | Why this one |
|---|---|---|
| **`motion`** (Framer Motion v12, rebranded) | 90% of interactions: page transitions, hover/tap, list stagger, layout animations, gesture drawers | Best-in-class React API, declarative, layoutId magic, gesture system, `useReducedMotion` baked in |
| **`gsap` + `ScrollTrigger`** | Hero scroll choreography, scroll-pinned story sections on landing | Unrivaled scroll/timeline control where Motion would be too imperative |
| **`lenis`** | Smooth scroll layer (subtle, native-feeling, mobile-aware) | Tiny (~5 KB), composes cleanly with ScrollTrigger, easy to disable on reduced-motion |
| **`vaul`** | Native-feeling bottom sheets / drawers on mobile | The standard. Used for the language switcher, settings, filter panels |
| **`lucide-react`** | Icon set | Coherent, animatable via Motion |
| **`lottie-react`** | Hero mascot, success / empty states | Designer-friendly, tiny, pauseable |
| **`canvas-confetti`** | Micro-delight on successful calculation submit | 3 KB, optional, gated by reduced-motion |
| **`sonner`** | Toasts (e.g. "Recipe copied", "Saved") | Modern, accessible, theme-aware |
| **`embla-carousel-react`** | Mobile horizontal carousels (diet types showcase, testimonials if used) | Tiny, gesture-perfect, no CSS opinions |
| **`@radix-ui/react-*`** | Accessible primitives behind our `components/ui` (Dialog, Tabs, Tooltip, Switch, Accordion, Dropdown, Toggle, Slider, Tabs) | A11y handled correctly |
| **`class-variance-authority` + `tailwind-merge` + `clsx`** | Variant API for components (`<Button variant="primary" size="lg" />`) | Standard pattern, ~2 KB total |

> **What we are NOT adding:** GSAP Pro plugins (paid), Three.js / R3F (overkill), Locomotive (Lenis is better), Auto-Animate (Motion's layout already does this), Anime.js (Motion covers it).

### 5.2 Motion principles

- **Default ease:** `cubic-bezier(0.32, 0.72, 0, 1)` (soft, expressive).
- **Default durations:** micro 120ms, small 200ms, medium 320ms, large 480ms, hero 720–1200ms.
- **Reduced motion:** every animation wrapped with `useReducedMotion()` falls back to instant or opacity-only.
- **Stagger:** Motion's `staggerChildren` for lists, ~40–60 ms steps.
- **Page transitions:** route-level fade + 8 px translate, 240 ms (mobile-feel). Optional View Transitions API on supporting browsers.
- **Gestures:** drag-to-dismiss for bottom sheets (vaul); swipe-between-tabs on mobile food safety using Motion's `drag`.
- **Scroll-driven:** hero parallax, sticky section pinning, number count-up on viewport entry — all GSAP/ScrollTrigger with Lenis driving the scroll.

### 5.3 What gets animated where (concrete)

| Surface | Motion |
|---|---|
| Hero | Mascot Lottie loop + GSAP timeline staggers headline, gradient orb drifts, primary CTA pulse on idle |
| Section reveals | Motion `whileInView` fade-up with stagger |
| Bento grid | Hover: 3D card tilt (Motion `useMotionValue` + `useTransform`); tap: scale 0.97 |
| Calculator results | Number count-up (GSAP), macro bars draw-in (Motion path animations), confetti on Ca:P pass (gated) |
| Theme toggle | Sun↔moon morph (Lucide + Motion) |
| Bottom nav | Active pill slides between tabs (Motion `layoutId`) |
| Bottom sheets | Vaul drag, snap-points |
| Toasts | Sonner default (slide + fade) |
| Page transitions | `<AnimatePresence>` wrapping `<Routes>` |

---

## 6. Mobile-First Strategy

### 6.1 App-shell layout

```
┌─────────────────────────────┐
│  Top bar (compact)          │  56 px — logo, theme toggle, language
├─────────────────────────────┤
│                             │
│  Scrollable content area    │  safe-area aware
│  (page-specific)            │
│                             │
├─────────────────────────────┤
│  Bottom nav (5 tabs)        │  72 px + safe-area-bottom
└─────────────────────────────┘
```

- Top bar collapses on scroll-down, re-appears on scroll-up (Motion `useScroll`).
- Bottom nav has an animated active pill (Motion `layoutId`), haptic-visual feedback on tap.
- Pull-to-refresh disabled in calculators; long-press on bottom nav opens contextual quick actions (e.g. "Print recipe", "Share calculation").

### 6.2 Mobile-specific patterns

- **Bottom sheets (vaul)** for: language picker, theme picker, calculator settings, filters on Food Safety, transition guide on Supplements.
- **Swipeable tabs** on Food Safety (toxic / meats / vegetables / fruits) — Motion drag with snap.
- **Sticky CTAs** at the bottom of calculator screens, just above the bottom nav, so "Calculate" is always thumb-reachable.
- **Skeleton loaders** for the small async moments (calculation thinking time).
- **Inputs:** 16 px font min (avoid iOS zoom — already done), numeric keyboards via `inputMode="decimal"`, large 48 px tap targets, proper `enterKeyHint`.
- **Safe area:** `env(safe-area-inset-*)` on top bar, bottom nav, sheets, sticky CTAs.

### 6.3 Responsive plan

| Breakpoint | Layout |
|---|---|
| `< 640 px` | App shell (top bar + bottom nav), single column |
| `640–1023 px` | App shell but wider content, 2-col grids where natural |
| `≥ 1024 px` | Marketing/web layout: persistent left rail or top nav (no bottom tabs), multi-column, hover states active, max content width 1200 px |

Same React tree, different shell — controlled by a `useMediaQuery` hook and conditional rendering of `<MobileShell>` vs `<DesktopShell>`.

### 6.4 PWA (optional, phase 5)

- `vite-plugin-pwa` for installable PWA, offline shell (since the data is bundled, full offline works trivially).
- Manifest icons (mascot), splash screens, theme-color synced to current theme.

---

## 7. Information Architecture & Page-by-Page Redesign

URLs stay the same. Components and content density are rebuilt.

### 7.1 Landing (`/`)

The marketing surface. Currently a single hero + a 4-card grid; the redesign is a proper scroll-told story.

**Sections (top to bottom):**

1. **Hero**
   - Full-viewport on desktop, content-height on mobile.
   - Headline (i18n): "Real food. For your real dog." with sub-line.
   - Two CTAs: "Calculate nutrition" (primary) → `/nutrition`, "Browse safe foods" (ghost) → `/food-safety`.
   - Lottie mascot mid-right (desktop) / behind text (mobile).
   - GSAP timeline: headline staggers in word-by-word, gradient orb drifts, CTAs spring in last.
   - Subtle "Trusted methodology: AAFCO · NRC · FEDIAF · WSAVA · ACVN" pill below CTAs.

2. **Trust strip / stats**
   - Animated counters: "8 languages · 5 diet profiles · 60+ safe foods · 100% open source."
   - Counts trigger on scroll-into-view (Motion `useInView` + GSAP count-up).

3. **Bento feature grid (the killer section)**
   - 6-tile asymmetric grid on desktop (Tailwind grid-template-areas), stacks 1-col on mobile, 2-col on tablet.
   - Tiles: Nutrition Calculator (large, live preview of macro bars animating), Cooking Calculator (medium, animated thermometer), Food Safety (medium, search bar mock), Supplements (small, capsule icon stack), Diet Profiles (small, BARF/PMR/etc badges), Languages (small, rotating flag).
   - Each tile is hover-tilt + tap-to-navigate. Featured tile auto-plays a 5 s loop demo.

4. **"How it works" three-step**
   - Sticky scroll section (GSAP ScrollTrigger pin), three steps reveal as user scrolls: 1. Tell us about your dog. 2. Pick a diet. 3. Get a balanced recipe.
   - Each step has a paired Lottie/illustration.

5. **Diet profiles showcase**
   - Horizontal Embla carousel on mobile, grid on desktop.
   - 5 cards: Balanced cooked / High protein / PMR 80-10-10 / BARF / Real Ancestral. Each with macro ring chart (Motion SVG draw-in).

6. **Safety promise**
   - Two-column: left, a callout about Ca:P balance and AAFCO compliance; right, a small live demo of the Ca:P meter going from red to green.

7. **Open source CTA**
   - Card with GitHub logo, repo stats (could be hardcoded or a tiny build-time fetch), "View on GitHub" and "Contribute" buttons.

8. **Footer**
   - Methodology sources (current About content), language switcher, theme toggle, version, repo link, disclaimer one-liner.

### 7.2 Cooking Calculator (`/cooking`)

- **Mobile:** vertically stacked form with sticky "Calculate" CTA. Inputs use bottom-sheet pickers (vaul) for meat type and cooking method instead of native selects — visually richer (icon + label + description per option).
- **Result:** Beautifully laid out recipe card. Big temperature dial (Motion SVG arc), time displayed in mono font with subtle pulse, fat content callout, storage and warnings as collapsible sections. "Print" / "Share" / "Save" action row at the top of the card (sticky on mobile).
- **Print** styles unchanged in behavior, restyled to match the new look.

### 7.3 Nutrition Calculator (`/nutrition`)

- **Form:** segmented controls for activity / body condition / life stage (Radix `ToggleGroup` styled as pills), weight input with a slider+number combo, diet profile picker as horizontal swipeable cards on mobile.
- **Results:**
  - Big "Daily kcal" number with count-up.
  - Three macro bars (protein / fat / carbs) that draw in horizontally (Motion `width` animation).
  - Replaced `CaPMeter`: a SVG arc gauge with a glowing needle that animates from 0 to the calculated ratio; safe zone shaded.
  - `AafcoBadge` becomes a chip with icon + label and a tooltip explaining the verdict.
  - Confetti on submit if Ca:P is in safe zone AND AAFCO passes (delight moment, reduced-motion respected).
  - "Save" persists to localStorage (already done) but now with a Sonner toast confirming.

### 7.4 Food Safety (`/food-safety`)

- **Mobile:** Swipeable tabs (Motion drag) for Toxic / Meats / Vegetables / Fruits. Search bar sticks to top under the top bar.
- **Items:** masonry/grid of cards with food emoji + name + status chip. Tap opens a vaul bottom sheet with full details. Tap-to-favorite (star) stored in localStorage as a new "My quick-access" group.
- **Empty state:** mascot Lottie + friendly i18n message.

### 7.5 Supplements (`/supplements`)

- **AAFCO table:** mobile-overflow is solved by a sticky-first-column horizontally scrollable table with a fade gradient on the right edge indicating scrollable area; on desktop, full table with sortable columns.
- **Recommendations:** card grid by target (joint / coat / digestion).
- **Transition guide:** vertical stepper with day-by-day percentages, animated bars (Motion `width` on viewport entry).

### 7.6 About (`/about`)

- Clean editorial layout: section headings, bordered callout cards for disclaimers, source list with logos (Lucide external-link icons), version + last-updated stamp, GitHub card.
- This is the simplest page; mostly typography work.

---

## 8. Component Library Plan (`apps/web/src/components/ui/`)

The whole rebuild rests on this. Components are small, typed, themed, and animated. Built on Radix where interactive a11y is non-trivial; otherwise hand-rolled with `cva`.

```
components/
├── ui/
│   ├── button.tsx           # variants: primary/secondary/ghost/destructive; sizes; loading state
│   ├── input.tsx            # text/number, with label, helper, error
│   ├── select.tsx           # Radix + custom; bottom-sheet on mobile via vaul
│   ├── toggle-group.tsx     # Radix segmented pills
│   ├── slider.tsx           # Radix
│   ├── switch.tsx           # Radix (used for theme & settings)
│   ├── tabs.tsx             # Radix + Motion layoutId pill
│   ├── tooltip.tsx          # Radix
│   ├── dialog.tsx           # Radix (desktop) / vaul (mobile)
│   ├── sheet.tsx            # vaul wrapper
│   ├── dropdown-menu.tsx    # Radix
│   ├── accordion.tsx        # Radix
│   ├── card.tsx             # variants, padding scale
│   ├── chip.tsx / badge.tsx # status & filter chips
│   ├── icon.tsx             # Lucide wrapper with size tokens
│   ├── kbd.tsx              # keyboard hint pills
│   ├── progress.tsx         # linear + circular (Motion SVG)
│   ├── gauge.tsx            # arc gauge for Ca:P
│   ├── stat.tsx             # animated number counter
│   ├── empty-state.tsx      # mascot + message + action
│   ├── skeleton.tsx
│   └── toaster.tsx          # Sonner wrapper
├── motion/
│   ├── fade-in.tsx          # viewport-in fade + translate
│   ├── stagger.tsx          # container with staggered children
│   ├── number-flow.tsx      # count-up
│   └── page-transition.tsx  # AnimatePresence wrapper
├── layout/
│   ├── app-shell.tsx        # routes between MobileShell and DesktopShell
│   ├── mobile-shell.tsx     # top bar + bottom nav + safe areas
│   ├── desktop-shell.tsx    # top nav + content + footer
│   ├── top-bar.tsx
│   ├── bottom-nav.tsx
│   ├── desktop-nav.tsx
│   └── footer.tsx
├── theme/
│   ├── theme-provider.tsx
│   ├── theme-toggle.tsx     # sun/moon morph
│   └── theme-script.tsx     # inline blocking script string for index.html
├── i18n/
│   └── language-switcher.tsx  # dropdown (desktop) / sheet (mobile)
├── landing/                    # marketing-only composites
│   ├── hero.tsx
│   ├── trust-strip.tsx
│   ├── bento-grid.tsx
│   ├── how-it-works.tsx
│   ├── diet-showcase.tsx
│   ├── safety-promise.tsx
│   └── oss-cta.tsx
└── calculators/                # shared bits between cooking & nutrition
    ├── form-section.tsx
    ├── result-card.tsx
    ├── macro-bar.tsx
    └── ca-p-gauge.tsx
```

Estimated total: ~40 component files, mostly small (<100 LOC each).

---

## 9. Implementation Phases (Roadmap)

Each phase ends with a green CI pipeline and a working app. No big-bang rewrite.

### Phase 0 — Foundation (Day 1)
- Create branch (✅ done).
- Install dependencies (§10).
- Add `tokens.css` + theme provider + inline anti-FOUC script.
- Wire Tailwind v4 `@theme` to the CSS variables.
- Add Lucide, set up `lib/cn.ts` (clsx + tailwind-merge).
- Add `eslint-plugin-tailwindcss` for class sorting.
- **Deliverable:** light/dark toggle works on a blank page; CI green.

### Phase 1 — Component library kernel (Days 2–4)
- Build the 12 most-used primitives: `Button, Input, Select, Card, Chip, Badge, Icon, Tabs, Tooltip, Sheet, Dialog, ThemeToggle`.
- Storybook-light: a hidden `/__dev/ui` route to visually QA every component in both themes. (Removed before merge to main.)
- Unit tests per primitive (Vitest + RTL).
- **Deliverable:** primitives live and tested.

### Phase 2 — App shell + navigation (Days 5–6)
- `AppShell` with media-query split into `MobileShell` / `DesktopShell`.
- New top bar, bottom nav with `layoutId` active pill, desktop nav.
- Language switcher rebuilt (dropdown + vaul sheet).
- Page transitions via `<AnimatePresence>`.
- All 6 existing pages still render inside the new shell — they're untouched yet.
- **Deliverable:** new chrome, old pages, fully usable.

### Phase 3 — Landing page (Days 7–10)
- Rebuild `Landing.tsx` from scratch using `components/landing/*`.
- Integrate GSAP + ScrollTrigger + Lenis.
- Lottie mascot, bento grid, scroll-pinned how-it-works, diet showcase carousel, OSS CTA.
- Performance pass: Lighthouse mobile ≥ 90.
- **Deliverable:** new landing page in production look.

### Phase 4 — Tool pages (Days 11–17)
Rebuild each in this order (most-used first):
1. **Nutrition Calculator** (day 11–13): new form UI, macro bars, Ca:P gauge, confetti.
2. **Food Safety** (day 14–15): swipeable tabs, detail sheets, favorites.
3. **Cooking Calculator** (day 15–16): temp dial, recipe card, print styles.
4. **Supplements** (day 16): table + recommendations + transition stepper.
5. **About** (day 17): editorial.

Each tool gets fresh component-level tests and at least one behavior test (e.g. "submit nutrition form, expect kcal in results").

### Phase 5 — Polish & launch (Days 18–21)
- Performance budget enforcement (§12).
- Accessibility audit (axe + manual keyboard + screen reader).
- i18n key sweep — every new string in all 8 language files (placeholder copy where translation is pending, marked with a `// TODO i18n` flag).
- Optional: PWA via `vite-plugin-pwa`.
- Reduced-motion full-app QA.
- Print-styles QA.
- Lighthouse final pass mobile + desktop ≥ 95.
- Update README and screenshots.
- Merge to `main`, deploy.

---

## 10. Dependencies to Add

```jsonc
// apps/web/package.json — additions only
{
  "dependencies": {
    // Motion
    "motion": "^12.0.0",
    "gsap": "^3.13.0",
    "lenis": "^1.1.20",
    "lottie-react": "^2.4.0",
    "canvas-confetti": "^1.9.3",

    // UI / a11y primitives (only the ones used)
    "@radix-ui/react-accordion": "^1.2.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-slider": "^1.2.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toggle-group": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.0",
    "vaul": "^1.1.0",
    "sonner": "^1.7.0",
    "embla-carousel-react": "^8.3.0",

    // Utilities
    "lucide-react": "^0.460.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",

    // Fonts (self-hosted)
    "@fontsource-variable/inter": "^5.1.0",
    "@fontsource-variable/jetbrains-mono": "^5.1.0"
  },
  "devDependencies": {
    "@types/canvas-confetti": "^1.9.0",
    "eslint-plugin-tailwindcss": "^3.17.0",
    "vite-plugin-pwa": "^0.21.0" // phase 5 only
  }
}
```

Approximate added bundle (gzipped, after tree-shaking):
- Motion: ~18 KB · GSAP core + ScrollTrigger: ~22 KB · Lenis: ~5 KB · Radix used parts: ~12 KB · Vaul: ~4 KB · Lucide (per icon imported): ~0.8 KB · Sonner: ~6 KB · Embla: ~4 KB · cva+clsx+merge: ~2 KB · Lottie: ~14 KB · Confetti: ~3 KB.
- **Total: ~90 KB gz** for the entire animation + UI system. Acceptable given current bundle is ~110 KB gz.

---

## 11. File Structure Changes

```
apps/web/src/
├── components/          # NEW — see §8
├── styles/
│   ├── tokens.css       # NEW — CSS variables for both themes
│   ├── globals.css      # NEW — base resets, font-face, Tailwind directives
│   └── print.css        # NEW — print rules (extracted from current index.css)
├── lib/
│   ├── cn.ts            # NEW — class merge
│   ├── motion.ts        # NEW — shared variants, easings
│   ├── use-media-query.ts
│   ├── use-theme.ts
│   └── use-reduced-motion.ts
├── pages/               # rebuilt one by one, same filenames
├── i18n/                # untouched infra, new keys added per phase
├── App.tsx              # rebuilt — thin: theme + i18n + router + AppShell
├── main.tsx             # add ThemeScript injection
└── index.css            # DELETED in favor of styles/globals.css
```

Tests mirror under `__tests__/` or co-located `*.test.tsx`.

---

## 12. Performance Budget

Enforced manually each phase; optionally via `size-limit` in CI later.

| Metric | Target |
|---|---|
| JS gzipped (entry) | ≤ 220 KB |
| CSS gzipped | ≤ 30 KB |
| Largest Contentful Paint (mobile, 4G) | < 2.0 s |
| Cumulative Layout Shift | < 0.05 |
| Time to Interactive (mobile) | < 3.0 s |
| Lighthouse mobile (Perf/A11y/Best/SEO) | ≥ 95 / 100 / 100 / 100 |

Tactics:
- Lazy-load each page route with `React.lazy` + `Suspense`.
- Lazy-load GSAP/ScrollTrigger only on `/` (landing) and on mount, not at bundle entry.
- Lazy-load `canvas-confetti` and `lottie-react` (dynamic import on first use).
- Self-hosted variable fonts with `font-display: swap` and preloaded hero font.
- All images SVG or AVIF/WebP with explicit width/height.
- `vite-plugin-pwa` for asset caching (phase 5).

---

## 13. Accessibility

- WCAG 2.1 AA on both themes — contrast checked per token pair.
- Every interactive component is keyboard-operable (Radix handles most).
- Visible focus ring on every focusable element (`:focus-visible` styled via `--ring`).
- `aria-label` on icon-only buttons; `aria-live="polite"` on calculator result regions for screen-reader announcement on submit.
- `prefers-reduced-motion: reduce` honored globally:
  - Motion uses `useReducedMotion` → disables transforms, keeps opacity only.
  - GSAP timelines short-circuited to final state.
  - Lenis disabled (native scroll).
  - Confetti skipped.
  - Lottie pauses on a still frame.
- Color is never the sole information channel (status chips include icons + text).
- Skip-to-content link in the top bar.
- Axe-core run in dev via `@axe-core/react` to catch regressions during build.

---

## 14. Testing Strategy

Tests grow alongside the rebuild, not after.

| Layer | Tool | Coverage target |
|---|---|---|
| UI primitives | Vitest + RTL | 100% of components in `components/ui` |
| Page behavior | Vitest + RTL (user-event) | Each page: render, primary user flow, i18n switch |
| Calculator logic | Already in `packages/shared` | Expand existing |
| Visual regression | Optional (Playwright + screenshots) | Landing hero only — high-value/low-flake |
| Lighthouse | CI job (phase 5) | Score thresholds gate merges |

CI changes: add a Lighthouse CI job in phase 5; otherwise the existing `typecheck + lint + test + build` pipeline is sufficient.

---

## 15. Risks & Constraints

| Risk | Mitigation |
|---|---|
| Translation drift — new copy in 8 languages | Add new keys with English fallback first; mark `// TODO i18n` for non-EN; ship; translate iteratively |
| GitHub Pages sub-path (`/pawcook/`) breaks routes | Keep `base: '/pawcook/'` in Vite; verify after every phase; keep `public/404.html` SPA redirect |
| Bundle bloat from animation libs | Phase-gate adoption (no GSAP until Phase 3); lazy-load per route; enforce budget |
| Motion sickness for users with vestibular sensitivity | Strict `prefers-reduced-motion` gating; no auto-playing parallax exceeding 20 px translation |
| Tailwind v4 + Radix styling friction | Use `data-state` attribute styling; documented as standard pattern |
| Lottie file weight | Cap at 30 KB per file; use dotLottie format if needed |
| Print styles regression | Phase 5 manual QA across all calculators |
| FOUC on theme load | Inline blocking script in `index.html` sets `data-theme` before paint |
| Existing single test (`App.test.tsx`) breaks | Update in Phase 2 when `App.tsx` is rebuilt |

---

## 16. Deliverables Checklist (definition of done)

- [ ] All 6 routes rebuilt and visually consistent with the design system.
- [ ] Light & dark mode parity, no hex codes in JSX.
- [ ] All copy still i18n-bound across 8 languages (English at minimum, others queued).
- [ ] Mobile experience tested on iOS Safari + Android Chrome (real or DevTools throttled).
- [ ] Lighthouse mobile ≥ 95 / 100 / 100 / 100.
- [ ] Axe a11y scan clean on every page in both themes.
- [ ] `prefers-reduced-motion` verified across all motion surfaces.
- [ ] Print styles verified on cooking & nutrition results.
- [ ] All existing business logic (cooking, nutrition, schemas) untouched.
- [ ] All URLs preserved (no broken bookmarks).
- [ ] CI green (typecheck + lint + test + build).
- [ ] README updated with new screenshots + theme demo.
- [ ] Deployed to GitHub Pages.

---

## Appendix A — Design references (for inspiration, not copy)

- **Linear** — motion polish, calm UI density.
- **Vercel / Next.js docs** — bento grids, gradient hero, type hierarchy.
- **Apple Fitness / Health app** — calculator UX, gauge visuals, mobile-first elegance.
- **Arc browser** — playful but functional motion, soft theming.
- **Cal.com** — open-source product feel, OSS CTA pattern.
- **Stripe.com** — scroll-pinned story sections.

## Appendix B — Open questions to confirm before Phase 1 starts

1. Keep amber as primary, or open to a brand refresh (e.g. warm orange or sage)? *(Recommendation: keep amber — brand equity, palette stays.)*
2. Add a "Favorites" feature in Food Safety (localStorage-backed), or skip and ship later? *(Recommendation: ship in Phase 4 — tiny addition, big UX win.)*
3. Confetti on calculation success — yes/no? *(Recommendation: yes, reduced-motion-gated. Easy delight.)*
4. PWA + offline in Phase 5, or defer? *(Recommendation: ship — data is static, near-zero extra cost.)*
5. Add a small "what changed" / "recent updates" surface on the landing page? *(Recommendation: skip for now.)*

---

*End of plan.*
