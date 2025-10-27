
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
    const logoImage = sharp(logoBuffer);
    const logoMetadata = await logoImage.metadata();

    // Calculate logo dimensions
    const logoWidth = Math.round((placement.width / 100) * mockupMetadata.width);
    const logoHeight = logoMetadata.height && logoMetadata.width
      ? Math.round((logoMetadata.height / logoMetadata.width) * logoWidth)
      : logoWidth;

    // Resize logo
    const resizedLogo = await logoImage
      .resize(logoWidth, logoHeight, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
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
