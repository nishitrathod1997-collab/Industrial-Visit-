import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Find the newly created user (the empty one)
  const emptyUser = await prisma.user.findFirst({
    where: { 
      email: 'nishit.rathod@vit.edu.in',
      id: { not: 'usr_student_1' } 
    }
  });

  if (emptyUser) {
    console.log(`Deleting empty newly created user with ID: ${emptyUser.id}`);
    await prisma.user.delete({ where: { id: emptyUser.id } });
  }

  // 2. Update the actual demo user to use the new email
  const demoUser = await prisma.user.findFirst({
    where: { id: 'usr_student_1' }
  });

  if (demoUser) {
    await prisma.user.update({
      where: { id: 'usr_student_1' },
      data: { email: 'nishit.rathod@vit.edu.in' }
    });
    console.log('Successfully updated the main demo user (usr_student_1) to nishit.rathod@vit.edu.in!');
  } else {
    console.log('Main demo user not found?!');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
