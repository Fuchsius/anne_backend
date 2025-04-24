import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // First, create the roles
  const roles = await Promise.all([
    prisma.role.create({
      data: {
        id: 1,
        name: 'USER',
        description: 'Regular user with basic privileges'
      }
    }),
    prisma.role.create({
      data: {
        id: 2,
        name: 'ADMIN',
        description: 'Administrator with full privileges'
      }
    })
  ])

  console.log('Created roles:', roles)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 