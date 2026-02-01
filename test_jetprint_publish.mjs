import https from 'https';
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

async function testJetprintPublish() {
  try {
    // Get API credentials
    const apiKey = await prisma.apiKey.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    if (!apiKey) {
      console.log('❌ No API key found. Please connect Jetprint first.');
      return;
    }
    
    console.log('✅ Found API key:', apiKey.consumerKey.substring(0, 10) + '...');
    
    // Create auth header (Basic Auth with consumer_key:consumer_secret)
    const auth = Buffer.from(`${apiKey.consumerKey}:${apiKey.consumerSecret}`).toString('base64');
    
    // Sample product data that Jetprint would send
    const productData = {
      name: "Test Basketball T-Shirt from Jetprint",
      type: "simple",
      status: "publish",
      description: "Custom basketball apparel from Jetprint POD",
      short_description: "Premium basketball tee",
      sku: "JETPRINT-TEST-001",
      regular_price: "29.99",
      price: "29.99",
      categories: [
        { name: "POD Products" }
      ],
      images: [
        {
          src: "https://example.com/image.jpg"
        }
      ],
      meta_data: [
        {
          key: "_pod_provider",
          value: "jetprint"
        },
        {
          key: "_pod_product_id",
          value: "jp_12345"
        },
        {
          key: "_pod_variant_id",
          value: "jp_var_67890"
        }
      ]
    };
    
    console.log('\n=== Simulating Jetprint POST Request ===');
    console.log('URL: https://basketballgearstore.abacusai.app/wp-json/wc/v3/products');
    console.log('Auth: Basic', auth.substring(0, 20) + '...');
    console.log('Product Data:', JSON.stringify(productData, null, 2));
    
    // Make the request
    const postData = JSON.stringify(productData);
    
    const options = {
      hostname: 'basketballgearstore.abacusai.app',
      port: 443,
      path: '/wp-json/wc/v3/products',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Jetprint/1.0'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      console.log(`\n=== Response Status: ${res.statusCode} ===`);
      console.log('Response Headers:', JSON.stringify(res.headers, null, 2));
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('\n=== Response Body ===');
        try {
          const parsed = JSON.parse(data);
          console.log(JSON.stringify(parsed, null, 2));
          
          // Check for the status field
          if (parsed.status !== undefined) {
            console.log(`\n✅ SUCCESS: status field is present: "${parsed.status}"`);
          } else {
            console.log('\n❌ ERROR: status field is UNDEFINED in response!');
          }
          
          // Check for error
          if (parsed.code) {
            console.log(`\n❌ API Error: ${parsed.message}`);
          }
        } catch (e) {
          console.log('Raw response:', data);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request Error:', error.message);
    });
    
    req.write(postData);
    req.end();
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testJetprintPublish();
