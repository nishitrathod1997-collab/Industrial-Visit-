import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

async function main() {
  // Get all users with no password
  const usersWithNoPassword = await prisma.user.findMany({
    where: {
      OR: [
        { passwordHash: null },
        { salt: null },
      ]
    },
    select: { id: true, name: true, email: true, role: true }
  });

  console.log(`Found ${usersWithNoPassword.length} accounts with no password. Setting Password@123 for all...`);

  let count = 0;
  for (const user of usersWithNoPassword) {
    const { hash, salt } = hashPassword('Password@123');
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash, salt: salt, status: 'ACTIVE' }
    });
    count++;
    if (count % 10 === 0) console.log(`  Updated ${count}/${usersWithNoPassword.length}...`);
  }

  console.log(`\n✅ Done! ${count} accounts now have Password@123`);
  console.log('\nAny student/faculty/admin can now log in with:');
  console.log('  Email: their@vit.edu.in');
  console.log('  Password: Password@123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
