import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

async function main() {
  const password = 'Password@123';
  
  // Reset faculty password
  const { hash: fHash, salt: fSalt } = hashPassword(password);
  await prisma.user.update({
    where: { id: 'usr_faculty_1' },
    data: { passwordHash: fHash, salt: fSalt }
  });
  console.log('Faculty password reset to Password@123');

  // Reset admin password
  const { hash: aHash, salt: aSalt } = hashPassword(password);
  await prisma.user.update({
    where: { id: 'usr_admin_1' },
    data: { passwordHash: aHash, salt: aSalt }
  });
  console.log('Admin password reset to Password@123');

  console.log('\nAll 3 demo accounts ready:');
  console.log('  Student: nishit.rathod@vit.edu.in / Password@123');
  console.log('  Faculty: arvind.swaminathan@vit.edu.in / Password@123');
  console.log('  Admin:   admin@vit.edu.in / Password@123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
