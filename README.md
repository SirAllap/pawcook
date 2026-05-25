# PawCook

**Open-source nutrition & cooking tools for home-cooked dog and cat meals.**

PawCook helps owners feed homemade — safely. The app computes daily portions
against AAFCO / NRC / FEDIAF targets, surfaces toxic-food and safe-cooking
guidance, plans weekly meal rotations across a multi-pet household, and now
walks you through actually putting bags of cooked food into the freezer
(see the veggie bag planner — given "I have 1.2 kg of carrots", it tells
you cut form, cook time, bag count, and labels).

This is **not a substitute for veterinary nutritional advice**. It's a tool
to make the rigorous version of home cooking followable — which, per our
[guiding principle](./CLAUDE.md), beats the perfectly-balanced plan an
owner abandons by week two.

- 🌐 **Live app:** runs from this repo — deployment is open and self-hostable.
- 📚 **Principles:** [CLAUDE.md](./CLAUDE.md) — the followability mandate
  + decision shortcuts every contribution should pass.
- 🤝 **Contributing:** [CONTRIBUTING.md](./CONTRIBUTING.md) — dev setup,
  monorepo layout, where to make which change.
- 🐛 **Issues / good first issues:**
  [GitHub Issues](https://github.com/SirAllap/pawcook/issues).

## Quick start

Prerequisites: **Node 22+** and **pnpm 10+**.

```bash
git clone https://github.com/SirAllap/pawcook
cd pawcook
pnpm install
pnpm dev               # boots the web app on http://localhost:5173/pawcook/
```

Other useful commands:

```bash
pnpm run typecheck     # tsc --noEmit across all packages
pnpm run lint          # eslint across all packages
pnpm run test          # vitest, all packages
pnpm run build         # full production build of the web app
```

## What's in the repo

A pnpm monorepo with three packages:

| Package | What lives there |
|---|---|
| `apps/web` | The React + Vite web app. Pages, components, i18n (8 locales). |
| `packages/shared` | The nutrition engine, planner, cooking calculators, schemas. **Pure TypeScript**, no DOM. Heavily Zod-validated and unit-tested. |
| `packages/data` | JSON data files (meats, vegetables, AAFCO/NRC tables, ingredient metadata, cooked-yield ratios). |

See [CONTRIBUTING.md](./CONTRIBUTING.md#where-to-make-changes) for the
file map and what kind of change goes where.

## License

[MIT](./LICENSE) — © 2026 David PR.

> **Important:** PawCook is an aid, not a prescription. For pets with health
> conditions, special life stages, or any nutritional uncertainty, consult
> a veterinary nutritionist (ACVN or ECVCN diplomate).
