import 'dotenv/config';
import { PrismaClient, Role } from '../src/generated/prisma-client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const institute = await prisma.institute.upsert({
    where: { slug: 'sufal-physics-classes' },
    update: {},
    create: {
      name: 'Sufal Physics Classes',
      slug: 'sufal-physics-classes',
      phone: '9876543210',
      email: 'admin@sufal.com',
    },
  });

  console.log(`  Institute: ${institute.name} (${institute.id})`);

  const passwordHash = await hashPassword('Password123!');

  const teacher = await prisma.user.upsert({
    where: { email_instituteId: { email: 'teacher@sufal.com', instituteId: institute.id } },
    update: {},
    create: {
      instituteId: institute.id,
      name: 'Demo Teacher',
      email: 'teacher@sufal.com',
      passwordHash,
      role: Role.TEACHER,
      phone: '9876543210',
    },
  });

  console.log(`  Teacher: ${teacher.name} (${teacher.email})`);

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
