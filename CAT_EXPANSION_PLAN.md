# PawCook — Cat Expansion Research & Plan

> **Status:** research & planning only. No implementation yet.
> **Trigger:** the user cooks for both dogs and a cat, and wants PawCook to
> support both responsibly. The user's intuition that "cats are 100%
> carnivorous" is correct — and that fact alone means cat support is not
> a switch flip on the dog engine. This document explains why, what
> changes, and proposes a concrete path.

---

## 0. Executive summary

Cats are **obligate carnivores** — biologically, not just stylistically.
That status drives several non-negotiable nutritional and safety
differences that the current dog-only engine does not model. Adding cats
the wrong way (treating them as "small dogs") is the single biggest
risk: it would let users compute plans that are deficient in
**taurine**, **arachidonic acid**, **arginine**, and **preformed
vitamin A**, any one of which can cause acute or chronic harm.

**Recommendation:** add a top-level **Species** toggle (Dog · Cat) that
the engine, data, and UI are all aware of. The app shell, motion,
theme, i18n, routing, and ~70 % of the calculator UI are species-
agnostic and reuse as-is. The diet profiles, AAFCO targets, calcium
math, toxic-food database, supplement defaults, and warning logic
become species-aware. New cat-specific diet profiles are added; the dog
profiles are untouched.

**Main tradeoff:** broader value proposition vs. focused brand. "PawCook
for dogs" was crisp; "PawCook for dogs and cats" is broader but
slightly less focused. Mitigation: the species selector becomes the
first thing a returning user sees, and every screen reads as native to
the selected species rather than bolted on.

**Effort estimate:** ~2–3 weeks of focused work in 5 phases, parallel
to (or after) the UI rebuild that is now in production.

---

## 1. Why this is more than a tweak — the biology

Dogs are **facultative carnivores**: omnivorous in practice, can
synthesize several conditionally-essential nutrients, tolerate
moderate starch and plant matter. Cats can't. The relevant facts that
the engine must respect:

| Trait | Dog | Cat | Why it matters for the app |
|---|---|---|---|
| **Taurine** | Synthesizes from cysteine/methionine | **Cannot synthesize enough** — must come from diet | Must add taurine target + supplement default. Lost during cooking (~20 %), so any cooked diet needs supplementation post-cook. |
| **Arachidonic acid** (omega-6) | Makes from linoleic acid | **Cannot** — needs preformed animal source | Vegetable oils don't count. Must come from animal fats/eggs. |
| **Arginine** | Conditional | **Acutely essential** — a single arginine-free meal can cause hyperammonemia and death | Diet validator must hard-fail recipes that have insufficient arginine. |
| **Vitamin A** | Converts beta-carotene from veg | **Cannot** convert — needs preformed retinol | Vegetable sources don't count. Liver provides it (but too much → toxicity). |
| **Niacin (B3)** | Synthesizes from tryptophan | Poorly, low pancreatic enzyme | Higher dietary requirement. |
| **Vitamin D** | Some skin synthesis | None to speak of | Diet must supply. |
| **Carbohydrates** | Digests moderate starch fine | Low amylase; uses protein for gluconeogenesis | Diet profile should not include grain-heavy "starch" component. |
| **Sweet taste** | Functional receptor | Pseudogene — cannot taste sweet | No relevance to formulation, but explains why cats reject many "treats". |
| **Thirst drive** | Strong | **Weak** — historically got water from prey | Wet-food preference is the rule, not a style choice. Recipe outputs should mention moisture. |
| **Protein** | 18 % DM AAFCO adult min | **26 % DM AAFCO adult min** | Higher floor; engine target changes. |

Sources for all of the above are linked in §11.

---

## 2. Cat-specific nutrition: AAFCO 2014 profile (adult maintenance, DM)

The numbers that the data layer needs. Where they differ from the dog
profile, the cat value is **bolded**.

