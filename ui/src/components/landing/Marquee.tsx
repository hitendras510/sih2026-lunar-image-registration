import React from 'react';

const marqueeItems = [
  'CHANDRAYAAN-2 OHRC',
  'LRO NAC',
  'TMC-2',
  'IIRS',
  'WAC',
  'PDS4',
  'GEOTIFF',
  'GDAL',
  'RASTERIO',
  'OPENCV',
  'KORNIA',
  'LIGHTGLUE',
  'MAGSAC++',
  'IC-LK',
];

export const Marquee: React.FC = () => {
  const combined = [...marqueeItems, ...marqueeItems];

  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {combined.map((item, idx) => (
          <span key={idx}>{item}</span>
        ))}
      </div>
    </div>
  );
};
