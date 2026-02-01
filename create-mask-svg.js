// Script to create mask SVG files for PNG mockups
// This creates simple white silhouettes that can be used as CSS masks

const fs = require('fs');
const path = require('path');

// Hoodie mask - simplified white silhouette
const hoodieMaskSVG = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Hoodie silhouette mask - solid white for masking -->
  <g>
    <!-- Main hoodie body -->
    <path d="M260,220 L300,180 L400,155 L460,145 Q512,140 564,145 L624,155 L724,180 L764,220
             L840,270 L870,360 L810,390 L760,350 L760,920 Q760,940 740,940 L284,940 Q264,940 264,920 
             L264,350 L214,390 L154,360 L184,270 Z"
          fill="white"/>
    
    <!-- Left sleeve -->
    <path d="M260,220 L184,270 L154,360 L214,390 L264,350 L264,220" 
          fill="white"/>
    
    <!-- Right sleeve -->
    <path d="M764,220 L840,270 L870,360 L810,390 L760,350 L760,220" 
          fill="white"/>
    
    <!-- Hood -->
    <path d="M380,160 Q512,120 644,160 L644,240 Q512,200 380,240 Z" 
          fill="white"/>
    
    <!-- Kangaroo pocket -->
    <path d="M360,520 L664,520 Q680,520 680,536 L680,680 Q680,696 664,696 L360,696 Q344,696 344,680 L344,536 Q344,520 360,520 Z" 
          fill="white"/>
    
    <!-- Drawstrings -->
    <circle cx="460" cy="200" r="6" fill="white"/>
    <circle cx="564" cy="200" r="6" fill="white"/>
    <path d="M460,200 L440,240" stroke="white" stroke-width="3" stroke-linecap="round"/>
    <path d="M564,200 L584,240" stroke="white" stroke-width="3" stroke-linecap="round"/>
  </g>
</svg>`;

// Hoodie back mask
const hoodieBackMaskSVG = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Hoodie back silhouette mask - solid white for masking -->
  <g>
    <!-- Main hoodie back body -->
    <path d="M260,220 L300,180 L400,155 L460,145 Q512,140 564,145 L624,155 L724,180 L764,220
             L840,270 L870,360 L810,390 L760,350 L760,920 Q760,940 740,940 L284,940 Q264,940 264,920 
             L264,350 L214,390 L154,360 L184,270 Z"
          fill="white"/>
    
    <!-- Left sleeve -->
    <path d="M260,220 L184,270 L154,360 L214,390 L264,350 L264,220" 
          fill="white"/>
    
    <!-- Right sleeve -->
    <path d="M764,220 L840,270 L870,360 L810,390 L760,350 L760,220" 
          fill="white"/>
    
    <!-- Hood back -->
    <path d="M380,160 Q512,120 644,160 L644,240 Q512,200 380,240 Z" 
          fill="white"/>
  </g>
</svg>`;

// Create the mask files
const mockupsDir = path.join(__dirname, 'public', 'mockups');

// Write hoodie mask files
fs.writeFileSync(path.join(mockupsDir, 'basketball_hoodie_mask.svg'), hoodieMaskSVG);
fs.writeFileSync(path.join(mockupsDir, 'basketball_hoodie_back_mask.svg'), hoodieBackMaskSVG);

console.log('✅ Created hoodie mask files:');
console.log('  - basketball_hoodie_mask.svg');
console.log('  - basketball_hoodie_back_mask.svg');