| Nutrient | Adult min | Growth min | Safe max |
|---|---|---|---|
| Crude protein | **26 %** | 30 % | — |
| Crude fat | 9 % | 9 % | — |
| **Taurine (dry food)** | **0.10 %** | 0.10 % | — |
| **Taurine (wet food)** | **0.20 %** | 0.20 % | — |
| **Arachidonic acid** | **0.02 %** | 0.02 % | — |
| EPA + DHA | — | 0.012 % | — |
| Linoleic acid | 0.55 % | 0.55 % | — |
| Arginine | **1.04 %** | **1.24 %** | — |
| Methionine | 0.20 % | 0.20 % | 1.50 % |
| Lysine | 0.34 % | 1.20 % | — |
| Calcium | 0.6 % | 1.0 % | 2.5 % |
| Phosphorus | 0.5 % | 0.8 % | 1.6 % |
| Ca:P ratio | 1:1 – 1.5:1 (looser than dog) | same | — |
| **Vitamin A (retinol)** | 3 332 IU/kg | 6 668 IU/kg | **333 300 IU/kg** |
| Vitamin D | 280 IU/kg | 280 IU/kg | 30 080 IU/kg |
| Vitamin E | 40 IU/kg | 40 IU/kg | — |
| Niacin | 60 mg/kg | 60 mg/kg | — |
| Thiamine (B1) | 5.6 mg/kg | 5.6 mg/kg | — |

The data layer needs a **separate `cat-aafco.json`** that mirrors the
existing dog one structurally, so the same UI table renders for either
species.

### 2.1 Energy (DER) math for cats

The RER formula is the same allometric:
`RER = 70 × BW(kg)^0.75`. *(The simplified linear approximation
`RER ≈ 30 × kg + 70` is also widely used by clinics; the engine should
pick one — recommendation: stick with `70 × kg^0.75` to match the dog
implementation.)*

Multipliers diverge from dogs:

| Life stage / status | Cat multiplier | (Dog for ref.) |
|---|---:|---:|
| Kitten (growth, < 1 y) | **2.5** | 2.0–3.0 |
| Lean intact adult | 1.4 | 1.6–1.8 |
| **Neutered adult** | **1.2** | 1.6 |
| Mature adult (7–10 y) | 1.1–1.2 | 1.4 |
| Senior (10+ y) | 1.1 | 1.2 |
| Pregnant | 1.6 | 1.6–2.0 |
| Lactating | 2.0–6.0 (by litter size) | 2.0–6.0 |
| Overweight (target weight) | 0.8–1.0 | 1.0 |

The **neutered-adult ×1.2** number is the headline reason house cats
get fat: they're typically fed at dog-equivalent ratios.

---

## 3. Cat-specific safety facts that the engine should encode

These are above and beyond the existing dog toxic-foods database.

1. **Onions / garlic / chives / leeks** — more toxic to cats than dogs
   (lower body weight, faster onset of Heinz-body anemia). Engine
   should flag at *any* dose.
2. **Raw fish in large amounts** — **thiaminase** in many freshwater
   fish (carp, smelt, herring) and some marine species destroys
   thiamine in vivo. Cooked fish is fine. Cats are far more sensitive
   to thiamine deficiency than dogs.
3. **Tuna as a staple** — mercury accumulation + **steatitis (yellow
   fat disease)** from PUFA-rich fish without enough vitamin E. Tuna
   should be ≤ 10 % of intake and rotated.
4. **Liver excess** — vitamin A toxicity (hypervitaminosis A); cats
   are uniquely sensitive. Cap liver at ~5 % of total intake.
5. **Raw egg white** — avidin binds biotin → biotin deficiency. Whole
   cooked eggs are fine; raw whole eggs occasionally are tolerated
   because yolk biotin compensates, but the safer recommendation is
   cooked.
6. **Milk and dairy** — most adult cats are lactose intolerant
   despite the cultural image. Should be flagged as "limit / caution",
   not toxic.
