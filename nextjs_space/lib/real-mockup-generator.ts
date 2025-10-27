
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

interface LogoPlacement {
  x: number; // percentage from left
  y: number; // percentage from top
  width: number; // percentage of mockup width
  rotation?: number;
}

interface MockupConfig {
  name: string;
  imagePath: string;
  defaultPlacement: LogoPlacement;
}

const MOCKUP_CONFIGS: Record<string, MockupConfig> = {
  // Front views
  'basketball-tshirt': {
    name: 'Basketball T-Shirt',
    imagePath: 'public/mockups/basketball_tshirt_mockup.png',
    defaultPlacement: { x: 50, y: 35, width: 20 }
  },
  'basketball-hoodie': {
    name: 'Basketball Hoodie',
    imagePath: 'public/mockups/basketball_hoodie_mockup.png',
    defaultPlacement: { x: 50, y: 35, width: 18 }
  },
  'basketball-sweatshirt': {
    name: 'Basketball Sweatshirt',
    imagePath: 'public/mockups/basketball_sweatshirt_mockup.png',
    defaultPlacement: { x: 50, y: 35, width: 18 }
  },
  'basketball-jersey': {
    name: 'Basketball Jersey',
    imagePath: 'public/mockups/basketball_jersey_mockup.png',
    defaultPlacement: { x: 50, y: 40, width: 22 }
  },
  'basketball-shorts': {
    name: 'Basketball Shorts',
    imagePath: 'public/mockups/basketball_shorts_mockup.png',
    defaultPlacement: { x: 50, y: 25, width: 15 }
  },
  
  // Back views
  'basketball-tshirt-back': {
    name: 'Basketball T-Shirt (Back)',
    imagePath: 'public/mockups/basketball_tshirt_back_mockup.png',
    defaultPlacement: { x: 50, y: 35, width: 20 }
  },
  'basketball-hoodie-back': {
    name: 'Basketball Hoodie (Back)',
    imagePath: 'public/mockups/basketball_hoodie_back_mockup.png',
    defaultPlacement: { x: 50, y: 35, width: 18 }
  },
  'basketball-sweatshirt-back': {
    name: 'Basketball Sweatshirt (Back)',
    imagePath: 'public/mockups/basketball_sweatshirt_back_mockup.png',
    defaultPlacement: { x: 50, y: 35, width: 18 }
  },
  'basketball-jersey-back': {
    name: 'Basketball Jersey (Back)',
    imagePath: 'public/mockups/basketball_jersey_back_mockup.png',
    defaultPlacement: { x: 50, y: 40, width: 22 }
  },
  'basketball-shorts-back': {
    name: 'Basketball Shorts (Back)',
    imagePath: 'public/mockups/basketball_shorts_back_mockup.png',
    defaultPlacement: { x: 50, y: 25, width: 15 }
  },
  
  // Side views
  'basketball-tshirt-side': {
    name: 'Basketball T-Shirt (Side)',
    imagePath: 'public/mockups/basketball_tshirt_side_mockup.png',
    defaultPlacement: { x: 50, y: 35, width: 15 }
  },
  'basketball-hoodie-side': {
    name: 'Basketball Hoodie (Side)',
    imagePath: 'public/mockups/basketball_hoodie_side_mockup.png',
    defaultPlacement: { x: 50, y: 35, width: 13 }
  },
  'basketball-sweatshirt-side': {
    name: 'Basketball Sweatshirt (Side)',
    imagePath: 'public/mockups/basketball_sweatshirt_side_mockup.png',
    defaultPlacement: { x: 50, y: 35, width: 13 }
  },
  'basketball-jersey-side': {
    name: 'Basketball Jersey (Side)',
    imagePath: 'public/mockups/basketball_jersey_side_mockup.png',
    defaultPlacement: { x: 50, y: 40, width: 16 }
  },
  'basketball-shorts-side': {
    name: 'Basketball Shorts (Side)',
    imagePath: 'public/mockups/basketball_shorts_side_mockup.png',
    defaultPlacement: { x: 50, y: 25, width: 12 }
  }
};

