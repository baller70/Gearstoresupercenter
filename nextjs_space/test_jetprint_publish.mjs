import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

async function testJetprintPublish() {
  console.log('=== Simulating Jetprint Product Publish ===\n');
  
  // Get the latest API key
  const apiKey = await prisma.apiKey.findFirst({
    where: {
      name: { contains: 'jetprint', mode: 'insensitive' }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  if (!apiKey) {
    console.error('❌ No Jetprint API key found!');
    await prisma.$disconnect();
    return;
  }
  
  console.log('Using API Key:', apiKey.key.substring(0, 15) + '...');
  console.log('');
  
  // Create Basic Auth header
  const auth = Buffer.from(`${apiKey.key}:${apiKey.secret}`).toString('base64');
  
  // Simulate Jetprint product payload
  const productPayload = {
    name: 'Custom Basketball Jersey - Test',
    type: 'simple',
    status: 'publish',
    description: 'High-quality basketball jersey with custom design',
    short_description: 'Custom basketball jersey',
    sku: 'jetprint-test-' + Date.now(),
    regular_price: '49.99',
    categories: [{ name: 'Athletic Apparel' }],
    images: [
      { src: 'https://example.com/jersey-front.jpg' },
      { src: 'https://example.com/jersey-back.jpg' }
    ],
    meta_data: [
      { key: '_pod_provider', value: 'jetprint' },
      { key: '_pod_product_id', value: 'jp_12345' },
      { key: '_pod_variant_id', value: 'jpv_67890' }
    ]
  };
  
  console.log('Product Payload:', JSON.stringify(productPayload, null, 2));
  console.log('');
  
  // Test both endpoints
  const endpoints = [
    'http://localhost:3000/wp-json/wc/v3/products',
    'http://localhost:3000/wc-api/v3/products'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\nTesting: ${endpoint}`);
    console.log('='.repeat(60));
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productPayload)
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }
      
      if (response.ok) {
        console.log('✅ SUCCESS!');
        console.log('Response:', JSON.stringify(responseData, null, 2));
      } else {
        console.log('❌ FAILED!');
        console.log('Error Response:', JSON.stringify(responseData, null, 2));
      }
    } catch (error) {
      console.log('❌ REQUEST ERROR:', error.message);
    }
  }
  
  await prisma.$disconnect();
}

testJetprintPublish().catch(console.error);
