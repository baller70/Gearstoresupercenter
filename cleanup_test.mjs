import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function cleanupTestProducts() {
  console.log('Cleaning up test products...');
  
  const result = await prisma.product.deleteMany({
    where: {
      name: {
        contains: 'Test',
        mode: 'insensitive'
      }
    }
  });
  
  console.log(`Deleted ${result.count} test products`);
  
  await prisma.$disconnect();
}

cleanupTestProducts().catch(console.error);
