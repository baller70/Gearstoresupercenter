import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function cleanup() {
  try {
    // Delete test users
    const testEmails = [
      'test@email.com',
      'testuser@example.com',
      'test123@example.com',
      'admin@example.com',
      'user@example.com'
    ];
    
    const result = await prisma.user.deleteMany({
      where: {
        email: {
          in: testEmails
        }
      }
    });
    
    console.log(`Deleted ${result.count} test users`);
  } catch (error) {
    console.error('Error cleaning up test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
