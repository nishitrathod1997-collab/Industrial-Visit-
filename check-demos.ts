import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { id: { in: ['usr_student_1', 'usr_faculty_1', 'usr_admin_1'] } },
    select: { id: true, name: true, email: true, role: true, status: true, passwordHash: true }
  });
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
