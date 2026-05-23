import { Hero } from '../components/landing/hero';
import { StatsStrip } from '../components/landing/stats-strip';
import { BentoGrid } from '../components/landing/bento-grid';
import { HowItWorks } from '../components/landing/how-it-works';
import { DietsShowcase } from '../components/landing/diets-showcase';
import { OssCta } from '../components/landing/oss-cta';

export default function Landing() {
  return (
    <div className="space-y-20 sm:space-y-28 lg:space-y-32 pb-4">
      <Hero />
      <StatsStrip />
      <BentoGrid />
      <HowItWorks />
      <DietsShowcase />
      <OssCta />
    </div>
  );
}
