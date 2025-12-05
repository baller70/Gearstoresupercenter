// Product Templates Configuration
// Pre-loaded templates for merchandise customization

export interface PrintArea {
  name: string;
  x: number; // percentage from left
  y: number; // percentage from top
  width: number; // percentage of template width
  height: number; // percentage of template height
  maxDPI: number;
}

export interface ProductView {
  id: string;
  name: string;
  angle: 'front' | 'back' | 'left' | 'right';
  templatePath: string;
  printAreas: PrintArea[];
}

export interface ProductColor {
  id: string;
  name: string;
  hex: string;
  category: 'basics' | 'team' | 'vibrant';
}

export interface SizeOption {
  id: string;
  name: string;
  chest?: string; // in inches
  length?: string;
  waist?: string;
}

export interface ProductTemplate {
  id: string;
  name: string;
  category: 'tops' | 'bottoms' | 'accessories';
  description: string;
  basePrice: number;
  views: ProductView[];
  availableColors: ProductColor[];
  availableSizes: SizeOption[];
  printAreas: PrintArea[];
  defaultPrintArea: string;
  tags: string[];
}

// Standard colors available for all products
export const STANDARD_COLORS: ProductColor[] = [
  // Basics
  { id: 'white', name: 'White', hex: '#FFFFFF', category: 'basics' },
  { id: 'black', name: 'Black', hex: '#1A1A1A', category: 'basics' },
  { id: 'navy', name: 'Navy', hex: '#1E3A5F', category: 'basics' },
  { id: 'gray', name: 'Heather Gray', hex: '#9CA3AF', category: 'basics' },
  { id: 'charcoal', name: 'Charcoal', hex: '#374151', category: 'basics' },
  // Team Colors
  { id: 'red', name: 'Team Red', hex: '#DC2626', category: 'team' },
  { id: 'royal', name: 'Royal Blue', hex: '#1D4ED8', category: 'team' },
  { id: 'green', name: 'Forest Green', hex: '#15803D', category: 'team' },
  { id: 'purple', name: 'Purple', hex: '#7C3AED', category: 'team' },
  { id: 'orange', name: 'Orange', hex: '#EA580C', category: 'team' },
  { id: 'maroon', name: 'Maroon', hex: '#7F1D1D', category: 'team' },
  { id: 'gold', name: 'Gold', hex: '#CA8A04', category: 'team' },
  // Vibrant
  { id: 'pink', name: 'Hot Pink', hex: '#EC4899', category: 'vibrant' },
  { id: 'cyan', name: 'Cyan', hex: '#06B6D4', category: 'vibrant' },
  { id: 'lime', name: 'Lime', hex: '#84CC16', category: 'vibrant' },
];

// Standard sizes for apparel
export const STANDARD_SIZES: SizeOption[] = [
  { id: 'xs', name: 'XS', chest: '32-34', length: '26' },
  { id: 's', name: 'S', chest: '34-36', length: '27' },
  { id: 'm', name: 'M', chest: '38-40', length: '28' },
  { id: 'l', name: 'L', chest: '42-44', length: '29' },
  { id: 'xl', name: 'XL', chest: '46-48', length: '30' },
  { id: '2xl', name: '2XL', chest: '50-52', length: '31' },
  { id: '3xl', name: '3XL', chest: '54-56', length: '32' },
];

// Youth sizes
export const YOUTH_SIZES: SizeOption[] = [
  { id: 'ys', name: 'Youth S', chest: '26-28', length: '19' },
  { id: 'ym', name: 'Youth M', chest: '28-30', length: '21' },
  { id: 'yl', name: 'Youth L', chest: '30-32', length: '23' },
  { id: 'yxl', name: 'Youth XL', chest: '32-34', length: '25' },
];

// Bottoms sizes
export const BOTTOMS_SIZES: SizeOption[] = [
  { id: 'xs', name: 'XS', waist: '26-28' },
  { id: 's', name: 'S', waist: '28-30' },
  { id: 'm', name: 'M', waist: '30-32' },
  { id: 'l', name: 'L', waist: '32-34' },
  { id: 'xl', name: 'XL', waist: '34-36' },
  { id: '2xl', name: '2XL', waist: '36-38' },
];

