import React from 'react';
import { TopNav } from './TopNav';
import { HeroSection } from './HeroSection';
import { ScrollSequenceHero } from './ScrollSequenceHero';
import { Marquee } from './Marquee';
import { MissionSection } from './MissionSection';
import { WorkflowSection } from './WorkflowSection';
import { TechnologySection } from './TechnologySection';
import { ResultsSection } from './ResultsSection';
import { WorkbenchCta } from './WorkbenchCta';
import { LandingFooter } from './LandingFooter';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-sky-500/30 selection:text-white">
      <TopNav />
      <main className="relative z-10 space-y-4">
        <HeroSection />
        <ScrollSequenceHero />
        <Marquee />
        <MissionSection />
        <WorkflowSection />
        <TechnologySection />
        <ResultsSection />
        <WorkbenchCta />
      </main>
      <LandingFooter />
    </div>
  );
};
