const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'john@doe.com' }
    });
    
    if (admin) {
      console.log('Admin user exists:', {
        id: admin.id,
        email: admin.email,
        role: admin.role
      });
    } else {
      console.log('Admin user does not exist');
    }
    
    // Also check test@email.com
    const test = await prisma.user.findUnique({
      where: { email: 'test@email.com' }
    });
    
    if (test) {
      console.log('Test user exists:', {
        id: test.id,
        email: test.email,
        role: test.role
      });
    } else {
      console.log('Test user does not exist');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
