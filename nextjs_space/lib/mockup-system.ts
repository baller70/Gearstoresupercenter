// Professional Mockup System
// Photorealistic product mockups with color overlay support

export interface MockupProduct {
  id: string;
  name: string;
  category: 'tops' | 'bottoms' | 'accessories';
  description: string;
  basePrice: number;
  views: MockupView[];
  printableArea: PrintableArea;
}

export interface MockupView {
  id: string;
  name: string;
  angle: 'front' | 'back' | 'left' | 'right';
  // Base mockup image (grayscale for color overlay)
  mockupUrl: string;
  // Mask for the colorable area
  maskUrl: string;
  // Shadow/highlights overlay (multiply blend)
  shadowUrl: string;
}

export interface PrintableArea {
  // Percentages relative to mockup dimensions
  x: number;      // left position %
  y: number;      // top position %
  width: number;  // width %
  height: number; // height %
}

export interface ProductColor {
  id: string;
  name: string;
  hex: string;
  pantone?: string;
}

// Professional color palette
export const PRO_COLORS: ProductColor[] = [
  // Neutrals
  { id: 'white', name: 'White', hex: '#FFFFFF', pantone: '000 C' },
  { id: 'natural', name: 'Natural', hex: '#F5F5DC', pantone: '7527 C' },
  { id: 'silver', name: 'Silver', hex: '#C0C0C0', pantone: '877 C' },
  { id: 'heather-gray', name: 'Heather Gray', hex: '#9CA3AF', pantone: 'Cool Gray 6 C' },
  { id: 'charcoal', name: 'Charcoal', hex: '#374151', pantone: '446 C' },
  { id: 'black', name: 'Black', hex: '#1A1A1A', pantone: 'Black C' },
  // Blues
  { id: 'navy', name: 'Navy', hex: '#1E3A5F', pantone: '289 C' },
  { id: 'royal', name: 'Royal Blue', hex: '#1D4ED8', pantone: '286 C' },
  { id: 'carolina', name: 'Carolina Blue', hex: '#7BAFD4', pantone: '542 C' },
  { id: 'teal', name: 'Teal', hex: '#0D9488', pantone: '3282 C' },
  // Reds
  { id: 'red', name: 'Red', hex: '#DC2626', pantone: '485 C' },
  { id: 'maroon', name: 'Maroon', hex: '#7F1D1D', pantone: '188 C' },
  { id: 'cardinal', name: 'Cardinal', hex: '#9A1B30', pantone: '201 C' },
  { id: 'coral', name: 'Coral', hex: '#F97316', pantone: '171 C' },
  // Greens
  { id: 'forest', name: 'Forest Green', hex: '#15803D', pantone: '3425 C' },
  { id: 'kelly', name: 'Kelly Green', hex: '#22C55E', pantone: '355 C' },
  { id: 'olive', name: 'Olive', hex: '#65A30D', pantone: '377 C' },
  // Others
  { id: 'purple', name: 'Purple', hex: '#7C3AED', pantone: '2685 C' },
  { id: 'gold', name: 'Gold', hex: '#CA8A04', pantone: '124 C' },
  { id: 'orange', name: 'Orange', hex: '#EA580C', pantone: '1655 C' },
  { id: 'pink', name: 'Hot Pink', hex: '#EC4899', pantone: '806 C' },
];

// Size configurations
export interface SizeConfig {
  id: string;
  name: string;
  displayName: string;
  measurements?: Record<string, string>;
}

export const APPAREL_SIZES: SizeConfig[] = [
  { id: 'xs', name: 'XS', displayName: 'Extra Small', measurements: { chest: '32-34"', length: '26"' }},
  { id: 's', name: 'S', displayName: 'Small', measurements: { chest: '34-36"', length: '27"' }},
  { id: 'm', name: 'M', displayName: 'Medium', measurements: { chest: '38-40"', length: '28"' }},
  { id: 'l', name: 'L', displayName: 'Large', measurements: { chest: '42-44"', length: '29"' }},
  { id: 'xl', name: 'XL', displayName: 'Extra Large', measurements: { chest: '46-48"', length: '30"' }},
  { id: '2xl', name: '2XL', displayName: '2X Large', measurements: { chest: '50-52"', length: '31"' }},
  { id: '3xl', name: '3XL', displayName: '3X Large', measurements: { chest: '54-56"', length: '32"' }},
];