// Sock sizes
export const SOCK_SIZES: SizeOption[] = [
  { id: 'sm', name: 'S/M (6-9)', chest: '6-9' },
  { id: 'lg', name: 'L/XL (9-12)', chest: '9-12' },
];

// Standard print areas for upper body garments
const STANDARD_UPPER_PRINT_AREAS: PrintArea[] = [
  { name: 'Front Center', x: 50, y: 40, width: 30, height: 35, maxDPI: 300 },
  { name: 'Front Left Chest', x: 25, y: 25, width: 15, height: 15, maxDPI: 300 },
  { name: 'Back Center', x: 50, y: 35, width: 35, height: 40, maxDPI: 300 },
  { name: 'Back Upper', x: 50, y: 20, width: 25, height: 15, maxDPI: 300 },
];

// Print areas for bottoms
const BOTTOMS_PRINT_AREAS: PrintArea[] = [
  { name: 'Left Leg', x: 30, y: 40, width: 15, height: 20, maxDPI: 300 },
  { name: 'Right Leg', x: 70, y: 40, width: 15, height: 20, maxDPI: 300 },
];

// Sock print areas
const SOCK_PRINT_AREAS: PrintArea[] = [
  { name: 'Calf Area', x: 50, y: 30, width: 40, height: 30, maxDPI: 300 },
];

// ========================================
// PRODUCT TEMPLATES
// ========================================

