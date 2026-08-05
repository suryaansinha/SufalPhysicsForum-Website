import 'dotenv/config';
import { PrismaClient, Role } from '../src/generated/prisma/client.js';
import { hashPassword } from '../src/utils/password'; // Adjust this path if needed
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// 1. Initialize the Postgres connection pool
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

// 2. Wrap it in the Prisma adapter
const adapter = new PrismaPg(pool);

// 3. Instantiate the client with the adapter
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  const institute = await prisma.institute.upsert({
    where: { slug: 'sufal-physics-forum' },
    update: {},
    create: {
      name: 'SufalPhysicsForum',
      slug: 'sufal-physics-forum',
      phone: '9716238813',
      email: 'sufalphysicsforum@gmail.com',
    },
  });

  console.log(`  Institute: ${institute.name} (${institute.id})`);

  const passwordHash = await hashPassword('Password123!');

  const teacher = await prisma.user.upsert({
    where: { email_instituteId: { email: 'teacher@sufal.com', instituteId: institute.id } },
    update: {},
    create: {
      instituteId: institute.id,
      name: 'Sufal Kumar',
      email: 'teacher@sufal.com',
      passwordHash,
      role: Role.TEACHER,
      phone: '9876543210',
    },
  });

  console.log(`  Teacher: ${teacher.name} (${teacher.email})`);

  const studentEmail = 'student@sufal.com';
  const student = await prisma.user.upsert({
    where: {
      email_instituteId: {
        email: studentEmail,
        instituteId: institute.id,
      },
    },
    update: {},
    create: {
      instituteId: institute.id,
      name: 'Suryaan Sinha',
      email: studentEmail,
      passwordHash: await hashPassword('password123'),
      role: Role.STUDENT,
      isActive: true,
    },
  });

  console.log(`  Student: ${student.name} (${student.email})`);

  const batch1 = await prisma.batch.create({
    data: {
      instituteId: institute.id,
      name: 'Class 11 Physics - Main',
      gradeLevel: '11',
      subject: 'Physics',
      timing: '4:00 PM - 5:30 PM',
      feeAmount: 1500,
    },
    select: { id: true, name: true },
  });

  console.log(`  Batch: ${batch1.name}`);

  const batch2 = await prisma.batch.create({
    data: {
      instituteId: institute.id,
      name: 'Class 12 Physics - Advanced',
      gradeLevel: '12',
      subject: 'Physics',
      timing: '6:00 PM - 7:30 PM',
      feeAmount: 2000,
    },
    select: { id: true, name: true },
  });

  console.log(`  Batch: ${batch2.name}`);
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
