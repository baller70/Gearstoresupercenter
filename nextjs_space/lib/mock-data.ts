// Mock data for development when database is unavailable
// This allows frontend testing without a database connection

export const mockProducts = [
  {
    id: 'mock-1',
    name: "Elite Reversible Jersey",
    description: "Premium double-mesh reversible basketball jersey perfect for practices and games.",
    price: 24.99,
    category: "PERFORMANCE_APPAREL",
    imageUrl: "https://cdn.abacus.ai/images/d1107149-cee4-4099-9a5d-4f98e071ea89.png",
    images: ["https://cdn.abacus.ai/images/d1107149-cee4-4099-9a5d-4f98e071ea89.png"],
    sizes: ["YS", "YM", "YL", "S", "M", "L", "XL"],
    colors: ["Royal Blue", "Gold", "Black", "White"],
    stock: 100,
    inStock: true,
    featured: true,
    brand: "Basketball Factory",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mock-2',
    name: "AAU Custom Sublimated Jersey",
    description: "High-quality sublimated basketball jersey with custom team designs.",
    price: 34.99,
    category: "PERFORMANCE_APPAREL",
    imageUrl: "https://cdn.abacus.ai/images/fa90fc76-74e5-4593-a31a-7e541b8aacdd.png",
    images: ["https://cdn.abacus.ai/images/fa90fc76-74e5-4593-a31a-7e541b8aacdd.png"],
    sizes: ["YS", "YM", "YL", "S", "M", "L", "XL"],
    colors: ["Navy", "Red", "Royal Blue", "Black"],
    stock: 75,
    inStock: true,
    featured: true,
    brand: "Basketball Factory",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mock-3',
    name: "Pro Mesh Shorts",
    description: "Lightweight mesh basketball shorts with moisture-wicking liner.",
    price: 18.99,
    category: "PERFORMANCE_APPAREL",
    imageUrl: "https://cdn.abacus.ai/images/c379f271-6294-4b02-bb58-1343f9c8ba7a.png",
    images: ["https://cdn.abacus.ai/images/c379f271-6294-4b02-bb58-1343f9c8ba7a.png"],
    sizes: ["YS", "YM", "YL", "S", "M", "L", "XL"],
    colors: ["Navy", "Royal Blue", "Black", "Red"],
    stock: 150,
    inStock: true,
    featured: false,
    brand: "Basketball Factory",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mock-4',
    name: "AAU Team Pullover Hoodie",
    description: "Comfortable pullover hoodie perfect for team events and casual wear.",
    price: 32.99,
    category: "CASUAL_WEAR",
    imageUrl: "https://cdn.abacus.ai/images/a844263c-18b2-431a-922c-f88e3994d573.png",
    images: ["https://cdn.abacus.ai/images/a844263c-18b2-431a-922c-f88e3994d573.png"],
    sizes: ["YS", "YM", "YL", "S", "M", "L", "XL"],
    colors: ["Royal Blue", "Red", "Navy", "Black"],
    stock: 80,
    inStock: true,
    featured: true,
    brand: "Basketball Factory",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mock-5',
    name: "NBA Style Snapback Cap",
    description: "Premium snapback cap with professional NBA-style construction.",
    price: 24.99,
    category: "ACCESSORIES",
    imageUrl: "https://u-mercari-images.mercdn.net/photos/m63677743662_1.jpg",
    images: ["https://u-mercari-images.mercdn.net/photos/m63677743662_1.jpg"],
    sizes: ["One Size"],
    colors: ["Black", "Navy", "Royal Blue", "Red"],
    stock: 200,
    inStock: true,
    featured: true,
    brand: "Basketball Factory",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mock-6',
    name: "Custom POD T-Shirt",
    description: "Print-on-demand custom basketball t-shirt with your team logo.",
    price: 29.99,
    category: "POD_PRODUCTS",
    imageUrl: "/mockups/basketball_tshirt_mockup.png",
    images: ["/mockups/basketball_tshirt_mockup.png"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["White", "Black", "Navy", "Red"],
    stock: 999,
    inStock: true,
    featured: true,
    brand: "Custom POD",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export function getMockFeaturedProducts() {
  return mockProducts.filter(p => p.featured);
}

export function getMockProductsByCategory(category: string, limit?: number) {
  const filtered = mockProducts.filter(p => p.category === category);
  return limit ? filtered.slice(0, limit) : filtered;
}

export function getMockProductById(id: string) {
  return mockProducts.find(p => p.id === id) || null;
}

export function getMockAllProducts() {
  return mockProducts;
}

// Helper to check if database is available
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    const { prisma } = await import('@/lib/db');
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

