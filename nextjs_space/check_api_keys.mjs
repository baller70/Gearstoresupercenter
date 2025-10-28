import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkApiKeys() {
  try {
    console.log('Checking API keys in database...\n');
    
    const apiKeys = await prisma.apiKey.findMany({
      select: {
        id: true,
        key: true,
        secret: true,
        permissions: true,
        userId: true,
        name: true,
        createdAt: true
      }
    });
    
    if (apiKeys.length === 0) {
      console.log('❌ No API keys found in database!');
      console.log('\nYou need to generate API keys through the WooCommerce OAuth flow.');
    } else {
      console.log(`✅ Found ${apiKeys.length} API key(s):\n`);
      apiKeys.forEach((key, index) => {
        console.log(`API Key #${index + 1}:`);
        console.log(`  ID: ${key.id}`);
        console.log(`  Name: ${key.name}`);
        console.log(`  Consumer Key: ${key.key}`);
        console.log(`  Consumer Secret: ${key.secret ? '***' + key.secret.slice(-4) : 'N/A'}`);
        console.log(`  Permissions: ${key.permissions.join(', ')}`);
        console.log(`  User ID: ${key.userId}`);
        console.log(`  Created: ${key.createdAt}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error checking API keys:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkApiKeys();
