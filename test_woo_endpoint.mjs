import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function testWooCommerceEndpoints() {
  console.log('=== Testing WooCommerce Integration ===\n');
  
  // 1. Check if API keys exist
  console.log('1. Checking API Keys...');
  const apiKeys = await prisma.apiKey.findMany();
  console.log(`Found ${apiKeys.length} API keys`);
  if (apiKeys.length > 0) {
    apiKeys.forEach(key => {
      console.log(`  - Key ID: ${key.id}`);
      console.log(`    Consumer Key: ${key.consumerKey ? key.consumerKey.substring(0, 10) + '...' : 'null'}`);
      console.log(`    Consumer Secret: ${key.consumerSecret ? key.consumerSecret.substring(0, 10) + '...' : 'null'}`);
      console.log(`    Permissions: ${key.permissions}`);
      console.log(`    Last Access: ${key.lastAccess || 'Never'}`);
    });
  }
  
  // 2. Test product creation directly
  console.log('\n2. Testing Direct Product Creation...');
  try {
    const testProduct = await prisma.product.create({
      data: {
        name: 'Test POD Product',
        description: 'This is a test product from Jetprint',
        price: 29.99,
        category: 'POD_PRODUCTS',
        imageUrl: 'https://example.com/test.jpg',
        images: ['https://example.com/test.jpg'],
        stock: 100,
        sku: 'jetprint-test-' + Date.now(),
        metadata: {
          podProvider: 'jetprint',
          podProductId: 'test-123',
          type: 'simple',
          status: 'publish'
        }
      }
    });
    console.log('✅ Product created successfully!');
    console.log(`   ID: ${testProduct.id}`);
    console.log(`   Name: ${testProduct.name}`);
    console.log(`   SKU: ${testProduct.sku}`);
    
    // Clean up test product
    await prisma.product.delete({ where: { id: testProduct.id } });
    console.log('   (Test product cleaned up)');
  } catch (error) {
    console.error('❌ Product creation failed:', error.message);
  }
  
  await prisma.$disconnect();
}

testWooCommerceEndpoints().catch(console.error);
