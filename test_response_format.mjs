import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Load environment variables
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

const prisma = new PrismaClient();

async function testResponseFormat() {
  try {
    // Find any product
    const product = await prisma.product.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    if (!product) {
      console.log('No products found');
      return;
    }
    
    console.log('Testing product:', product.id, product.name);
    console.log('\n=== Product Data ===');
    console.log('ID:', product.id);
    console.log('Name:', product.name);
    console.log('SKU:', product.sku);
    console.log('Price:', product.price);
    console.log('InStock:', product.inStock);
    console.log('Stock:', product.stock);
    console.log('\n=== Metadata ===');
    console.log(JSON.stringify(product.metadata, null, 2));
    
    // Simulate the mapper
    const metadata = (product.metadata || {});
    const productStatus = metadata.status || (product.inStock ? 'publish' : 'draft');
    const productType = metadata.type || 'simple';
    
    console.log('\n=== Mapped Response (what Jetprint receives) ===');
    const mappedProduct = {
      id: product.id,
      name: product.name,
      sku: product.sku || product.id,
      price: product.price.toString(),
      status: productStatus,
      type: productType,
      stock_quantity: product.stock,
      stock_status: product.stock > 0 ? 'instock' : 'outofstock'
    };
    
    console.log(JSON.stringify(mappedProduct, null, 2));
    
    // Check if status field is present
    if (mappedProduct.status === undefined) {
      console.log('\n❌ ERROR: status field is undefined!');
    } else {
      console.log(`\n✅ status field is present: "${mappedProduct.status}"`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testResponseFormat();
