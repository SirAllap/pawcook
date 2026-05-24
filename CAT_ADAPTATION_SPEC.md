# PawCook — Feline Support Adaptation Specification

> Source-of-truth spec authored by the project owner. Implementation
> notes folded back into this file as the rollout proceeds.

---

PawCook
Feline Support — Adaptation Specification
Version 1.0 · Draft for sirallap/pawcook
This document defines the changes required to extend PawCook from a dog-only homemade-food calculator to a species-aware tool that also supports cats. It is written as a concrete refactor plan: data model first, then calculator logic, then UI, then content, then safety guardrails.
Cats are obligate carnivores. That is not a license to feed pure meat — it is the reason cat nutrition has tighter floors and ceilings than dog nutrition, and irreversible failure modes (blindness, dilated cardiomyopathy) when those margins are missed. The application must reflect this asymmetry: cat-mode is stricter than dog-mode, not looser.

---

> **A note on rigor vs. followability** — added after the v1.0 spec.
>
> The full cat profiles described in this document (`cat_cooked_carnivore`, `cat_pmr`, etc., with their 5-component allocations including a small daily seafood slot and an organ slot) are the **rigorous ceiling**. They are not the default output the user sees in a typical multi-species household.
>
> Per the [Followability Mandate](./CLAUDE.md), a plan the owner deviates from is, by definition, less nutritious than a simpler plan they execute faithfully. PawCook's default for a multi-pet household is therefore the simple-meals mode: cats eat the same protein as the dogs, scaled to cat kcal, with a small veg portion, and the missing nutrients (taurine, preformed vit A, omega-3) are surfaced as an explicit daily supplement card — never quietly dropped.
>
> The rigorous profiles below remain available behind a "Simple meals OFF" toggle for power users and vet-supervised diets. They are the engine's capability ceiling, not its starting point. When you add new cat-specific nutritional rules, ensure both modes still satisfy AAFCO when the recommended supplement is taken with the simple meal.
>
> The blocking-failure threshold from the original spec stands: a raw cat profile with no taurine source AND no supplement opt-in is a hard stop. Everything else warns.

---
1. Architectural principle: species as the top-level fork
The current app implicitly assumes dog. Do not bolt cat support on as an option. Promote species to the root of the data model and route every downstream computation through it. The shared layer (RER formula, BCS scoring concept, batch-cooking workflow, food-safety storage guidance) stays generic. Everything nutrient-related forks.
Tree of what forks vs. what stays shared
Shared: RER formula (70 × kg^0.75), kitchen workflow, BCS 1–9 scale, storage and food-safety rules, weight tracking UI.
Forks per species: nutrient profile (minimums and maximums), MER multipliers, ingredient safety database, supplement stack, recipe templates, copy and warnings.
2. Data model changes
2.1 Pet profile schema
Add a required species discriminator to the pet profile object. Every pet record carries it, and every nutrition function takes it as its first argument.
// Before
type Pet = {
  name: string;
  weightKg: number;
  ageMonths: number;
  neutered: boolean;
  activityLevel: 'low' | 'moderate' | 'high';
  bcs?: number;
};

// After
type Species = 'dog' | 'cat';

type Pet = {
  name: string;
  species: Species;            // <- required, top-level discriminator
  weightKg: number;
  idealWeightKg?: number;      // <- for weight-loss math
  ageMonths: number;
  neutered: boolean;
  activityLevel: 'low' | 'moderate' | 'high';
  lifeStage: 'kitten_young' | 'kitten_older' | 'puppy_young' |
             'puppy_older' | 'adult' | 'senior' |
             'gestation' | 'lactation';
  bcs?: number;                // 1-9
};
2.2 Nutrient profile registry
Replace any hard-coded nutrient constants in the dog code with a lookup keyed by species and life stage. The profiles below use AAFCO 2014+ values on a dry-matter (DM) basis. FEDIAF values are within a few percent and can be added as an alternate profile flag if you want EU compliance.
Nutrient (DM basis)
Dog adult
Cat adult
Cat growth
Crude protein (min)
18%
26%
30%
Crude fat (min)
5.5%
9%
9%
Taurine (dry, min)
Not required
0.10%
0.10%
Taurine (wet, min)
Not required
0.20%
0.20%
Arginine (min)
0.51%
1.04%
1.24%
Arachidonic acid
Not required
0.02%
0.02%
Vitamin A (min)
5,000 IU/kg
3,332 IU/kg
6,668 IU/kg
Vitamin A (max)
250,000 IU/kg
333,300 IU/kg
333,300 IU/kg
Niacin (min)
13.6 mg/kg
60 mg/kg
60 mg/kg
Calcium : Phosphorus
1:1 to 2:1
1:1 to 1.5:1
1:1 to 1.5:1

