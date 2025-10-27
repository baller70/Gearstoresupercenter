const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAdmin() {
  const admin = await prisma.user.findUnique({
    where: { email: 'john@doe.com' }
  })
  console.log('Admin user:', JSON.stringify(admin, null, 2))
  await prisma.$disconnect()
}

checkAdmin()
