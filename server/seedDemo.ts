/**
 * seedDemo.ts
 * 
 * Ensures the 3 permanent demo accounts always exist with the correct
 * credentials every time the server starts. This guarantees demo logins
 * are always operational regardless of database resets or migrations.
 * 
 * Demo Accounts:
 *   Student: nishit.rathod@vit.edu.in   / Password@123
 *   Faculty: arvind.swaminathan@vit.edu.in / Password@123
 *   Admin:   admin@vit.edu.in            / Password@123
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

function hashPassword(password: string, saltInput?: string): { hash: string; salt: string } {
  const salt = saltInput || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

const DEMO_PASSWORD = 'Password@123';

const DEMO_ACCOUNTS = [
  {
    id: 'usr_student_1',
    name: 'Nishit Rathod',
    email: 'nishit.rathod@vit.edu.in',
    role: 'STUDENT' as const,
    studentId: '23EC001',
    department: 'Electronics & Computer Science',
    year: 3,
    division: 'A',
    cgpa: 8.7,
  },
  {
    id: 'usr_faculty_1',
    name: 'Dr. Arvind Swaminathan',
    email: 'arvind.swaminathan@vit.edu.in',
    role: 'FACULTY' as const,
    department: 'Electronics & Computer Science',
    designation: 'Associate Professor',
  },
  {
    id: 'usr_admin_1',
    name: 'Dr. K. Rajeshwar (Dean)',
    email: 'admin@vit.edu.in',
    role: 'ADMIN' as const,
  },
];

export async function ensureDemoAccounts(prisma: PrismaClient) {
  console.log('[DemoSeed] Ensuring demo accounts are operational...');

  for (const account of DEMO_ACCOUNTS) {
    try {
      const existing = await prisma.user.findUnique({ where: { id: account.id } });
      const { hash, salt } = hashPassword(DEMO_PASSWORD);

      if (!existing) {
        // Create from scratch
        await prisma.user.create({
          data: {
            id: account.id,
            name: account.name,
            email: account.email,
            role: account.role,
            status: 'ACTIVE',
            passwordHash: hash,
            salt: salt,
          },
        });

        // Create associated profile if needed
        if (account.role === 'STUDENT' && 'studentId' in account) {
          await prisma.studentProfile.upsert({
            where: { userId: account.id },
            create: {
              userId: account.id,
              studentId: account.studentId,
              department: account.department,
              year: account.year,
              division: account.division,
              cgpa: account.cgpa,
            },
            update: {},
          });
        } else if (account.role === 'FACULTY' && 'department' in account) {
          await prisma.facultyProfile.upsert({
            where: { userId: account.id },
            create: {
              userId: account.id,
              department: account.department,
              designation: account.designation,
            },
            update: {},
          });
        }

        console.log(`[DemoSeed]  ✓ Created demo ${account.role}: ${account.email}`);
      } else {
        // Always ensure email and password are correct
        const needsUpdate =
          existing.email !== account.email ||
          existing.name !== account.name ||
          existing.status !== 'ACTIVE';

        if (needsUpdate) {
          await prisma.user.update({
            where: { id: account.id },
            data: {
              email: account.email,
              name: account.name,
              status: 'ACTIVE',
              passwordHash: hash,
              salt: salt,
            },
          });
          console.log(`[DemoSeed]  ✓ Repaired demo ${account.role}: ${account.email}`);
        } else {
          console.log(`[DemoSeed]  ✓ OK demo ${account.role}: ${account.email}`);
        }
      }
    } catch (err: any) {
      // Email conflict — another user has taken this email; fix it
      if (err?.code === 'P2002') {
        const conflicting = await prisma.user.findFirst({ where: { email: account.email } });
        if (conflicting && conflicting.id !== account.id) {
          // Move the conflicting user's email away
          await prisma.user.update({
            where: { id: conflicting.id },
            data: { email: `conflict_${conflicting.id}@vit.edu.in` },
          });
          // Now update the real demo account
          const { hash, salt } = hashPassword(DEMO_PASSWORD);
          await prisma.user.update({
            where: { id: account.id },
            data: {
              email: account.email,
              name: account.name,
              status: 'ACTIVE',
              passwordHash: hash,
              salt: salt,
            },
          });
          console.log(`[DemoSeed]  ✓ Fixed conflict and repaired ${account.role}: ${account.email}`);
        }
      } else {
        console.error(`[DemoSeed]  ✗ Error seeding ${account.role}:`, err?.message || err);
      }
    }
  }

  console.log('[DemoSeed] All demo accounts are operational.');

  // Also fix any other seeded accounts that are missing a password
  // This ensures ALL accounts in the system are always loginable with Password@123
  const noPasswordUsers = await prisma.user.findMany({
    where: { OR: [{ passwordHash: null }, { salt: null }] },
    select: { id: true }
  });

  if (noPasswordUsers.length > 0) {
    console.log(`[DemoSeed] Fixing ${noPasswordUsers.length} accounts with no password...`);
    for (const user of noPasswordUsers) {
      const { hash, salt } = hashPassword(DEMO_PASSWORD);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hash, salt: salt, status: 'ACTIVE' }
      });
    }
    console.log('[DemoSeed] All missing passwords set to Password@123.');
  }
}
