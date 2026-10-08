import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      role: 'STUDENT',
      id: { not: 'usr_student_1' }
    },
    select: { id: true, name: true, email: true, status: true, passwordHash: true, salt: true }
  });
  console.log(`Found ${users.length} non-demo student accounts:`);
  for (const u of users) {
    console.log(`  ${u.name} (${u.email}) | status: ${u.status} | hasPassword: ${!!u.passwordHash}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
