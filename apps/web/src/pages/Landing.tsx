import { Hero } from '../components/landing/hero';
import { MantraCard } from '../components/landing/mantra';
import { StatsStrip } from '../components/landing/stats-strip';
import { HouseholdToBag } from '../components/landing/household-to-bag';
import { ProductPreview } from '../components/landing/product-preview';
import { BentoGrid } from '../components/landing/bento-grid';
import { HowItWorks } from '../components/landing/how-it-works';
import { DietsShowcase } from '../components/landing/diets-showcase';
import { WhatsNew } from '../components/landing/whats-new';
import { OssCta } from '../components/landing/oss-cta';

// Section order tells the story:
//   Hero            — what is this?
//   MantraCard      — what's the philosophy? (Followability Mandate)
//   StatsStrip      — quick credibility (open source, languages, etc.)
//   HouseholdToBag  — the killer narrative: household → bag → supplements
//   ProductPreview  — the actual UI, four real-component slides
//   BentoGrid       — feature surface for the curious
//   HowItWorks      — concrete 3-step user journey
//   DietsShowcase   — power-user diet picker
//   WhatsNew        — proof of life, recent shipped work
//   OssCta          — closing GitHub call to action
//
// Stable section ids so external links and the hero secondary CTA can
// deep-link into any section by hash.
export default function Landing() {
  return (
    <div className="space-y-20 sm:space-y-28 lg:space-y-32 pb-4">
      <Hero />
      <section id="mantra"><MantraCard /></section>
      <section id="stats"><StatsStrip /></section>
      <section id="story"><HouseholdToBag /></section>
      <section id="preview"><ProductPreview /></section>
      <section id="features"><BentoGrid /></section>
      <HowItWorks />
      <section id="diets"><DietsShowcase /></section>
      <section id="whats-new"><WhatsNew /></section>
      <section id="open-source"><OssCta /></section>
    </div>
  );
}
