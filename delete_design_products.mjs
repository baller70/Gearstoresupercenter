import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const designId = 'cmh9nuhru0000qvntkv22dvfb';
  
  // Delete all products for this design
  const result = await prisma.product.deleteMany({
    where: { designId }
  });
  
  console.log(`Deleted ${result.count} products`);
  
  // Update design status back to PENDING
  await prisma.design.update({
    where: { id: designId },
    data: { status: 'PENDING' }
  });
  
  console.log('Design status updated to PENDING');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
