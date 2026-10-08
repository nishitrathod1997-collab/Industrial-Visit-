import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Revert or delete the dummy users that accidentally got the emails
  const dummyFaculty = await prisma.user.findFirst({
    where: { id: '13430f64-0727-492c-9e9c-f14066000528' }
  });
  if (dummyFaculty) {
    await prisma.user.update({
      where: { id: dummyFaculty.id },
      data: { email: 'dummy.faculty@vit.edu.in' }
    });
  }

  const dummyAdmin = await prisma.user.findFirst({
    where: { id: '7f7f771d-23b4-4489-9997-d87471ae5e68' }
  });
  if (dummyAdmin) {
    await prisma.user.update({
      where: { id: dummyAdmin.id },
      data: { email: 'dummy.admin@vit.edu.in' }
    });
  }

  // 2. Update the actual main demo users
  await prisma.user.update({
    where: { id: 'usr_faculty_1' },
    data: { email: 'arvind.swaminathan@vit.edu.in' }
  });
  console.log('Main faculty user updated to arvind.swaminathan@vit.edu.in');

  await prisma.user.update({
    where: { id: 'usr_admin_1' },
    data: { email: 'admin@vit.edu.in' }
  });
  console.log('Main admin user updated to admin@vit.edu.in');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
