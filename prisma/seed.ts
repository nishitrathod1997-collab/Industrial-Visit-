import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../server/auth';

const prisma = new PrismaClient();

async function main() {
  const { hash, salt } = hashPassword('password123');

  // Seed Admin
  await prisma.user.upsert({
    where: { email: 'admin@vit.edu.in' },
    update: {},
    create: {
      email: 'admin@vit.edu.in',
      name: 'Admin User',
      role: 'ADMIN',
      status: 'ACTIVE',
      passwordHash: hash,
      salt: salt,
    },
  });

  // Seed Student
  const student = await prisma.user.upsert({
    where: { email: 'student@vit.edu.in' },
    update: {},
    create: {
      email: 'student@vit.edu.in',
      name: 'Test Student',
      role: 'STUDENT',
      status: 'ACTIVE',
      passwordHash: hash,
      salt: salt,
      studentProfile: {
        create: {
          studentId: '21BCE0000',
          branch: 'Computer Science',
          year: 3,
          semester: 5,
          division: 'A',
          department: 'SCOPE',
          cgpa: 9.0,
          phone: '9876543210',
          prn: 'PRN000',
        }
      }
    },
  });

  // Seed Faculty
  const faculty = await prisma.user.upsert({
    where: { email: 'faculty@vit.edu.in' },
    update: {},
    create: {
      email: 'faculty@vit.edu.in',
      name: 'Test Faculty',
      role: 'FACULTY',
      status: 'ACTIVE',
      passwordHash: hash,
      salt: salt,
      facultyProfile: {
        create: {
          facultyId: 'FAC000',
          department: 'SCOPE',
          designation: 'Professor',
          employeeCode: 'EMP000',
          phone: '9876543211'
        }
      }
    },
  });

  console.log('Database seeded with test users (password: password123)');
  console.log('Student:', student.email, '/ Roll:', '21BCE0000');
  console.log('Faculty:', faculty.email, '/ ID:', 'FAC000');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
