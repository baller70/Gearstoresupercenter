import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { name: { contains: 'RA1 v5' } },
    select: { id: true, name: true, imageUrl: true, images: true },
    orderBy: { createdAt: 'desc' },
    take: 3
  });
  
  console.log('Recent products:', JSON.stringify(products, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
