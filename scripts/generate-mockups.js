/**
 * Generate Professional Mockup Images
 * Creates SVG mockups for all garment types with consistent styling
 */

const fs = require('fs');
const path = require('path');

const mockupsDir = path.join(__dirname, '../public/mockups');

// SVG template with professional styling
const createMockupSVG = (garmentPath, viewBox = "0 0 1024 1024") => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Gradient for realistic fabric shading -->
    <linearGradient id="fabricGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f8f9fa;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#e9ecef;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#dee2e6;stop-opacity:1" />
    </linearGradient>
    <!-- Shadow gradient -->
    <linearGradient id="shadowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#000000;stop-opacity:0.05" />
      <stop offset="100%" style="stop-color:#000000;stop-opacity:0.15" />
    </linearGradient>
    <!-- Filter for soft shadows -->
    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="15" result="blur"/>
      <feOffset dx="0" dy="10" result="offsetBlur"/>
      <feFlood flood-color="#000000" flood-opacity="0.2"/>
      <feComposite in2="offsetBlur" operator="in"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="1024" height="1024" fill="#f0f0f0"/>
  
  <!-- Garment with shadow -->
  <g filter="url(#dropShadow)">
    ${garmentPath}
  </g>
</svg>`;

// T-shirt front path
const tshirtFront = `
  <path d="M320,180 L350,140 L450,120 L512,115 L574,120 L674,140 L704,180 
           L780,220 L800,300 L760,320 L720,300 L720,850 L304,850 L304,300 
           L264,320 L224,300 L244,220 Z" 
        fill="url(#fabricGradient)" stroke="#ccc" stroke-width="2"/>
  <!-- Collar -->
  <path d="M450,120 Q512,150 574,120 Q512,180 450,120" 
        fill="#e9ecef" stroke="#bbb" stroke-width="1"/>
  <!-- Sleeve seams -->
  <line x1="304" y1="300" x2="304" y2="180" stroke="#ddd" stroke-width="1"/>
  <line x1="720" y1="300" x2="720" y2="180" stroke="#ddd" stroke-width="1"/>
`;

// T-shirt back path
const tshirtBack = `
  <path d="M320,180 L350,140 L450,130 L512,125 L574,130 L674,140 L704,180 
           L780,220 L800,300 L760,320 L720,300 L720,850 L304,850 L304,300 
           L264,320 L224,300 L244,220 Z" 
        fill="url(#fabricGradient)" stroke="#ccc" stroke-width="2"/>
  <!-- Back collar -->
  <path d="M450,130 Q512,115 574,130" fill="none" stroke="#bbb" stroke-width="2"/>
`;

// Hoodie front path  
const hoodieFront = `
  <path d="M280,220 L320,160 L400,140 L450,135 L470,180 L512,200 L554,180 L574,135 
           L624,140 L704,160 L744,220 L820,260 L840,360 L780,380 L740,350 
           L740,880 L284,880 L284,350 L244,380 L184,360 L204,260 Z" 
        fill="url(#fabricGradient)" stroke="#ccc" stroke-width="2"/>
  <!-- Hood -->
  <path d="M400,140 L380,80 L420,40 L512,30 L604,40 L644,80 L624,140" 
        fill="url(#fabricGradient)" stroke="#ccc" stroke-width="2"/>
  <!-- Hood opening -->
  <ellipse cx="512" cy="180" rx="80" ry="40" fill="#444" opacity="0.8"/>
  <!-- Kangaroo pocket -->
  <path d="M340,650 Q512,680 684,650 L684,780 Q512,810 340,780 Z" 
        fill="none" stroke="#bbb" stroke-width="2"/>
  <!-- Drawstrings -->
  <line x1="470" y1="220" x2="450" y2="400" stroke="#888" stroke-width="3"/>
  <line x1="554" y1="220" x2="574" y2="400" stroke="#888" stroke-width="3"/>
`;

// Crew neck sweatshirt path
const crewneckFront = `
  <path d="M300,200 L340,160 L420,140 L512,135 L604,140 L684,160 L724,200 
           L800,250 L820,350 L770,370 L730,340 L730,880 L294,880 L294,340 
           L254,370 L204,350 L224,250 Z" 
        fill="url(#fabricGradient)" stroke="#ccc" stroke-width="2"/>
  <!-- Crew neck collar -->
  <ellipse cx="512" cy="155" rx="90" ry="25" fill="#ddd" stroke="#bbb" stroke-width="2"/>
  <!-- Ribbed cuffs and hem indicators -->
  <rect x="294" y="860" width="436" height="20" fill="#e0e0e0" rx="2"/>
`;

const products = [
  { name: 'tshirt_front', path: tshirtFront },
  { name: 'tshirt_back', path: tshirtBack },
  { name: 'hoodie_front', path: hoodieFront },
  { name: 'crewneck_front', path: crewneckFront },
];

// Generate SVG files
products.forEach(({ name, path: garmentPath }) => {
  const svg = createMockupSVG(garmentPath);
  const filepath = `${mockupsDir}/generated_${name}.svg`;
  fs.writeFileSync(filepath, svg);
  console.log(`✓ Generated ${filepath}`);
});

console.log('\nSVG mockups generated! Convert to PNG using:');
console.log('brew install librsvg && rsvg-convert -w 1024 -h 1024 file.svg > file.png');

