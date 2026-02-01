#!/usr/bin/env node
/**
 * Script to generate improved mockup templates with proper margins
 * This fixes the "garments appearing cut off" issue by adding padding
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUTPUT_SIZE = 1024;
const PADDING_PERCENT = 0.10; // 10% padding on each side means garment is 80% of frame

async function processTemplate(inputPath, outputPath, productName) {
  try {
    // Get input image metadata
    const metadata = await sharp(inputPath).metadata();
    console.log(`Processing ${productName}: ${metadata.width}x${metadata.height}`);
    
    // Calculate the new size for the garment (smaller to fit with padding)
    const garmentSize = Math.round(OUTPUT_SIZE * (1 - 2 * PADDING_PERCENT));
    const padding = Math.round(OUTPUT_SIZE * PADDING_PERCENT);
    
    // Resize the garment to fit within the padded area
    const resizedGarment = await sharp(inputPath)
      .resize(garmentSize, garmentSize, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .ensureAlpha()
      .toBuffer();
    
    // Create a white background canvas and composite the resized garment centered
    const finalImage = await sharp({
      create: {
        width: OUTPUT_SIZE,
        height: OUTPUT_SIZE,
        channels: 4,
        background: { r: 245, g: 245, b: 245, alpha: 255 } // Light gray background
      }
    })
    .composite([{
      input: resizedGarment,
      top: padding,
      left: padding
    }])
    .png()
    .toFile(outputPath);
    
    console.log(`  ✓ Created: ${path.basename(outputPath)}`);
    return true;
  } catch (error) {
    console.error(`  ✗ Error processing ${productName}: ${error.message}`);
    return false;
  }
}

async function main() {
  const inputDir = path.join(__dirname, '../public/product-templates');
  const outputDir = path.join(__dirname, '../public/mockups');
  
  // Make sure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Backup existing mockups
  const backupDir = path.join(outputDir, 'backup-' + Date.now());
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`\nBacking up existing mockups to ${backupDir}...\n`);
  
  const existingFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.png') && !f.startsWith('backup'));
  for (const file of existingFiles) {
    fs.copyFileSync(path.join(outputDir, file), path.join(backupDir, file));
  }
  
  console.log('=== Generating Improved Mockup Templates ===\n');
  
  // Template mappings - use available templates and create copies for similar products
  const templates = [
    // Front views
    { src: 'tshirt_template.png', dest: 'basketball_tshirt_mockup.png', name: 'T-Shirt Front' },
    { src: 'hoodie_template.png', dest: 'basketball_hoodie_mockup.png', name: 'Hoodie Front' },
    { src: 'hoodie_template.png', dest: 'basketball_sweatshirt_mockup.png', name: 'Sweatshirt Front' }, // Use hoodie as base
    { src: 'jersey_template.png', dest: 'basketball_jersey_mockup.png', name: 'Jersey Front' },
    { src: 'shorts_template.png', dest: 'basketball_shorts_mockup.png', name: 'Shorts Front' },
    // Back views - using same templates (flip would be ideal but for now use same)
    { src: 'tshirt_template.png', dest: 'basketball_tshirt_back_mockup.png', name: 'T-Shirt Back' },
    { src: 'hoodie_template.png', dest: 'basketball_hoodie_back_mockup.png', name: 'Hoodie Back' },
    { src: 'hoodie_template.png', dest: 'basketball_sweatshirt_back_mockup.png', name: 'Sweatshirt Back' },
    { src: 'jersey_template.png', dest: 'basketball_jersey_back_mockup.png', name: 'Jersey Back' },
    { src: 'shorts_template.png', dest: 'basketball_shorts_back_mockup.png', name: 'Shorts Back' },
    // Side views - using same templates rotated slightly would be ideal
    { src: 'tshirt_template.png', dest: 'basketball_tshirt_side_mockup.png', name: 'T-Shirt Side' },
    { src: 'hoodie_template.png', dest: 'basketball_hoodie_side_mockup.png', name: 'Hoodie Side' },
    { src: 'hoodie_template.png', dest: 'basketball_sweatshirt_side_mockup.png', name: 'Sweatshirt Side' },
    { src: 'jersey_template.png', dest: 'basketball_jersey_side_mockup.png', name: 'Jersey Side' },
    { src: 'shorts_template.png', dest: 'basketball_shorts_side_mockup.png', name: 'Shorts Side' },
  ];

  let success = 0;
  for (const template of templates) {
    const inputPath = path.join(inputDir, template.src);
    const outputPath = path.join(outputDir, template.dest);

    if (fs.existsSync(inputPath)) {
      if (await processTemplate(inputPath, outputPath, template.name)) {
        success++;
      }
    } else {
      console.log(`  ⚠ Source not found: ${template.src}`);
    }
  }

  console.log(`\n=== Complete: ${success}/${templates.length} templates processed ===`);
  console.log('\nNote: Back and side views are placeholders using front templates.');
  console.log('For production, you should replace with actual back/side view templates.');
}

main().catch(console.error);

