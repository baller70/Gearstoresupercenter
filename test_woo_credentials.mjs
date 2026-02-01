import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function testWooCommerceCredentials() {
  try {
    // Find the admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'john@doe.com' }
    });

    if (!adminUser) {
      console.error('❌ Admin user not found');
      return;
    }

    console.log('✅ Found admin user:', {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role
    });

    // Try to generate credentials
    const consumerKey = `ck_${crypto.randomBytes(20).toString('hex')}`;
    const consumerSecret = `cs_${crypto.randomBytes(20).toString('hex')}`;

    console.log('\n📝 Generated keys:');
    console.log('Consumer Key:', consumerKey);
    console.log('Consumer Secret:', consumerSecret);

    // Delete existing credentials
    await prisma.apiKey.deleteMany({
      where: {
        userId: adminUser.id,
        name: 'WooCommerce Integration'
      }
    });

    // Create new credentials
    const apiKey = await prisma.apiKey.create({
      data: {
        key: consumerKey,
        secret: consumerSecret,
        userId: adminUser.id,
        name: 'WooCommerce Integration',
        permissions: ['read', 'write']
      }
    });

    console.log('\n✅ Successfully created API key in database');
    console.log('API Key ID:', apiKey.id);

    // Verify it was created
    const verification = await prisma.apiKey.findFirst({
      where: {
        userId: adminUser.id,
        name: 'WooCommerce Integration'
      }
    });

    if (verification) {
      console.log('\n✅ Verification successful!');
      console.log('Stored Consumer Key:', verification.key);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testWooCommerceCredentials();