// /src/data/nutrientProfiles.ts
export const PROFILES = {
  dog: {
    adult: {
      proteinMinPct: 18, fatMinPct: 5.5,
      taurineMinPct: null, arachidonicAcidMinPct: null,
      vitAMinIU_per_kg: 5000, vitAMaxIU_per_kg: 250000,
      calciumPhosphorusRatio: [1.0, 2.0],
    },
    growth: { proteinMinPct: 22.5, fatMinPct: 8.5, /* ... */ },
  },
  cat: {
    adult: {
      proteinMinPct: 26, fatMinPct: 9,
      taurineMinPct_dry: 0.10, taurineMinPct_wet: 0.20,
      arginineMinPct: 1.04, arachidonicAcidMinPct: 0.02,
      vitAMinIU_per_kg: 3332, vitAMaxIU_per_kg: 333300,
      niacinMin_mg_per_kg: 60,
      calciumPhosphorusRatio: [1.0, 1.5],
    },
    growth: { proteinMinPct: 30, /* ... */ },
  },
} as const;
2.3 Ingredient database extensions
Each ingredient record needs per-species safety flags and notes. A flag that reads true for dogs may not for cats and vice versa.
type Ingredient = {
  id: string;
  name: string;
  kcalPer100g: number;
  proteinPct: number;
  fatPct: number;
  // ... existing nutrient fields

  safety: {
    dog: 'safe' | 'caution' | 'forbidden';
    cat: 'safe' | 'caution' | 'forbidden';
  };
  notes: {
    dog?: string;
    cat?: string;
  };
  // Optional: hard caps for ingredients with toxicity ceilings
  maxPctOfDailyCalories?: { dog?: number; cat?: number };
};

// Example: liver
{
  id: 'liver_chicken',
  name: 'Chicken liver, cooked',
  safety: { dog: 'caution', cat: 'caution' },
  notes: {
    dog: 'Rich in vitamin A. Cap at ~5% of diet to avoid hypervitaminosis A.',
    cat: 'Required source of pre-formed vitamin A, but ceiling is strict. Cap at ~5g/day for a 4kg cat.',
  },
  maxPctOfDailyCalories: { dog: 5, cat: 5 },
}
3. Calculator logic
3.1 RER stays the same; MER multipliers fork
RER = 70 × (weight_kg)^0.75 is universal across species. The maintenance multiplier is where dogs and cats diverge significantly. Cat multipliers are uniformly lower because cats have lower thermogenic capacity and most pet cats are indoor and neutered.
Life stage / status
Dog factor
Cat factor
Neutered adult
1.6 × RER
1.2 × RER
Intact adult
1.8 × RER
1.4 × RER
Inactive / overweight prone
1.2–1.4 × RER
1.0 × RER
Weight loss
1.0 × RER (of ideal wt)
0.8–1.0 × RER (of ideal wt)
Weight gain
1.2–1.8 × RER
1.2–1.4 × RER
Growth (young)
3.0 × RER
2.5 × RER
Growth (older puppy/kitten)
2.0 × RER
2.0 × RER
Gestation
1.6–2.0 × RER
1.6–2.0 × RER
Lactation
2.0–6.0 × RER
2.0–6.0 × RER

function calculateRER(weightKg: number): number {
  return 70 * Math.pow(weightKg, 0.75);
}

function getMERFactor(pet: Pet): number {
  const table = MER_FACTORS[pet.species];
  // Resolve by life stage + neuter + goal
  if (pet.lifeStage === 'kitten_young' || pet.lifeStage === 'puppy_young') return table.growthYoung;
  if (pet.lifeStage === 'lactation') return table.lactation;
  if (pet.lifeStage === 'gestation') return table.gestation;
  if (pet.weightGoal === 'loss')      return table.weightLoss;
  if (pet.weightGoal === 'gain')      return table.weightGain;
  return pet.neutered ? table.neuteredAdult : table.intactAdult;
}

