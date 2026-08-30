import React, { useState, useEffect } from 'react';

const bootMsgs = [
  'ESTABLISHING DOWNLINK',
  'LOADING SENSOR PROFILES',
  'CALIBRATING OPTICS',
  'SYNCING EPHEMERIS',
  'SYSTEMS NOMINAL',
];

export const BootPreloader: React.FC = () => {
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone] = useState<boolean>(false);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index++;
      setLines(bootMsgs.slice(0, index));
      if (index >= bootMsgs.length) {
        clearInterval(interval);
      }
    }, 260);

    const timer = setTimeout(() => {
      setDone(true);
    }, 1600);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div id="preloader" className={done ? 'done' : ''} aria-hidden="true">
      <div className="boot-mark" />
      <div className="boot-name">
        SELENE<b>·</b>MATCH
      </div>
      <div className="boot-lines">
        {lines.map((line, i) => (
          <div key={i} className="ok">
            ▸ {line}
          </div>
        ))}
      </div>
      <div className="boot-bar">
        <i />
      </div>
    </div>
  );
};
