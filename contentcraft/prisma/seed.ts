/**
 * Database seed script — creates the first Admin user.
 * Run with: npx prisma db seed
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const existing = await prisma.user.findUnique({ where: { email: 'admin@contentcraft.app' } })
  if (!existing) {
    const hashed = await bcrypt.hash('Admin1234!', 12)
    await prisma.user.create({
      data: {
        email: 'admin@contentcraft.app',
        name: 'System Admin',
        password: hashed,
        role: 'ADMIN',
      },
    })
    console.log('Created admin user: admin@contentcraft.app / Admin1234!')
  } else {
    console.log('Admin user already exists')
  }

  // Seed default system config
  const defaults: Record<string, number> = {
    improvementTriggerThreshold: 3.5,
    improvementCycleCount: 10,
    maxSloHistory: 10,
  }
  for (const [key, value] of Object.entries(defaults)) {
    await prisma.systemConfig.upsert({
      where: { key },
      update: {},
      create: { key, value: { value } },
    })
  }
  console.log('Seeded system config defaults')

  console.log('Done.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
