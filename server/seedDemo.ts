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
    branch: 'Electronics & Computer Science',
    year: 3,
    semester: 5,
    division: 'A',
    cgpa: 8.7,
    phone: '+91 98201 45678',
    prn: 'PRN202300001',
  },
  {
    id: 'usr_faculty_1',
    name: 'Dr. Arvind Swaminathan',
    email: 'arvind.swaminathan@vit.edu.in',
    role: 'FACULTY' as const,
    facultyId: 'FAC001',
    department: 'Electronics & Computer Science',
    designation: 'Associate Professor',
    employeeCode: 'EMP001',
    phone: '+91 98400 11223',
  },
  {
    id: 'usr_admin_1',
    name: 'Dr. K. Rajeshwar (Dean)',
    email: 'admin@vit.edu.in',
    role: 'ADMIN' as const,
  },
];

export async function ensureDemoAccounts(prisma: PrismaClient) {
  // Never seed demo accounts in production unless explicitly enabled via environment variable
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_ACCOUNTS !== 'true') {
    console.log('[DemoSeed] Production mode: Demo account auto-seeding is disabled.');
    return;
  }

  console.log('[DemoSeed] Checking demo accounts...');

  for (const account of DEMO_ACCOUNTS) {
    try {
      const existing = await prisma.user.findUnique({ where: { id: account.id } });

      if (!existing) {
        const { hash, salt } = hashPassword(DEMO_PASSWORD);
        // Create demo account only if it does not exist
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
              branch: account.branch,
              department: account.department,
              year: account.year,
              semester: account.semester,
              division: account.division,
              cgpa: account.cgpa,
              phone: account.phone,
              prn: account.prn,
            },
            update: {},
          });
        } else if (account.role === 'FACULTY' && 'facultyId' in account) {
          await prisma.facultyProfile.upsert({
            where: { userId: account.id },
            create: {
              userId: account.id,
              facultyId: account.facultyId,
              department: account.department,
              designation: account.designation,
              employeeCode: account.employeeCode,
              phone: account.phone,
            },
            update: {},
          });
        }

        console.log(`[DemoSeed]  ✓ Created initial demo ${account.role}: ${account.email}`);
      } else {
        // If demo account exists, do NOT overwrite its password or active status if already set
        console.log(`[DemoSeed]  ✓ Demo account exists: ${account.email}`);
      }
    } catch (err: any) {
      console.error(`[DemoSeed]  ✗ Error inspecting demo account ${account.role}:`, err?.message || err);
    }
  }

  console.log('[DemoSeed] Demo account check complete.');
}
