import { createCanvas, loadImage } from 'canvas';
import fs from 'fs/promises';

async function testMockupGeneration() {
  try {
    console.log('Testing mockup generation...');
    
    // Create canvas
    const canvas = createCanvas(1000, 1000);
    const ctx = canvas.getContext('2d');
    
    // Draw colored background (grey hoodie)
    ctx.fillStyle = '#6B7280';
    ctx.fillRect(0, 0, 1000, 1000);
    
    // Load logo
    const logo = await loadImage('/tmp/test_logo.png');
    console.log('Logo loaded successfully');
    
    // Calculate logo position (chest area: 50% x, 35% y)
    const logoWidth = 250;
    const logoHeight = (logo.height / logo.width) * logoWidth;
    const x = (1000 * 50) / 100;
    const y = (1000 * 35) / 100;
    
    // Draw logo
    ctx.drawImage(
      logo,
      x - logoWidth / 2,
      y - logoHeight / 2,
      logoWidth,
      logoHeight
    );
    
    console.log('Logo drawn successfully');
    
    // Save to file
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile('/tmp/test_mockup.png', buffer);
    console.log('Mockup saved to /tmp/test_mockup.png');
    console.log('✅ Mockup generation test PASSED!');
    
  } catch (error) {
    console.error('❌ Mockup generation test FAILED:', error);
  }
}

testMockupGeneration();
