# PawCook — Contributor Principles

This file is the single source of truth for product principles in this
repo. Claude Code reads it automatically at session start; any agent
(or human) shipping code here is expected to apply these principles
when making decisions.

Keep this file short. Link out for detail.

---

## The Followability Mandate (north-star principle)

> **The plan you'll actually cook beats the plan that's perfectly balanced on paper. PawCook's job is to make nutritionally adequate food easy to put on the floor — not to make nutritionally optimal food the owner abandons by week two.**

Every other principle below sits underneath this one. The full
nutritional engine in `packages/shared/src/nutrition*.ts` stays — it
is the rigorous ceiling. What changes is the default shape of the
output: it must be a plan a real human in a real kitchen can execute.

If a recommendation can't survive contact with a 7 a.m. kitchen, we
redesign it or route the missing nutrition to a supplement card.
We do not ship complexity and trust the owner to absorb it silently.

---

## Sub-principles (decision tools)

1. **Followability is a nutritional input, not a UX nicety.** A plan
   the owner deviates from is, by definition, less nutritious than a
   simpler plan they execute faithfully. When a profile asks for five
   open meat containers per day, the engine is not "more rigorous" —
   it's producing an output the owner will silently downgrade in the
   kitchen, and we'll never see the deviation in our data. Optimise
   for the meal that gets eaten.

2. **The household is the unit, not the pet.** Multi-pet homes share
   the cook session, the bag, and often the bowl. The data model
   treats `pets[]` as a household; the planner's default mode is
   "what does this household cook this week," not "what does each pet
   eat in isolation." A 4 kg cat eating the same beef the dogs eat —
   at the right portion, with the right supplements — is a *better*
   outcome than that cat getting a 5-component custom meal the owner
   skips on Thursday.

3. **Sub-threshold add-ins are pills, not ingredients.** Anything
   below **~20 g/day per pet** in the `seafood | organ | liver |
   fiber` classes is a supplement in disguise. It does not belong in
   the bag schedule, the shopping list's meat section, or the daily
   cook flow. It belongs in a "Daily top-up" workflow with a dosing
   line. The 6 g/day cat salmon is the canonical example — a
   fish-oil capsule wearing a salmon costume. Encoded as
   `SUPPLEMENT_GRAM_THRESHOLD` in `packages/shared/src/planner/policy.ts`.

4. **Surface deficits loudly; never simulate them silently.** If we
   simplify the cat to "same protein as the dogs," we *say so* — a
   visible chip on the day card reads "Add a daily taurine + cod
   liver oil supplement." We never quietly drop a nutrient on the
   floor. The owner trades complexity for an explicit, named
   supplement — that's a deal they can audit.

5. **Defaults favour the median home, not the showcase home.** The
   typical user has a fridge, a sous-vide stick, two open bags of
   meat tops, and a 45-minute window on Sunday afternoon. Defaults
   ship for that user; the rigorous mode is one toggle away and
   labelled honestly. Raw-feeders / vet-supervised users opt in to
   complexity, they don't get ambushed by it.

6. **The cook flow drives the meal plan, not the reverse.** When the
   bag schedule and the day plan disagree, the day plan loses. If
   the dogs are on beef Monday–Tuesday, the cat is on beef
   Monday–Tuesday — the planner does not insert a turkey day for the
   cat because rotation said so. Rotation is a *softer* constraint
   than household-batching.

7. **Rigor lives behind a switch, not in the default output.** The
   full `cat_cooked_carnivore` profile (5 slots) is *correct* and
   stays in code. It just stops being the default for a multi-species
   household. Power users opt in; we don't ambush newcomers with it.

---

## Decision shortcuts

Before adding a new ingredient component, ask:

- Will this produce **< 20 g/day** for a common pet weight? If yes,
  route to `cookFresh` and ship a supplement card recommendation
  instead. (See `SUPPLEMENT_GRAM_THRESHOLD` in `policy.ts`.)
- Does this make a multi-pet household maintain a new bag in the
  freezer? If yes, justify the bag, or route it through cookFresh.
- Will the owner have to maintain this *every day* (not weekly)?
  If yes, it's a supplement, not an ingredient.

Before adding a new toggle to the wizard, ask:

- Does it fight an existing toggle? Two switches that answer the
  same question in different vocabularies is the UX entropy this
  doc exists to prevent.
- What does the **default** answer? Pick defaults that the median
  household would pick themselves. The toggle is for the minority.

Before adding a new warning, ask:

- Does it block the plan or inform it? Blocking is reserved for
  safety failures (the raw-cat-no-taurine pattern). Everything else
  is informational and dismissible.

---

## File map (where things live)

- **Nutrition engine** — `packages/shared/src/nutrition.ts`,
  `nutrition-cat.ts`. The full per-species, per-life-stage profiles.
  Don't change these to satisfy a UX simplification; add a *mode*
  that bypasses them and surfaces supplements instead.
- **Diet profiles** — `nutrition-cat.ts` defines
  `cat_cooked_carnivore` etc. with their 5-slot component splits.
  These are the rigorous ceiling, not the default.
- **Planner** — `packages/shared/src/planner/generator.ts` produces
  per-pet per-day allocations. Block rotation, multi-pet sharing,
  and simple-meals collapse all live here.
- **Batching** — `packages/shared/src/planner/batching.ts` groups
  cooked-ahead bags. Sub-threshold add-ins route via `cookFresh` in
  here.
- **Ingredient policy** — `packages/shared/src/planner/policy.ts`
  derives per-ingredient `maxBagDays`, fridge life, etc. from
  `ingredient-meta.json`. **Don't add per-ingredient policy
  overrides that bypass the class-level defaults** unless you have
  a hard reason — that's how the salmon-as-supplement bug shipped.
- **Wizard UI** — `apps/web/src/components/meal-plan/SourcingPicker.tsx`.
  Toggles live here.
- **Plan view** — `apps/web/src/pages/MealPlan/CookingPlanView.tsx`,
  `ShoppingListView.tsx`. The supplement card lives here when it
  exists.

## Linked specs

- `CAT_ADAPTATION_SPEC.md` — cat-specific nutritional rigor (the
  ceiling). Read alongside this doc, not instead of it.
- `CAT_EXPANSION_PLAN.md` — implementation rollout for cat support.
- `REDESIGN_PLAN.md` — UI tone, motion, design system.
