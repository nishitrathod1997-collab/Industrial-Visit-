import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Update Faculty Email
  const faculty = await prisma.user.findFirst({
    where: { role: 'FACULTY' }
  });
  if (faculty) {
    await prisma.user.update({
      where: { id: faculty.id },
      data: { email: 'arvind.swaminathan@vit.edu.in' }
    });
    console.log('Updated faculty email');
  }

  // Update Admin Email
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  if (admin) {
    await prisma.user.update({
      where: { id: admin.id },
      data: { email: 'admin@vit.edu.in' }
    });
    console.log('Updated admin email');
  }

  // Update Experience Titles and Organizations
  const exps = await prisma.experience.findMany();
  
  if (exps.length > 0) {
    await prisma.experience.update({
      where: { id: exps[0].id },
      data: {
        organization: 'ISRO - Indian Space Research Organisation',
        title: 'Space Applications Centre Technical Visit',
        organizationIndustry: 'Aerospace & Research'
      }
    });
  }

  if (exps.length > 1) {
    await prisma.experience.update({
      where: { id: exps[1].id },
      data: {
        organization: 'Siemens Industrial Automation',
        title: 'Industry 4.0 Factory Visit',
        organizationIndustry: 'Manufacturing Automation'
      }
    });
  }

  if (exps.length > 2) {
    await prisma.experience.update({
      where: { id: exps[2].id },
      data: {
        organization: 'Tata Consultancy Services',
        title: 'Enterprise Cloud Infrastructure Tour',
        organizationIndustry: 'Information Technology'
      }
    });
  }

  if (exps.length > 3) {
    await prisma.experience.update({
      where: { id: exps[3].id },
      data: {
        organization: 'Reliance Industries',
        title: 'Smart Energy Management Site Visit',
        organizationIndustry: 'Energy & Power'
      }
    });
  }

  console.log('Database seeded with prestigious names!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
