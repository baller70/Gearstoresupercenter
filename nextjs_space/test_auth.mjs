import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAuth() {
  const key = 'ck_50d3828f41e7a0ec0b65831450c9d61c';
  const secret = 'cs_e5d9f00fb0fa0195d41ceae03f54619e';
  
  console.log('Testing authentication with:');
  console.log('Key:', key);
  console.log('Secret:', secret);
  console.log('');
  
  try {
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        key: key,
        secret: secret
      }
    });
    
    if (apiKey) {
      console.log('✅ API key found!');
      console.log('Details:', JSON.stringify(apiKey, null, 2));
    } else {
      console.log('❌ API key NOT found');
      
      // Check if key exists with different secret
      const keyOnly = await prisma.apiKey.findFirst({
        where: { key: key }
      });
      
      if (keyOnly) {
        console.log('⚠️  Key exists but secret does not match!');
        console.log('Expected secret:', secret);
        console.log('Actual secret:', keyOnly.secret);
      } else {
        console.log('❌ Key does not exist in database');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();
