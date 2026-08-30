import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export const TopNav: React.FC = () => {
  const { openWorkbench } = useApp();
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav id="topnav" className={`landing-nav ${isScrolled ? 'scrolled' : ''}`}>
        <a href="#home" className="logo flex items-center gap-3">
          <div className="logo-mark" />
          <div className="font-bold tracking-wider text-sm text-white">
            SELENE-MATCH
          </div>
        </a>

        <div className="navlinks flex gap-8 text-xs font-medium tracking-wider text-slate-300">
          <a href="#home" className="nav-active">HOME</a>
          <a href="#mission">MISSION</a>
          <a href="#workflow">WORKFLOW</a>
          <a href="#technology">TECHNOLOGY</a>
          <a href="#results">RESULTS</a>
          <a href="#team">TEAM</a>
        </div>

        <div className="nav-right flex items-center gap-4">
          <button className="navcta" onClick={() => openWorkbench('dashboard')}>
            OPEN WORKBENCH ↗
          </button>
          <button
            className="burger"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Menu"
          >
            <div>
              <span />
              <span />
              <span />
            </div>
          </button>
        </div>
      </nav>

      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>
        <a href="#home" onClick={() => setMobileOpen(false)}>
          HOME
        </a>
        <a href="#mission" onClick={() => setMobileOpen(false)}>
          MISSION
        </a>
        <a href="#workflow" onClick={() => setMobileOpen(false)}>
          WORKFLOW
        </a>
        <a href="#technology" onClick={() => setMobileOpen(false)}>
          TECHNOLOGY
        </a>
        <a href="#results" onClick={() => setMobileOpen(false)}>
          RESULTS
        </a>
        <a href="#team" onClick={() => setMobileOpen(false)}>
          TEAM
        </a>
        <button
          className="mt-4 navcta w-full"
          onClick={() => {
            setMobileOpen(false);
            openWorkbench('dashboard');
          }}
        >
          OPEN WORKBENCH ↗
        </button>
      </div>
    </>
  );
};
