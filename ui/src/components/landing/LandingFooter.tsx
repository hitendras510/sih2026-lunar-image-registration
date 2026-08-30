import React from 'react';

export const LandingFooter: React.FC = () => {
  return (
    <footer>
      <div className="foot-grid">
        <div>
          <b>SELENE-MATCH</b>
          <br />
          LUNAR IMAGE REGISTRATION SYSTEM
        </div>
        <div>
          CHANDRAYAAN-2 × LRO
          <br />
          OPEN-SOURCE / RESEARCH WORKBENCH
        </div>
        <div>
          <b>© 2026</b>
          <br />
          TEAM SELENE-MATCH
        </div>
      </div>
      <div className="foot-bottom">
        <span>28.5745° N · 77.2419° E / GROUND STATION</span>
        <span>BUILD v2.0 / MISSION CONTROL</span>
        <a href="#home" className="backtop">
          BACK TO TOP ↑
        </a>
      </div>
    </footer>
  );
};
