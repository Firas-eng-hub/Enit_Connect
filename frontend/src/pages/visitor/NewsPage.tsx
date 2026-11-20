import { PartnerLogoMarquee } from '@/features/partners';
import { CompaniesBand, FinalCta, HowItWorks, LandingHero, TaglineReveal } from './landing';
import { NewsSection } from './news/NewsSection';

/** Visitor landing page (route /visitor/news): pitch, proof, how it works, then school news. */
export function NewsPage() {
  return (
    <div className="landing">
      <LandingHero />
      <PartnerLogoMarquee />
      <HowItWorks />
      <TaglineReveal />
      <CompaniesBand />
      <NewsSection />
      <FinalCta />
    </div>
  );
}