export async function generateMockupWithLogo(
  logoPath: string,
  mockupType: string,
  customPlacement?: Partial<LogoPlacement>,
  outputPath?: string
): Promise<string> {
  try {
    const config = MOCKUP_CONFIGS[mockupType];
    if (!config) {
      throw new Error(`Unknown mockup type: ${mockupType}`);
    }

    // Merge custom placement with defaults
    const placement: LogoPlacement = {
      ...config.defaultPlacement,
      ...customPlacement
    };

    // Load mockup image
    const mockupFullPath = path.join(process.cwd(), config.imagePath);
    const mockupBuffer = await fs.promises.readFile(mockupFullPath);
    const mockupImage = sharp(mockupBuffer);
    const mockupMetadata = await mockupImage.metadata();

    if (!mockupMetadata.width || !mockupMetadata.height) {
      throw new Error('Could not read mockup dimensions');
    }

    // Load and process logo
    const logoBuffer = await fs.promises.readFile(logoPath);
    let logoImage = sharp(logoBuffer);
    const logoMetadata = await logoImage.metadata();

    // Remove white background and make it transparent
    // This uses a more aggressive threshold approach to remove near-white pixels
    const processedLogoBuffer = await logoImage
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const { data, info } = processedLogoBuffer;
    const channels = info.channels;
    
    // Process pixels to remove white background with aggressive threshold
    for (let i = 0; i < data.length; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // More aggressive threshold: remove pixels that are light gray to white (>220)
      // Also handle partial transparency - make light pixels progressively transparent
      if (r > 220 && g > 220 && b > 220) {
        const brightness = (r + g + b) / 3;
        // Full transparency for very bright pixels (>245)
        if (brightness > 245) {
          data[i + 3] = 0;
        }
        // Partial transparency for lighter pixels (220-245)
        else {
          const alpha = Math.max(0, ((245 - brightness) / 25) * 255);
          data[i + 3] = Math.min(data[i + 3], alpha);
        }
      }
    }
    
    // Create sharp image from processed buffer
    logoImage = sharp(data, {
      raw: {
        width: info.width,
        height: info.height,
        channels: channels
      }
    });

    // Calculate logo dimensions
    const logoWidth = Math.round((placement.width / 100) * mockupMetadata.width);
    const logoHeight = logoMetadata.height && logoMetadata.width
      ? Math.round((logoMetadata.height / logoMetadata.width) * logoWidth)
      : logoWidth;

    // Resize logo
    const resizedLogo = await logoImage
      .resize(logoWidth, logoHeight, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    // Calculate position
    const left = Math.round((placement.x / 100) * mockupMetadata.width - logoWidth / 2);
    const top = Math.round((placement.y / 100) * mockupMetadata.height - logoHeight / 2);

    // Composite logo onto mockup
    const compositedImage = await mockupImage
      .composite([
        {
          input: resizedLogo,
          top,
          left,
          blend: 'over'
        }
      ])
      .png()
      .toBuffer();

    // Save to output path or temp location
    const finalOutputPath = outputPath || path.join(
      process.cwd(),
      'public/generated-mockups',
      `${mockupType}-${Date.now()}.png`
    );

    // Ensure output directory exists
    const outputDir = path.dirname(finalOutputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    await fs.promises.writeFile(finalOutputPath, compositedImage);

    return finalOutputPath;
  } catch (error) {
    console.error('Error generating mockup:', error);
    throw error;
  }
}

export async function generateAllMockups(
  logoPath: string,
  customPlacements?: Record<string, Partial<LogoPlacement>>
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  for (const [mockupType, config] of Object.entries(MOCKUP_CONFIGS)) {
    try {
      const placement = customPlacements?.[mockupType];
      const outputPath = await generateMockupWithLogo(logoPath, mockupType, placement);
      results[mockupType] = outputPath;
    } catch (error) {
      console.error(`Failed to generate ${mockupType}:`, error);
    }
  }

  return results;
}

export function getMockupTypes(): string[] {
  return Object.keys(MOCKUP_CONFIGS);
}

export function getMockupConfig(type: string): MockupConfig | undefined {
  return MOCKUP_CONFIGS[type];
}
