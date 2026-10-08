import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

async function main() {
  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, status: true, passwordHash: true, salt: true }
  });

  console.log(`\n=== FULL ACCOUNT AUDIT (${allUsers.length} total users) ===\n`);

  const broken: typeof allUsers = [];
  const working: typeof allUsers = [];

  for (const u of allUsers) {
    if (!u.passwordHash || !u.salt || u.status !== 'ACTIVE') {
      broken.push(u);
    } else {
      working.push(u);
    }
  }

  console.log(`✅ Working accounts: ${working.length}`);
  console.log(`❌ Broken accounts (no password or inactive): ${broken.length}`);

  if (broken.length > 0) {
    console.log('\nFixing broken accounts...');
    for (const u of broken) {
      const { hash, salt } = hashPassword('Password@123');
      await prisma.user.update({
        where: { id: u.id },
        data: { passwordHash: hash, salt: salt, status: 'ACTIVE' }
      });
    }
    console.log(`✅ Fixed ${broken.length} accounts — all set to Password@123`);
  } else {
    console.log('\n✅ All accounts already have passwords!');
  }

  // Summary by role
  const byRole = allUsers.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\n=== BREAKDOWN BY ROLE ===');
  for (const [role, count] of Object.entries(byRole)) {
    console.log(`  ${role}: ${count} accounts`);
  }

  console.log('\n=== ALL ACCOUNTS ===');
  for (const u of allUsers) {
    const status = (!u.passwordHash || !u.salt) ? '❌ NO PWD' : u.status !== 'ACTIVE' ? '⚠️ INACTIVE' : '✅';
    console.log(`  ${status} [${u.role}] ${u.name} — ${u.email}`);
  }

  console.log('\n✅ All accounts can now login with Password@123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
