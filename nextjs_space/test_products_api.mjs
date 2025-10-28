import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Get all products
    const products = await prisma.product.findMany({
      take: 10,
      select: {
        id: true,
        name: true,
        price: true,
        category: true,
        inStock: true,
      }
    });

    console.log('\n=== Products in Database ===');
    console.log(`Total products found: ${products.length}`);
    products.forEach(p => {
      console.log(`- ${p.name} (${p.category}) - $${p.price} - ${p.inStock ? 'In Stock' : 'Out of Stock'}`);
    });

    // Check designs
    const designs = await prisma.design.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        logoUrl: true,
      }
    });

    console.log('\n=== Designs in Database ===');
    console.log(`Total designs found: ${designs.length}`);
    designs.forEach(d => {
      console.log(`- ${d.name} - Status: ${d.status}`);
      console.log(`  Logo: ${d.logoUrl}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