function calculateMER(pet: Pet): number {
  const weightForRER = pet.weightGoal === 'loss' && pet.idealWeightKg
    ? pet.idealWeightKg
    : pet.weightKg;
  return calculateRER(weightForRER) * getMERFactor(pet);
}
3.2 Recipe validator: minimums AND maximums
The dog validator likely checks lower bounds (enough protein, enough calcium). The cat validator must also check upper bounds for vitamin A and ensure mandatory feline-specific nutrients are present. A recipe that passes the dog validator can fail the cat validator for reasons that have no analog in dog food.
function validateRecipe(recipe: Recipe, pet: Pet): ValidationResult {
  const profile = PROFILES[pet.species][lifeStageBucket(pet)];
  const analysis = analyzeRecipe(recipe);
  const issues: Issue[] = [];

  // Universal checks
  if (analysis.proteinPct < profile.proteinMinPct)
    issues.push({ level: 'error', msg: `Protein below ${profile.proteinMinPct}% DM` });

  // Cat-only checks
  if (pet.species === 'cat') {
    if (!analysis.hasTaurineSource)
      issues.push({ level: 'critical', msg: 'No taurine source. Cooking destroys taurine — supplement required.' });
    if (!analysis.hasArachidonicAcidSource)
      issues.push({ level: 'critical', msg: 'No arachidonic acid source. Add animal fat or egg yolk.' });
    if (analysis.vitAIU_per_kg > profile.vitAMaxIU_per_kg)
      issues.push({ level: 'error', msg: 'Vitamin A above safe ceiling. Reduce liver.' });
    if (analysis.arginineMinPct < profile.arginineMinPct)
      issues.push({ level: 'critical', msg: 'Arginine too low — acute hyperammonemia risk.' });
  }

  return { issues, passed: !issues.some(i => i.level !== 'warning') };
}
4. UI and UX changes
4.1 Species selector as first-screen step
Add a species selection step before any pet detail entry. Two large tap targets, dog and cat, each with a one-line description. This sets context for every subsequent screen — copy, ingredient suggestions, supplement prompts, and warnings all read from species.
Onboarding order: species → name → weight & age → neuter status → activity → goal.
Allow multi-pet households with mixed species. Profile switcher in the header shows a small dog/cat icon next to each pet.
Persist species to local storage with the rest of the profile. Migration path: existing profiles default to dog and prompt confirmation on next open.
4.2 Cat-mode warning surfaces
The cat flow shows three warnings the dog flow does not. These are not legalese — they are functional content the user should read once and the app should reinforce contextually.
Taurine warning on the supplement screen: cooking destroys taurine, supplementation is non-optional, deficiency signs (blindness, heart failure) can take 6–24 months to appear so the absence of symptoms means nothing.
Vitamin A ceiling on any recipe that includes liver: show grams of liver per day and the calculated IU. Color-code: green under 5 g/day for a 4 kg cat, amber 5–10 g, red above.
Formulation honesty on the final recipe screen: a clear note that homemade cat diets have a thinner margin for error than dog diets, with a link to vet-formulated premix options (see §6.2).
4.3 Ingredient picker behavior
When species is cat, the ingredient list reorders. Animal proteins float to the top. Plant proteins (lentils, chickpeas, soy) are filterable but tagged as not nutritionally meaningful for cats. Vegetables are shown as low-value bulking ingredients only, capped at a small percentage of the recipe.
Forbidden ingredients for the selected species are visually disabled with a tap-to-explain interaction.
Caution ingredients display an inline note next to the quantity field rather than only on commit.
Add a cat-specific quick-add panel: muscle meat, organ meat (with cap), egg yolk, fish oil, taurine, calcium source. These six cover most balanced recipes.
5. Content and copy changes
5.1 Forbidden / caution ingredient matrix
Replace any single forbidden-foods list with a per-species matrix. The overlap is large but the asymmetries matter — onion is fatal for both but cats are 3–5× more sensitive; raw fish is fine occasionally for dogs but causes thiamine deficiency in cats; dog food is non-toxic but lethally inadequate for cats long-term.
Ingredient
Dog
Cat
Onion / garlic / chives / leeks
Toxic
Toxic (3–5× more sensitive)
Chocolate / cocoa
Toxic
Toxic
Grapes / raisins
Toxic
Toxic
Xylitol
Severely toxic
Lower risk but avoid
Macadamia nuts
Toxic
Avoid
Alcohol / caffeine
Toxic
Toxic
Raw fish
Generally OK cooked
Thiaminase → B1 deficiency, neuro damage
Tuna (human-grade) as staple
Avoid frequent
Mercury + steatitis from PUFA / low vit E
Liver as staple
Vit A toxicity risk
Vit A toxicity risk (stricter ceiling)
Raw egg whites
Avidin binds biotin
Avidin binds biotin
Cooked bones
Splinter risk
Splinter risk
Dog food (long-term)
N/A
Fatal: no taurine, no vit A, no AA
Plant-only diet
Possible with formulation
Incompatible with feline metabolism
5.2 Mandatory supplement stack (cat mode)
The single biggest failure mode of homemade cat food is undersupplementation. The app must present this not as an optional add-on but as a default checklist on every cat recipe. If the user wants a balanced cooked diet, these are not negotiable.
Supplement
Daily target (4 kg cat)
Why it is mandatory
Taurine
250–500 mg
Cats cannot synthesize. Deficiency → DCM, blindness. Cooking destroys some, so dose above minimum.
Calcium (eggshell or bone meal)
~900–1,100 mg
Meat is Ca:P ≈ 1:20. Without supplementation → nutritional secondary hyperparathyroidism.
Vitamin E
10–30 IU
Required when feeding fish oil or high PUFA. Prevents steatitis.
B-complex (incl. thiamine, B6, niacin)
Per product label
Water-soluble, lost in cooking water. Cats need ~4× the niacin dogs do.
Iodine (kelp or iodized salt)
0.1–0.2 mg
Thyroid function. Not present in muscle meat alone.
EPA + DHA (fish oil)
75–150 mg combined
Skin, coat, anti-inflammatory. Pair with vitamin E.
Pre-formed vitamin A
From liver, capped
Cats cannot use beta-carotene. Use ~5–10 g liver/day, never more.
Arachidonic acid
From animal fat / egg yolk
Cats lack delta-6-desaturase. Plant oils do not substitute.

