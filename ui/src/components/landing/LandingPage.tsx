import React from 'react';
import { TopNav } from './TopNav';
import { HeroSection } from './HeroSection';
import { ScrollSequenceHero } from './ScrollSequenceHero';
import { MissionSection } from './MissionSection';
import { WorkflowSection } from './WorkflowSection';
import { TechnologySection } from './TechnologySection';
import { ResultsSection } from './ResultsSection';
import { LandingFooter } from './LandingFooter';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#222222] selection:bg-[#1F4E79]/20 selection:text-[#1F4E79]">
      <TopNav />
      <main className="relative z-10 space-y-6 pb-12">
        <HeroSection />
        <ScrollSequenceHero />
        <MissionSection />
        <WorkflowSection />
        <TechnologySection />
        <ResultsSection />
      </main>
      <LandingFooter />
    </div>
  );
};
