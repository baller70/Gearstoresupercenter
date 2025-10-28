import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function testSignIn() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'john@doe.com' }
    });

    if (!user) {
      console.error('User not found');
      return;
    }

    console.log('User found:', {
      email: user.email,
      hasPassword: !!user.password
    });

    if (user.password) {
      const isValid = await bcrypt.compare('password123', user.password);
      console.log('Password is valid:', isValid);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSignIn();
