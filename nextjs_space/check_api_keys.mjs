import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkApiKeys() {
  console.log('=== Checking API Keys ===\n');
  
  const apiKeys = await prisma.apiKey.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  
  console.log(`Found ${apiKeys.length} API keys:\n`);
  
  apiKeys.forEach((key, index) => {
    console.log(`API Key #${index + 1}:`);
    console.log(`  ID: ${key.id}`);
    console.log(`  Name: ${key.name}`);
    console.log(`  Key (consumer_key): ${key.key ? key.key.substring(0, 15) + '...' : 'NULL'}`);
    console.log(`  Secret (consumer_secret): ${key.secret ? key.secret.substring(0, 15) + '...' : 'NULL'}`);
    console.log(`  Permissions: ${JSON.stringify(key.permissions)}`);
    console.log(`  Created: ${key.createdAt}`);
    console.log(`  Last Used: ${key.lastUsed || 'Never'}`);
    console.log('');
  });
  
  await prisma.$disconnect();
}

checkApiKeys().catch(console.error);
