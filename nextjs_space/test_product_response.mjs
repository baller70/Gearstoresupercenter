import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testProductResponse() {
  try {
    // Find a POD product
    const product = await prisma.product.findFirst({
      where: {
        metadata: {
          path: ['podProvider'],
          equals: 'jetprint'
        }
      }
    });
    
    if (!product) {
      console.log('No Jetprint product found');
      return;
    }
    
    console.log('Product found:', product.id, product.name);
    console.log('Product metadata:', JSON.stringify(product.metadata, null, 2));
    console.log('Product sku:', product.sku);
    console.log('Product inStock:', product.inStock);
    
    // Simulate the mapper response
    const metadata = product.metadata || {};
    const productStatus = metadata.status || (product.inStock ? 'publish' : 'draft');
    
    console.log('\n=== Simulated WooCommerce Response ===');
    console.log('status:', productStatus);
    console.log('sku:', product.sku || product.id);
    console.log('type:', metadata.type || 'simple');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProductResponse();
