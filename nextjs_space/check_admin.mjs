import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true, email: true, role: true, firstName: true, lastName: true }
  });
  
  console.log('Admin user:', JSON.stringify(admin, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
