import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const designs = await prisma.design.findMany({
    select: { id: true, name: true, imageUrl: true, status: true, logoUrl: true }
  });
  
  console.log('Designs:', JSON.stringify(designs, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