7. **Dog food long-term** — taurine + arachidonic acid deficient by
   design. Engine should warn if a user attempts to feed a dog-profile
   recipe to a cat (or just gate it via the species toggle so this
   can't happen).
8. **Plant-based diets** — physiologically inappropriate for cats.
   The app should not offer a vegan profile for cats.
9. **Bones** — for cooked recipes, never. For raw, the existing dog
   guidance (raw edible bones only, no weight-bearing bones for large
   cats) applies, scaled to cat size.

---

## 4. Cat-specific diet profiles to add

The current 5 dog profiles (`balanced_cooked, high_protein, pmr, barf,
real_ancestral`) do not all apply to cats. Proposed cat-specific
profiles:

| Key | Label | Macros (P / F / Veg) | Notes |
|---|---|---|---|
| `cat_cooked_carnivore` | Cooked carnivore | 70 / 25 / 5 | Cooked meat + organ + small veg + **taurine + B-vit + AA supplementation mandatory**. |
| `cat_pmr` | PMR 84/6/10 | 84 muscle / 6 bone / 10 organ (5 liver, 5 secreting) | Prey-model raw. Closest to natural diet. No starch, no veg. |
| `cat_frankenprey` | Frankenprey | same 84/6/10 by assembly | Same ratios as PMR but assembled from cuts (chicken thighs, chicken necks, beef liver, etc.). |
| `cat_whole_prey` | Whole prey | n/a | Mice, day-old chicks, quail. Edge profile; informational, no recipe assembly. |
| `cat_barf_lite` | BARF-lite | 75 / 5 / 20 | With small veg + seafood for variety; closer to BARF philosophy adapted for cats. |

The current dog `pmr` profile uses 80/10/10. Cat PMR is **84/6/10** —
different because cats need less calcium (lower bone fraction) and
more muscle meat.

---

## 5. Architecture proposal

### 5.1 Three options considered

**A. Species toggle in current app** (recommended)
- Single app, one top-level species state, all logic species-aware.
- Pros: one URL space, one design system, one auth (if ever added),
  one repo, easy cross-promotion. Minimal user friction — toggling is
  instant. 70 % of code is unchanged.
- Cons: requires touching most engine code; species selection must be
  obvious or users will mis-feed.

**B. Sister site / separate routes** (`/dog/*`, `/cat/*`)
- Pros: cleaner mental model; no risk of accidental species mix-up.
- Cons: lots of duplicated UI work; navigation gets heavier; SEO
  fragmented.

**C. Two separate apps**
- Pros: cleanest separation; each can have its own positioning.
- Cons: massive duplication; doubles maintenance; the calculators and
  food-safety DB *want* to share infrastructure.

**Recommendation: A**, with the species selector elevated to a
permanent header element so the current state is always visible.

### 5.2 Engine refactor (`packages/shared`)

```ts
export type Species = 'dog' | 'cat';

export interface NutritionInput {
  species: Species;          // NEW — required, no default
  weightKg: number;
  age: 'puppy' | 'kitten' | 'adult' | 'senior';  // life-stage union widens
  // … existing fields
}

export interface AafcoStatus {
  status: 'pass' | 'caution' | 'fail';
  failedNutrients: string[];  // NEW — surface which nutrient failed
}
```

- `calculateNutrition` becomes species-dispatching: a thin top-level
  function picks `nutritionDog.ts` or `nutritionCat.ts`.
- `cat`-flavored module has:
  - `DIET_PROFILES_CAT` (5 cat profiles above).
  - `COMPONENT_CA_P_CAT` — same as dog with small tweaks
    (no `starch`, optional `taurine_supplement`).
  - `DER_MULTIPLIERS_CAT` — `{ kitten: 2.5, intactAdult: 1.4, ... }`.
  - New AAFCO checks: `validateTaurine`, `validateArachidonic`,
    `validateArginine`, `validatePreformedVitaminA`,
    `validateNotTooMuchLiver`, `validateNotTooMuchTuna`.
  - New warning IDs: `lowTaurine`, `lowArachidonic`, `lowArginine`,
    `vitaminAToxicity`, `thiamineRiskRawFish`, `steatitisTunaExcess`.
- Existing dog code: untouched.

### 5.3 Data (`packages/data`)

- `aafco.json` → `aafco-dog.json` (rename) + `aafco-cat.json` (new).
- `toxic.json` → add an optional `species: ['dog','cat']` field on
  each entry. Default = both (e.g. chocolate, xylitol). Cat-specific
  entries (raw fish thiaminase risk, lily callout) get
  `species: ['cat']`. Dog-specific ones stay as-is.
- `meats.json`: annotate raw-safe / cooked-safe per species (most are
  same; tuna gets a `cat: { limit: '10% of intake' }` flag).
- `supplements.json`: add cat-specific items at the top (taurine,
  arachidonic acid sources like beef heart, vitamin E for fish-heavy
  diets).
- `transition.json`: add a `species` aware variant — cats need
  *slower* transitions than dogs (10–14 days vs 7) because of food
  neophobia.

### 5.4 UI changes (`apps/web/src`)

- **`SpeciesContext`** at the app shell level, persisted in
  `localStorage.pawcook_species` (default by browser detection? no —
  ask on first load).
- **Species selector** in the top bar: two clean icons
  (paw + dog silhouette / paw + cat silhouette), animated swap.
  Mobile: also accessible from a bottom-sheet settings panel.
- **First-run onboarding** (one screen, dismissible): "Who are you
  cooking for? You can switch any time." Sets the initial value
  cleanly so users never see the wrong species's data first.
- **Page-level adaptations:**
  - `Landing`: hero copy and stats stay species-agnostic; bento grid
    tiles show the right diet count per species; "Diet showcase"
    section uses cat profiles when cat is selected.
  - `NutritionCalculator`: form changes — `age` enum shifts (kitten
    vs puppy); diet profile cards swap; results card adds the new
    cat-specific warnings (taurine, arachidonic, vit A).
  - `CookingCalculator`: largely unchanged; adds a **"add taurine
    after cooking"** callout when the species is cat and the method
    is cooked (sous-vide / oven / etc.).
  - `FoodSafety`: items filtered by `species`. Default shows both
    when species = both (future).
  - `Supplements`: cat-specific top supplements promoted; AAFCO table
    uses the cat profile; transition guide uses the slower 14-day
    schedule.
  - `About`: methodology section adds the cat-specific sources
    (Zoran 2002, Pierson catinfo.org, FEDIAF cat).
- **Mascot**: PawMark already abstract (paw print). For species
  emphasis we add a small species-glyph next to the wordmark — dog
  silhouette or cat silhouette, animated swap.

---

## 6. Branding & positioning

Three options:

1. **Keep PawCook, expand quietly.** New tagline: "Real food. For your
   real best friend." Or stay as "Real food. For your real dog and cat."
   Lowest friction; brand keeps equity.
2. **Sub-brand it.** "PawCook · Dog" and "PawCook · Cat" with a shared
   chrome and the species selector as a brand element. Marginally
   more polished, marginally more design surface.
3. **Hard rebrand.** "PawCook for pets" — too vague. **Not recommended.**

Recommendation: **option 1.** Paw print is already species-agnostic;
the wordmark is universal.

---

## 7. Implementation roadmap

| Phase | Days | Output |
|---|---|---|
| 0. Research & data | 3 | `aafco-cat.json`, cat diet profiles, toxic-food species annotations, supplements list. Reviewed against AAFCO/Merck/NRC. |
| 1. Engine refactor | 3–4 | `Species` type, dispatching `calculateNutrition`, cat module with profiles + multipliers + AAFCO checks + new warnings. Vitest tests for each cat profile. |
| 2. UI: shell + selector | 2 | `SpeciesContext`, species selector in top bar, mobile sheet entry, first-run onboarding. |
| 3. UI: pages | 4–5 | All 6 pages species-aware. Cat-specific cards, copy, and warnings rendered. |
| 4. i18n | 2 | New keys (~80) translated across all 8 languages. |
| 5. Polish & launch | 2 | Cat mascot/glyph variant, screenshots, README update, deploy. |
| **Total** | **~16 working days (≈ 3 weeks)** | |

Each phase ships green CI and a working app — same model as the UI
rebuild.

---

## 8. i18n impact estimate

Approximate new keys (× 8 languages = totals shown):

- `species.dog`, `species.cat`, `species.selectPrompt`, plus
  `species.kitten`, `species.adultCat`, `species.seniorCat` → ~8 keys
  → 64 translations
- `nutrition.dietShort.{cat_cooked_carnivore, cat_pmr, …}` and
  matching `dietSub.*` → 10 keys → 80 translations
- `nutrition.warnings.{lowTaurine, lowArachidonic, lowArginine,
  vitaminAToxicity, thiamineRiskRawFish, steatitisTunaExcess}` and
  matching `notes.*` → 12 keys → 96 translations
- `supplements.cat.{taurineImportance, taurineSources, etc.}` plus
  cat-AAFCO nutrient labels → ~25 keys → 200 translations
- Page-level copy variants (where dog and cat copy diverge) → ~20
  keys → 160 translations

Rough total: **~75 new keys, ~600 translations**. Same scale as the
i18n work we just landed for the UI rebuild — mechanical but real.

---

## 9. Risks

| Risk | Mitigation |
|---|---|
| **Silent harm**: user computes a recipe deficient in taurine and feeds it long-term | Mandatory taurine warning on every cooked cat recipe; default supplement chip in result card. Onboarding mentions this explicitly. |
| User confuses species (cooks dog plan for cat) | Species selector elevated in header; recipe print-card shows species clearly; recipes opened from history remember their species. |
| Engine drift between dog and cat math | Shared test fixtures; every life stage × profile × condition has a golden-output Vitest case. |
| Translation drift for new keys | Ship English first with `// TODO i18n`, then add languages iteratively — same workflow as the UI rebuild. |
| Brand dilution | Keep wordmark, paw print, color palette; only the species glyph and the "for dogs and cats" wording diverge. |
| Cat owners expect different copy / tone | Cat-specific microcopy in onboarding and result card; tone stays consistent with the rest. |

---

## 10. Open questions to confirm before Phase 1

1. **Species detection on first load.** Show a one-screen
   "Cooking for dog / cat / both?" picker, or auto-default to "dog"
   and let the user switch? *(Recommendation: ask once — it's the
   single most important input and getting it wrong is dangerous.)*
2. **"Both"** as a state? Some users (you) feed both. Worth offering
   a "Both" mode that shows two top-tab views on the calculators,
   each with its own saved inputs? *(Recommendation: ship single-
   species first, add "both" in v2 once the species-aware engine is
   proven.)*
3. **Whole-prey profile.** Mice, day-old chicks, quail. Educationally
   important but most users won't assemble a recipe from a whole
   mouse — keep this informational only? *(Recommendation: yes,
   informational card on Diet showcase, no recipe assembly.)*
4. **Cat life-stage granularity.** AAFCO recognises growth and adult.
   AAFP recognises **six** feline life stages
   (kitten / young adult / mature adult / senior / geriatric, plus
   pregnant/lactating). Pick AAFCO's 2-stage or AAFP's finer 5-stage?
   *(Recommendation: start with AAFCO 3-state — kitten / adult /
   senior — match dog parity. AAFP granularity is v2.)*
5. **Tuna-as-staple guardrail.** Hard refuse to generate a recipe
   that is > 10 % tuna, or warn loudly? *(Recommendation: warn
   loudly with the steatitis risk explanation; some users will
   ignore guardrails if forced, so meet them where they are.)*

---

## 11. Sources

Authoritative references used to validate the numbers in this plan:

- AAFCO (2014) Dog and Cat Food Nutrient Profiles —
  <https://www.aafco.org/wp-content/uploads/2023/01/Model_Bills_and_Regulations_Agenda_Midyear_2015_Final_Attachment_A.__Proposed_revisions_to_AAFCO_Nutrient_Profiles_PFC_Final_070214.pdf>
- AAFCO Nutrient Requirements for Cats (Soul Dog Synergy reprint) —
  <https://souldogsynergy.com/wp-content/uploads/2022/06/AAFCO-Nutrient-Requirements-for-Cats.pdf>
- Merck Veterinary Manual, "Nutritional Requirements of Small
  Animals" —
  <https://www.merckvetmanual.com/management-and-nutrition/nutrition-small-animals/nutritional-requirements-of-small-animals>
- AAHA/AAFP 2021 Feline Life Stage Guidelines —
  <https://www.aaha.org/resources/2021-aaha-aafp-feline-life-stage-guidelines/nutrition-and-weight-young-adult-cats/>
- Zoran D L (2002), *The Carnivore Connection to Nutrition in
  Cats*, J Am Vet Med Assoc — foundational obligate-carnivore paper.
- Pierson L A, *Making Cat Food* —
  <https://catinfo.org/making-cat-food/>
- Feline Nutrition — Hare Today thiamine reference —
  <https://hare-today.com/feline-nutrition/nutrition/thiamine-in-a-raw-meat-diet>
- "Thiamine deficiency & fish", nutritionrvn.com —
  <https://nutritionrvn.com/2022/03/30/thiamine-deficiency-fish/>
- *The Role of Thiamine and Effects of Deficiency in Dogs and Cats*
  (PMC) — <https://pmc.ncbi.nlm.nih.gov/articles/PMC5753639/>
- FEDIAF (cat profile) — referenced via existing PawCook methodology
  page.

---

*End of plan.*
