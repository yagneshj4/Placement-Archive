const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const experiences = await prisma.experience.findMany({
    take: 5,
    select: {
      id: true,
      companyName: true,
      status: true,
      role: true
    }
  })
  console.log('Experiences in database:')
  console.log(JSON.stringify(experiences, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
