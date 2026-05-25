<!--
Thanks for opening a PR!

Title convention (squash-merged): `prefix: short imperative summary`
Prefixes in use: cooking, nutrition, planner, ui, i18n, data, chore, fix.

Before submitting, please run:
  pnpm run typecheck && pnpm run lint && pnpm run test && pnpm run build
-->

## Summary

<!-- What changed and WHY. The diff shows what; this section explains why. -->

## Test plan

- [ ] `pnpm run typecheck`
- [ ] `pnpm run lint`
- [ ] `pnpm run test`
- [ ] `pnpm run build`
- [ ] Manual smoke test in the browser (describe what you clicked)
- [ ] (If schema changed) migration added in `planner/migrations.ts`
- [ ] (If i18n added) all 8 locale files updated or tagged `help-wanted: translation`

## Followability check (from [CLAUDE.md](../CLAUDE.md))

- [ ] No new toggle that overlaps with an existing one
- [ ] Defaults favour the median home; rigor mode is opt-in
- [ ] No sub-20-g/day ingredient added to the cook flow (route via SupplementCard instead)
- [ ] No new blocking warning that isn't a safety failure (informational chips are fine)

## Screenshots / before-after

<!-- For UI changes. Skip for engine-only changes. -->
