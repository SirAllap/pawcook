# Contributing to PawCook

Thanks for being here. PawCook is open source because home-cooking pet
food is a domain that benefits from many eyes — vets, breeders, raw
feeders, software engineers, accessibility experts, and translators
all see different things.

This guide is short on purpose. If anything's unclear, open an issue
and ask — that's a contribution too.

---

## Before you touch code: read CLAUDE.md

The [CLAUDE.md](./CLAUDE.md) file is the **single source of truth for
product principles**. Every PR (human or AI) is expected to apply it.
At minimum, skim:

- The **Followability Mandate** — the plan you'll actually cook beats
  the plan that's perfectly balanced on paper.
- The **Decision shortcuts** section — three checklists you should
  run before adding an ingredient, a toggle, or a warning.
- The **File map** — where things live.

If a PR adds a feature that violates a principle (e.g. ambushes the
median household with rigor-mode defaults), it'll get pushed back on
even if the code is clean.

---

## Development setup

**Prerequisites:** Node 22+ and pnpm 10+.

```bash
git clone https://github.com/SirAllap/pawcook
cd pawcook
pnpm install
pnpm dev
```

The web app boots at `http://localhost:5173/pawcook/`.

### The four-command loop

```bash
pnpm run typecheck     # tsc --noEmit across all packages
pnpm run lint          # eslint across all packages
pnpm run test          # vitest across all packages
pnpm run build         # production build (catches some runtime-only errors)
```

CI runs all four. Run them locally before pushing — they're fast.

---

## Where to make changes

The repo is a pnpm monorepo with strict separation:

| Goal | Where |
|---|---|
| Add an ingredient (a meat, veg, fruit, supplement) | `packages/data/src/ingredient-meta.json` + the matching domain JSON (`meats.json`, `vegetables.json`, `fruits.json`, `supplements.json`). |
| Add a veggie cook spec (method × cut × temp × time) | `packages/data/src/vegetable-cooking.json` + `packages/data/src/cooked-yield.json` for per-(veg, cut) yield. |
| Change the nutrition engine (AAFCO / NRC / FEDIAF math) | `packages/shared/src/nutrition.ts` (dog) or `nutrition-cat.ts` (cat). Don't change the engine to satisfy a UX simplification — add a mode that bypasses it instead. |
| Change how a meal plan is generated | `packages/shared/src/planner/generator.ts` (per-pet day plans, rotation), `planner/batching.ts` (cooking-bag grouping), `planner/policy.ts` (per-ingredient policy). |
| Change a shopping-list rule | `packages/shared/src/planner/shopping.ts`. |
| Add a wizard toggle | `apps/web/src/components/meal-plan/SourcingPicker.tsx`. Re-read CLAUDE.md's "Before adding a new toggle" decision shortcut first. |
| Change page UI | `apps/web/src/pages/`. |
| Add a translation | `apps/web/src/i18n/locales/{en,es,fr,pt,de,it,pl,nl}.json` — **all 8** locales must stay in lock-step. |

### Schema migrations

If you change the persisted shape of a `MealPlan`, `PetProfile`, or other
saved data:

1. Bump `CURRENT_PLAN_SCHEMA_VERSION` in
   `packages/shared/src/planner/schemas.ts`.
2. Add a migration step in `packages/shared/src/planner/migrations.ts`
   so older saved plans load cleanly.
3. Add a test in `migrations.test.ts` proving round-trip + a sensible
   default for any new field.

---

## Tests

We use [vitest](https://vitest.dev/) for unit tests across all packages.
Tests live next to the code (`foo.ts` → `foo.test.ts`).

What we expect tests for:

- **Engine changes** (nutrition, planner, shopping, batching) — must
  have a unit test that exercises the new branch.
- **Bug fixes** — add a regression test that fails without the fix.
- **UI changes** — happy-path component test is nice but not blocking;
  what matters is no regression on existing tests + a manual smoke
  test (browser, the actual feature).

Don't add tests for purely cosmetic changes (copy edits, styling).

---

## Pull requests

1. **Branch from `main`.** Name it descriptively
   (`fix/cat-allium-warning`, `feat/pumpkin-puree-supplement`).
2. **One concern per PR.** Big refactors get split into a stack.
3. **PR title** uses the same prefix convention as recent commits:
   `cooking: …`, `nutrition: …`, `planner: …`, `ui: …`, `i18n: …`,
   `data: …`, `chore: …`, `fix: …`.
4. **PR body** explains *why*, not *what* (the diff shows what).
   Include a "Test plan" section listing the four CI commands +
   any manual steps you did.
5. **CI must be green.** No skip-CI merges.

We squash-merge PRs into `main`. Your commit history during review
is yours to organize as you like.

---

## i18n

The web app ships in **8 languages** (en, es, fr, pt, de, it, pl, nl).
When you add a UI string:

- Default English inline via `t('namespace.key', { defaultValue: '…' })`
  — this is the canonical English copy.
- Add the key to every locale file in `apps/web/src/i18n/locales/`. If
  you don't speak a language, leave the English string as a placeholder
  and tag the PR with `help-wanted: translation` — a contributor will
  pick it up.

---

## Reporting bugs / requesting features

Use the issue templates — they ask the questions we need answered.

- **Bug:** include browser/OS, repro steps, expected vs actual, and
  console-error output if any.
- **Feature:** describe the user need, not the implementation. Pass
  it through the [CLAUDE.md decision shortcuts](./CLAUDE.md#decision-shortcuts)
  before you write it up.
- **Nutritional concern:** if you think the engine is producing wrong
  numbers for a specific pet, use the dedicated template. Include
  species, weight, age, life stage, activity, and what the engine
  reports vs what you expect (with a source).

---

## Code of conduct

We don't ship a formal CoC document because the rules are mundane:
be kind, assume good faith, focus on the work, no harassment. If
something happens that doesn't meet that bar, email the maintainer
(see [SECURITY.md](./SECURITY.md) for contact).

---

## Saying thank you

If PawCook saved you time or fed your dog or cat well, **a star on the
repo** is the easiest way to say so — it's also how new contributors
find the project. A pull request fixing one of the `good first issue`
labels is even better.

Welcome aboard. 🐾
