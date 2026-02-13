/**
 * Database Seeder Script
 * Run from backend folder: node ../demo-data/seed.js
 * Or run: cd backend && node ../demo-data/seed.js
 * This script populates the database with demo data for hackathon presentation
 */

const { PrismaClient } = require('../backend/node_modules/@prisma/client')
const bcrypt = require('../backend/node_modules/bcryptjs')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...\n')

  // Load seed data
  const seedData = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'seed.json'), 'utf-8')
  )

  // Clear existing data (optional - for demo reset)
  console.log('🗑️  Clearing existing data...')
  await prisma.question.deleteMany()
  await prisma.interviewRound.deleteMany()
  await prisma.experience.deleteMany()
  await prisma.company.deleteMany()
  await prisma.user.deleteMany()
  console.log('✅ Cleared existing data\n')

  // Seed Companies
  console.log('🏢 Seeding companies...')
  for (const company of seedData.companies) {
    await prisma.company.create({
      data: {
        name: company.name,
        industry: 'Technology',
        tier: 'Tier 1'
      }
    })
  }
  console.log(`✅ Created ${seedData.companies.length} companies\n`)

  // Seed Users
  console.log('👥 Seeding users...')
  const createdUsers = []
  for (const user of seedData.users) {
    const hashedPassword = await bcrypt.hash(user.password, 10)
    const created = await prisma.user.create({
      data: {
        email: user.email,
        passwordHash: hashedPassword,
        name: user.name,
        role: user.role,
        college: user.college,
        graduationYear: user.graduationYear,
        isVerified: true
      }
    })
    createdUsers.push(created)
  }
  console.log(`✅ Created ${seedData.users.length} users\n`)

  // Seed Experiences
  console.log('📝 Seeding experiences...')
  let totalQuestions = 0
  
  for (let i = 0; i < seedData.experiences.length; i++) {
    const exp = seedData.experiences[i]
    const user = createdUsers[i % 2] // Assign to senior users
    
    // Find or create company
    const company = await prisma.company.findFirst({
      where: { name: exp.companyName }
    })

    const experience = await prisma.experience.create({
      data: {
        userId: user.id,
        companyId: company?.id,
        companyName: exp.companyName,
        role: exp.role,
        interviewYear: exp.interviewYear,
        difficultyLevel: exp.difficultyLevel,
        offerStatus: exp.offerStatus,
        overallExp: exp.overallExp,
        tips: exp.tips,
        isAnonymous: exp.isAnonymous,
        resourcesUsed: exp.resourcesUsed,
        status: 'approved',
        viewsCount: Math.floor(Math.random() * 500) + 50,
        likesCount: Math.floor(Math.random() * 100) + 10
      }
    })

    // Create rounds and questions
    for (const round of exp.rounds) {
      const createdRound = await prisma.interviewRound.create({
        data: {
          experienceId: experience.id,
          roundNumber: round.roundNumber,
          roundType: round.roundType,
          roundName: round.roundName,
          description: round.description,
          durationMinutes: round.durationMinutes,
          mode: round.mode
        }
      })

      // Create questions for this round
      for (const question of round.questions) {
        await prisma.question.create({
          data: {
            roundId: createdRound.id,
            experienceId: experience.id,
            questionText: question.questionText,
            questionType: question.questionType,
            topic: question.topic,
            subtopic: question.subtopic,
            difficulty: question.difficulty,
            answerApproach: question.answerApproach
          }
        })
        totalQuestions++
      }
    }
  }
  
  console.log(`✅ Created ${seedData.experiences.length} experiences with ${totalQuestions} questions\n`)

  // Summary
  console.log('📊 Seeding Summary:')
  console.log('─'.repeat(40))
  console.log(`   Companies: ${seedData.companies.length}`)
  console.log(`   Users: ${seedData.users.length}`)
  console.log(`   Experiences: ${seedData.experiences.length}`)
  console.log(`   Questions: ${totalQuestions}`)
  console.log('─'.repeat(40))
  
  console.log('\n🎉 Database seeding completed successfully!')
  console.log('\n📋 Demo Credentials:')
  console.log('─'.repeat(40))
  for (const user of seedData.users) {
    console.log(`   ${user.role.padEnd(8)} | ${user.email} | ${user.password}`)
  }
  console.log('─'.repeat(40))
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