// Mockup products configuration
export const MOCKUP_PRODUCTS: MockupProduct[] = [
  {
    id: 'tshirt',
    name: 'Classic T-Shirt',
    category: 'tops',
    description: 'Premium 100% cotton t-shirt. Pre-shrunk, relaxed fit.',
    basePrice: 24.99,
    views: [
      { id: 'front', name: 'Front', angle: 'front', mockupUrl: '/mockups/tshirt/front.png', maskUrl: '/mockups/tshirt/front-mask.png', shadowUrl: '/mockups/tshirt/front-shadow.png' },
      { id: 'back', name: 'Back', angle: 'back', mockupUrl: '/mockups/tshirt/back.png', maskUrl: '/mockups/tshirt/back-mask.png', shadowUrl: '/mockups/tshirt/back-shadow.png' },
    ],
    printableArea: { x: 30, y: 22, width: 40, height: 50 },
  },
  {
    id: 'hoodie',
    name: 'Pullover Hoodie',
    category: 'tops',
    description: 'Fleece-lined hoodie with kangaroo pocket. 50/50 cotton-poly blend.',
    basePrice: 44.99,
    views: [
      { id: 'front', name: 'Front', angle: 'front', mockupUrl: '/mockups/hoodie/front.png', maskUrl: '/mockups/hoodie/front-mask.png', shadowUrl: '/mockups/hoodie/front-shadow.png' },
      { id: 'back', name: 'Back', angle: 'back', mockupUrl: '/mockups/hoodie/back.png', maskUrl: '/mockups/hoodie/back-mask.png', shadowUrl: '/mockups/hoodie/back-shadow.png' },
    ],
    printableArea: { x: 28, y: 30, width: 44, height: 40 },
  },
  {
    id: 'crewneck',
    name: 'Crew Neck Sweatshirt',
    category: 'tops',
    description: 'Classic crew neck with soft fleece interior. 80/20 cotton-poly.',
    basePrice: 39.99,
    views: [
      { id: 'front', name: 'Front', angle: 'front', mockupUrl: '/mockups/crewneck/front.png', maskUrl: '/mockups/crewneck/front-mask.png', shadowUrl: '/mockups/crewneck/front-shadow.png' },
      { id: 'back', name: 'Back', angle: 'back', mockupUrl: '/mockups/crewneck/back.png', maskUrl: '/mockups/crewneck/back-mask.png', shadowUrl: '/mockups/crewneck/back-shadow.png' },
    ],
    printableArea: { x: 28, y: 28, width: 44, height: 42 },
  },
  {
    id: 'longsleeve',
    name: 'Long Sleeve Shirt',
    category: 'tops',
    description: 'Comfortable long sleeve cotton shirt. Ring-spun cotton.',
    basePrice: 29.99,
    views: [
      { id: 'front', name: 'Front', angle: 'front', mockupUrl: '/mockups/longsleeve/front.png', maskUrl: '/mockups/longsleeve/front-mask.png', shadowUrl: '/mockups/longsleeve/front-shadow.png' },
      { id: 'back', name: 'Back', angle: 'back', mockupUrl: '/mockups/longsleeve/back.png', maskUrl: '/mockups/longsleeve/back-mask.png', shadowUrl: '/mockups/longsleeve/back-shadow.png' },
    ],
    printableArea: { x: 30, y: 22, width: 40, height: 50 },
  },
  {
    id: 'tank',
    name: 'Tank Top',
    category: 'tops',
    description: 'Athletic fit tank top. Moisture-wicking fabric.',
    basePrice: 22.99,
    views: [
      { id: 'front', name: 'Front', angle: 'front', mockupUrl: '/mockups/tank/front.png', maskUrl: '/mockups/tank/front-mask.png', shadowUrl: '/mockups/tank/front-shadow.png' },
      { id: 'back', name: 'Back', angle: 'back', mockupUrl: '/mockups/tank/back.png', maskUrl: '/mockups/tank/back-mask.png', shadowUrl: '/mockups/tank/back-shadow.png' },
    ],
    printableArea: { x: 28, y: 20, width: 44, height: 55 },
  },
  {
    id: 'shorts',
    name: 'Athletic Shorts',
    category: 'bottoms',
    description: 'Lightweight athletic shorts. Moisture-wicking with side pockets.',
    basePrice: 27.99,
    views: [
      { id: 'front', name: 'Front', angle: 'front', mockupUrl: '/mockups/shorts/front.png', maskUrl: '/mockups/shorts/front-mask.png', shadowUrl: '/mockups/shorts/front-shadow.png' },
      { id: 'back', name: 'Back', angle: 'back', mockupUrl: '/mockups/shorts/back.png', maskUrl: '/mockups/shorts/back-mask.png', shadowUrl: '/mockups/shorts/back-shadow.png' },
    ],
    printableArea: { x: 32, y: 15, width: 36, height: 60 },
  },
  {
    id: 'joggers',
    name: 'Jogger Sweatpants',
    category: 'bottoms',
    description: 'Comfortable joggers with elastic cuffs. French terry fleece.',
    basePrice: 34.99,
    views: [
      { id: 'front', name: 'Front', angle: 'front', mockupUrl: '/mockups/joggers/front.png', maskUrl: '/mockups/joggers/front-mask.png', shadowUrl: '/mockups/joggers/front-shadow.png' },
      { id: 'back', name: 'Back', angle: 'back', mockupUrl: '/mockups/joggers/back.png', maskUrl: '/mockups/joggers/back-mask.png', shadowUrl: '/mockups/joggers/back-shadow.png' },
    ],
    printableArea: { x: 35, y: 20, width: 30, height: 25 },
  },
];

// Helper functions
export function getProductById(id: string): MockupProduct | undefined {
  return MOCKUP_PRODUCTS.find(p => p.id === id);
}

export function getProductsByCategory(category: MockupProduct['category']): MockupProduct[] {
  return MOCKUP_PRODUCTS.filter(p => p.category === category);
}

export function getColorById(id: string): ProductColor | undefined {
  return PRO_COLORS.find(c => c.id === id);
}

// Color manipulation utilities
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