If the user prefers a single-product approach, point them to a complete premix designed for homemade feline diets. The two formulations veterinary nutritionists most commonly endorse are Balance IT Feline (UC Davis spinoff) and EZ Complete Fur Cats. Surface these by name in the supplement screen with the disclaimer that PawCook is not affiliated.
5.3 Tone of cat-mode copy
Cat-mode copy should be slightly more cautious than dog-mode copy. Not alarmist — accurate. Use phrases like “required”, “must include”, and “strict ceiling” rather than “recommended” and “consider”. The threshold for surfacing a veterinary-consult prompt should be lower in cat mode: any senior, kitten, gestating, lactating, or chronically ill cat should trigger a prominent suggestion to formulate with a veterinary nutritionist rather than relying on the calculator alone.
6. Safety guardrails
6.1 Hard blocks the app should refuse to compute
Some inputs should not produce a recipe at all, only an explanation and a redirect.
Cat recipe with zero animal protein — refuse, explain obligate carnivory.
Cat recipe with no taurine source and no taurine supplement — refuse, prompt to add.
Cat recipe where liver exceeds 10% of daily calories — refuse, vitamin A toxicity.
Cat recipe where raw fish is a staple ingredient — refuse, thiaminase warning.
Any recipe attempting to feed dog food to a cat or feline-formulated food to a dog long-term — warning banner.
6.2 Vet-nutritionist escalation paths
Build a visible escape hatch from DIY mode. Provide three named alternatives so the user understands the app has limits.
BalanceIT.com — recipe formulation service plus premixes, dog and cat.
PetDiets.com — board-certified veterinary nutritionist consults.
ACVN.org — directory of board-certified vet nutritionists by region.
6.3 Disclaimers
Keep them short, place them where they matter rather than in a wall of legal text. A one-line disclaimer at the bottom of the final recipe screen is enough, provided the in-context warnings throughout the flow have done their job.
Suggested wording: “PawCook generates nutritionally targeted recipes from public guidelines (AAFCO, NRC, FEDIAF). It is not a substitute for veterinary nutritional formulation, especially for kittens, seniors, pregnant or lactating queens, and cats with chronic disease.”
7. Migration and rollout plan
Phase 1 — Data layer: add species to Pet schema with default 'dog' for back-compat. Ship nutrient profile registry and per-species ingredient flags. No UI change yet.
Phase 2 — Calculator: fork MER multipliers, add cat-specific validators behind a feature flag. Run existing dog recipes through new code path to confirm zero regression.
Phase 3 — UI: add species selector to onboarding, retrofit profile switcher, add cat-mode warnings and supplement stack screen.
Phase 4 — Content: write cat copy, build cat recipe templates (3–5 starter recipes vetted against the validator), update marketing copy on the landing page.
Phase 5 — Public release: flip the feature flag, announce. Keep a feedback channel open for the first 60 days — homemade cat diets are where users are most likely to surface edge cases.
8. Acceptance tests
The following cases should be covered by automated tests before the cat feature is considered shippable.
Neutered 4 kg adult cat → RER ≈ 217 kcal, MER ≈ 260 kcal (1.2×).
Intact 4 kg adult cat → MER ≈ 304 kcal (1.4×).
5-month-old 2.5 kg kitten → MER ≈ 314 kcal (2.0× of RER 157).
Recipe of 100% chicken breast for cat → validator fails on: taurine missing, arachidonic acid missing, Ca:P inverted, vitamin A missing.
Recipe of 80% chicken + 5% liver + 5% egg yolk + taurine + eggshell + fish oil + B-complex for adult cat → validator passes.
Same balanced cat recipe fed to a dog → validator should still pass dog profile, possibly with a note that protein is higher than necessary.
Dog recipe (40% rice + 30% chicken + vegetables) fed to a cat → validator hard-blocks: protein on DM basis likely below 26%, no taurine, no AA, carbohydrate too high.
End of specification. Questions, gaps, or implementation pushback should be tracked as issues against the PawCook repository.