export const PRODUCT_TEMPLATES: ProductTemplate[] = [
  // T-SHIRTS
  {
    id: 'tshirt',
    name: 'Classic T-Shirt',
    category: 'tops',
    description: 'Premium cotton t-shirt with a relaxed fit. Perfect for everyday wear and custom designs.',
    basePrice: 24.99,
    views: [
      { id: 'tshirt-front', name: 'Front', angle: 'front', templatePath: '/templates/tshirt-front.svg', printAreas: STANDARD_UPPER_PRINT_AREAS },
      { id: 'tshirt-back', name: 'Back', angle: 'back', templatePath: '/templates/tshirt-back.svg', printAreas: STANDARD_UPPER_PRINT_AREAS },
    ],
    availableColors: STANDARD_COLORS,
    availableSizes: [...YOUTH_SIZES, ...STANDARD_SIZES],
    printAreas: STANDARD_UPPER_PRINT_AREAS,
    defaultPrintArea: 'Front Center',
    tags: ['t-shirt', 'casual', 'unisex', 'cotton'],
  },

  // SWEATSHIRTS (HOODIE)
  {
    id: 'hoodie',
    name: 'Pullover Hoodie',
    category: 'tops',
    description: 'Cozy fleece-lined hoodie with kangaroo pocket. Great for layering and team events.',
    basePrice: 44.99,
    views: [
      { id: 'hoodie-front', name: 'Front', angle: 'front', templatePath: '/templates/hoodie-front.svg', printAreas: STANDARD_UPPER_PRINT_AREAS },
      { id: 'hoodie-back', name: 'Back', angle: 'back', templatePath: '/templates/hoodie-back.svg', printAreas: STANDARD_UPPER_PRINT_AREAS },
    ],
    availableColors: STANDARD_COLORS,
    availableSizes: [...YOUTH_SIZES, ...STANDARD_SIZES],
    printAreas: STANDARD_UPPER_PRINT_AREAS,
    defaultPrintArea: 'Front Center',
    tags: ['hoodie', 'sweatshirt', 'warm', 'fleece'],
  },

  // CREW NECK SWEATSHIRT
  {
    id: 'crewneck',
    name: 'Crew Neck Sweatshirt',
    category: 'tops',
    description: 'Classic crew neck sweatshirt with soft fleece interior. Perfect for cool weather.',
    basePrice: 39.99,
    views: [
      { id: 'crewneck-front', name: 'Front', angle: 'front', templatePath: '/templates/crewneck-front.svg', printAreas: STANDARD_UPPER_PRINT_AREAS },
      { id: 'crewneck-back', name: 'Back', angle: 'back', templatePath: '/templates/crewneck-back.svg', printAreas: STANDARD_UPPER_PRINT_AREAS },
    ],
    availableColors: STANDARD_COLORS,
    availableSizes: [...YOUTH_SIZES, ...STANDARD_SIZES],
    printAreas: STANDARD_UPPER_PRINT_AREAS,
    defaultPrintArea: 'Front Center',
    tags: ['crewneck', 'sweatshirt', 'classic', 'fleece'],
  },

  // LONG SLEEVE SHIRT
  {
    id: 'longsleeve',
    name: 'Long Sleeve Shirt',
    category: 'tops',
    description: 'Comfortable long sleeve cotton shirt. Ideal for fall sports and casual wear.',
    basePrice: 29.99,
    views: [
      { id: 'longsleeve-front', name: 'Front', angle: 'front', templatePath: '/templates/longsleeve-front.svg', printAreas: STANDARD_UPPER_PRINT_AREAS },
      { id: 'longsleeve-back', name: 'Back', angle: 'back', templatePath: '/templates/longsleeve-back.svg', printAreas: STANDARD_UPPER_PRINT_AREAS },
    ],
    availableColors: STANDARD_COLORS,
    availableSizes: [...YOUTH_SIZES, ...STANDARD_SIZES],
    printAreas: STANDARD_UPPER_PRINT_AREAS,
    defaultPrintArea: 'Front Center',
    tags: ['long-sleeve', 'cotton', 'casual'],
  },

  // SWEATPANTS
  {
    id: 'sweatpants',
    name: 'Jogger Sweatpants',
    category: 'bottoms',
    description: 'Comfortable jogger sweatpants with elastic cuffs. Perfect for warm-ups and lounging.',
    basePrice: 34.99,
    views: [
      { id: 'sweatpants-front', name: 'Front', angle: 'front', templatePath: '/templates/sweatpants-front.svg', printAreas: BOTTOMS_PRINT_AREAS },
      { id: 'sweatpants-back', name: 'Back', angle: 'back', templatePath: '/templates/sweatpants-back.svg', printAreas: BOTTOMS_PRINT_AREAS },
    ],
    availableColors: STANDARD_COLORS.filter(c => ['white', 'black', 'navy', 'gray', 'charcoal'].includes(c.id)),
    availableSizes: BOTTOMS_SIZES,
    printAreas: BOTTOMS_PRINT_AREAS,
    defaultPrintArea: 'Left Leg',
    tags: ['sweatpants', 'joggers', 'bottoms', 'warm'],
  },

  // SHORTS
  {
    id: 'shorts',
    name: 'Athletic Shorts',
    category: 'bottoms',
    description: 'Lightweight athletic shorts with moisture-wicking fabric. Great for training.',
    basePrice: 27.99,
    views: [
      { id: 'shorts-front', name: 'Front', angle: 'front', templatePath: '/templates/shorts-front.svg', printAreas: BOTTOMS_PRINT_AREAS },
      { id: 'shorts-back', name: 'Back', angle: 'back', templatePath: '/templates/shorts-back.svg', printAreas: BOTTOMS_PRINT_AREAS },
    ],
    availableColors: STANDARD_COLORS,
    availableSizes: BOTTOMS_SIZES,
    printAreas: BOTTOMS_PRINT_AREAS,
    defaultPrintArea: 'Left Leg',
    tags: ['shorts', 'athletic', 'basketball', 'training'],
  },

  // SOCKS
  {
    id: 'socks',
    name: 'Athletic Crew Socks',
    category: 'accessories',
    description: 'Cushioned athletic crew socks with arch support. Sold in pairs.',
    basePrice: 14.99,
    views: [
      { id: 'socks-front', name: 'Front', angle: 'front', templatePath: '/templates/socks-front.svg', printAreas: SOCK_PRINT_AREAS },
    ],
    availableColors: STANDARD_COLORS.filter(c => ['white', 'black', 'navy', 'gray'].includes(c.id)),
    availableSizes: SOCK_SIZES,
    printAreas: SOCK_PRINT_AREAS,
    defaultPrintArea: 'Calf Area',
    tags: ['socks', 'athletic', 'crew', 'cushioned'],
  },
];

// Helper functions
export function getTemplateById(id: string): ProductTemplate | undefined {
  return PRODUCT_TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(category: ProductTemplate['category']): ProductTemplate[] {
  return PRODUCT_TEMPLATES.filter(t => t.category === category);
}

export function getAllTemplates(): ProductTemplate[] {
  return PRODUCT_TEMPLATES;
}

export function getColorById(id: string): ProductColor | undefined {
  return STANDARD_COLORS.find(c => c.id === id);
}

