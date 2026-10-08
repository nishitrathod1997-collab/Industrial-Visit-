import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const testAccounts = ['rahul.verma@vit.edu.in', 'priya.sharma@vit.edu.in', 'arvind.swaminathan@vit.edu.in', 'admin@vit.edu.in', 'nishit.rathod@vit.edu.in'];
  
  for (const email of testAccounts) {
    const user = await prisma.user.findFirst({ where: { email }, select: { name: true, passwordHash: true, salt: true, status: true } });
    if (user && user.passwordHash && user.salt) {
      const hash = crypto.pbkdf2Sync('Password@123', user.salt, 10000, 64, 'sha512').toString('hex');
      const ok = hash === user.passwordHash;
      console.log(`${ok ? '✅' : '❌'} ${email} — ${ok ? 'LOGIN WORKS' : 'WRONG HASH'} (${user.status})`);
    } else {
      console.log(`❌ ${email} — NO PASSWORD`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
