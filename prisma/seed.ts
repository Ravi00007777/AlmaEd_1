import { PrismaClient, UserRole, TeacherVerificationStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tutorconnect.com' },
    update: {},
    create: {
      email: 'admin@tutorconnect.com',
      passwordHash: adminPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
      status: 'ACTIVE',
      emailVerified: new Date(),
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create platform settings
  await prisma.platformSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      commissionPercent: 15,
      minCommissionPercent: 5,
      maxCommissionPercent: 30,
      maintenanceMode: false,
      allowTeacherRegistration: true,
      allowStudentRegistration: true,
      updatedBy: admin.id,
    },
  });
  console.log('✅ Platform settings created');

  // Create sample teachers
  const teacherPassword = await hash('teacher123', 12);

  const teacher1 = await prisma.user.upsert({
    where: { email: 'rahul.sharma@tutorconnect.com' },
    update: {},
    create: {
      email: 'rahul.sharma@tutorconnect.com',
      passwordHash: teacherPassword,
      name: 'Rahul Sharma',
      role: UserRole.TEACHER,
      status: 'ACTIVE',
      emailVerified: new Date(),
      phone: '+91 98765 43210',
      timezone: 'Asia/Kolkata',
    },
  });

  await prisma.teacher.upsert({
    where: { userId: teacher1.id },
    update: {},
    create: {
      userId: teacher1.id,
      bio: 'IIT Delhi graduate with 8 years of teaching experience. Specialized in JEE Advanced Mathematics and Physics. 28 students selected in JEE Advanced 2020-2024.',
      education: 'M.Tech, IIT Delhi',
      university: 'IIT Delhi',
      qualifications: ['M.Tech Computer Science', 'B.Tech Electrical Engineering', 'JEE Advanced AIR 247'],
      experienceYears: 8,
      subjects: ['Mathematics', 'Physics'],
      grades: ['9', '10', '11', '12'],
      boards: ['CBSE', 'ICSE', 'JEE'],
      languages: ['English', 'Hindi'],
      teachingStyle: 'Conceptual clarity with problem-solving focus. Regular mock tests and personalized doubt sessions.',
      hourlyRate: 1200,
      monthlyRate: 8000,
      maxClassesPerDay: 4,
      preferredDuration: 60,
      bufferMinutes: 15,
      autoAcceptDemos: true,
      verificationStatus: TeacherVerificationStatus.VERIFIED,
      verifiedAt: new Date(),
      verifiedBy: admin.id,
      totalStudents: 12,
      activeStudents: 12,
      totalClasses: 156,
      rating: 4.9,
      reviewCount: 127,
      availability: {
        create: [
          { dayOfWeek: 1, startTime: '17:00', endTime: '21:00' }, // Monday
          { dayOfWeek: 2, startTime: '17:00', endTime: '21:00' }, // Tuesday
          { dayOfWeek: 3, startTime: '17:00', endTime: '21:00' }, // Wednesday
          { dayOfWeek: 4, startTime: '17:00', endTime: '21:00' }, // Thursday
          { dayOfWeek: 5, startTime: '17:00', endTime: '21:00' }, // Friday
          { dayOfWeek: 6, startTime: '09:00', endTime: '13:00' }, // Saturday
          { dayOfWeek: 6, startTime: '15:00', endTime: '18:00' }, // Saturday
          { dayOfWeek: 0, startTime: '09:00', endTime: '13:00' }, // Sunday
        ],
      },
    },
  });
  console.log('✅ Teacher Rahul Sharma created');

  const teacher2 = await prisma.user.upsert({
    where: { email: 'priya.nair@tutorconnect.com' },
    update: {},
    create: {
      email: 'priya.nair@tutorconnect.com',
      passwordHash: teacherPassword,
      name: 'Priya Nair',
      role: UserRole.TEACHER,
      status: 'ACTIVE',
      emailVerified: new Date(),
      phone: '+91 98765 43211',
      timezone: 'Asia/Kolkata',
    },
  });

  await prisma.teacher.upsert({
    where: { userId: teacher2.id },
    update: {},
    create: {
      userId: teacher2.id,
      bio: 'PhD in Physics with 6 years of experience teaching NEET and JEE Physics & Chemistry. Published research in international journals. Passionate about making complex concepts simple.',
      education: 'PhD Physics, IISc Bangalore',
      university: 'IISc Bangalore',
      qualifications: ['PhD Physics', 'M.Sc Physics', 'NET Qualified'],
      experienceYears: 6,
      subjects: ['Physics', 'Chemistry'],
      grades: ['11', '12'],
      boards: ['CBSE', 'NEET', 'JEE'],
      languages: ['English', 'Malayalam', 'Hindi'],
      teachingStyle: 'Visual learning with real-world applications. Concept maps and mind maps for better retention.',
      hourlyRate: 1500,
      monthlyRate: 10000,
      maxClassesPerDay: 3,
      preferredDuration: 90,
      bufferMinutes: 15,
      autoAcceptDemos: false,
      verificationStatus: TeacherVerificationStatus.VERIFIED,
      verifiedAt: new Date(),
      verifiedBy: admin.id,
      totalStudents: 8,
      activeStudents: 8,
      totalClasses: 98,
      rating: 4.8,
      reviewCount: 89,
      availability: {
        create: [
          { dayOfWeek: 1, startTime: '16:00', endTime: '20:00' },
          { dayOfWeek: 3, startTime: '16:00', endTime: '20:00' },
          { dayOfWeek: 5, startTime: '16:00', endTime: '20:00' },
          { dayOfWeek: 6, startTime: '10:00', endTime: '14:00' },
          { dayOfWeek: 0, startTime: '10:00', endTime: '14:00' },
        ],
      },
    },
  });
  console.log('✅ Teacher Priya Nair created');

  const teacher3 = await prisma.user.upsert({
    where: { email: 'amit.kumar@tutorconnect.com' },
    update: {},
    create: {
      email: 'amit.kumar@tutorconnect.com',
      passwordHash: teacherPassword,
      name: 'Amit Kumar',
      role: UserRole.TEACHER,
      status: 'ACTIVE',
      emailVerified: new Date(),
      phone: '+91 98765 43212',
      timezone: 'Asia/Kolkata',
    },
  });

  await prisma.teacher.upsert({
    where: { userId: teacher3.id },
    update: {},
    create: {
      userId: teacher3.id,
      bio: 'NIT Trichy graduate with 5 years experience teaching Mathematics for Grades 8-10 (CBSE/ICSE). Expert in board exam preparation and foundation building for competitive exams.',
      education: 'B.Tech, NIT Trichy',
      university: 'NIT Trichy',
      qualifications: ['B.Tech Mathematics', 'CTET Qualified'],
      experienceYears: 5,
      subjects: ['Mathematics'],
      grades: ['8', '9', '10'],
      boards: ['CBSE', 'ICSE', 'State Board'],
      languages: ['English', 'Hindi', 'Tamil'],
      teachingStyle: 'Step-by-step approach with strong fundamentals. Regular practice worksheets and chapter-wise tests.',
      hourlyRate: 800,
      monthlyRate: 6000,
      maxClassesPerDay: 4,
      preferredDuration: 60,
      bufferMinutes: 10,
      autoAcceptDemos: true,
      verificationStatus: TeacherVerificationStatus.VERIFIED,
      verifiedAt: new Date(),
      verifiedBy: admin.id,
      totalStudents: 15,
      activeStudents: 15,
      totalClasses: 245,
      rating: 4.7,
      reviewCount: 156,
      availability: {
        create: [
          { dayOfWeek: 1, startTime: '16:00', endTime: '20:00' },
          { dayOfWeek: 2, startTime: '16:00', endTime: '20:00' },
          { dayOfWeek: 3, startTime: '16:00', endTime: '20:00' },
          { dayOfWeek: 4, startTime: '16:00', endTime: '20:00' },
          { dayOfWeek: 5, startTime: '16:00', endTime: '20:00' },
          { dayOfWeek: 6, startTime: '09:00', endTime: '13:00' },
        ],
      },
    },
  });
  console.log('✅ Teacher Amit Kumar created');

  // Create sample students
  const studentPassword = await hash('student123', 12);

  const student1 = await prisma.user.upsert({
    where: { email: 'arjun.kumar@student.com' },
    update: {},
    create: {
      email: 'arjun.kumar@student.com',
      passwordHash: studentPassword,
      name: 'Arjun Kumar',
      role: UserRole.STUDENT,
      status: 'ACTIVE',
      emailVerified: new Date(),
      phone: '+91 98765 43220',
      timezone: 'Asia/Kolkata',
    },
  });

  await prisma.student.upsert({
    where: { userId: student1.id },
    update: {},
    create: {
      userId: student1.id,
      grade: '10',
      board: 'CBSE',
      school: 'Delhi Public School',
      currentLevel: 'INTERMEDIATE',
      targetGoal: 'JEE Advanced 2025 - Top 500',
      examDate: new Date('2025-05-18'),
      preferredLanguage: 'English',
      preferredDuration: 60,
      preferredDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
      preferredTimeStart: '19:00',
      preferredTimeEnd: '21:00',
      monthlyBudget: 8000,
      learningPreferences: 'Visual learner, step-by-step explanation, regular assessments',
      availability: {
        create: [
          { dayOfWeek: 1, startTime: '18:00', endTime: '21:00' },
          { dayOfWeek: 3, startTime: '18:00', endTime: '21:00' },
          { dayOfWeek: 5, startTime: '17:00', endTime: '20:00' },
          { dayOfWeek: 6, startTime: '10:00', endTime: '13:00' },
          { dayOfWeek: 0, startTime: '10:00', endTime: '13:00' },
        ],
      },
    },
  });
  console.log('✅ Student Arjun Kumar created');

  const student2 = await prisma.user.upsert({
    where: { email: 'priya.sharma@student.com' },
    update: {},
    create: {
      email: 'priya.sharma@student.com',
      passwordHash: studentPassword,
      name: 'Priya Sharma',
      role: UserRole.STUDENT,
      status: 'ACTIVE',
      emailVerified: new Date(),
      phone: '+91 98765 43221',
      timezone: 'Asia/Kolkata',
    },
  });

  await prisma.student.upsert({
    where: { userId: student2.id },
    update: {},
    create: {
      userId: student2.id,
      grade: '12',
      board: 'CBSE',
      school: 'Kendriya Vidyalaya',
      currentLevel: 'ADVANCED',
      targetGoal: 'NEET 2025 - AIIMS Delhi',
      examDate: new Date('2025-05-04'),
      preferredLanguage: 'English',
      preferredDuration: 90,
      preferredDays: ['TUESDAY', 'THURSDAY', 'SATURDAY'],
      preferredTimeStart: '16:00',
      preferredTimeEnd: '20:00',
      monthlyBudget: 10000,
      learningPreferences: 'Audio learner, concept maps, mock tests',
      availability: {
        create: [
          { dayOfWeek: 2, startTime: '16:00', endTime: '20:00' },
          { dayOfWeek: 4, startTime: '16:00', endTime: '20:00' },
          { dayOfWeek: 6, startTime: '10:00', endTime: '14:00' },
        ],
      },
    },
  });
  console.log('✅ Student Priya Sharma created');

  // Create a parent
  const parentPassword = await hash('parent123', 12);
  const parent1 = await prisma.user.upsert({
    where: { email: 'rajesh.kumar@parent.com' },
    update: {},
    create: {
      email: 'rajesh.kumar@parent.com',
      passwordHash: parentPassword,
      name: 'Rajesh Kumar',
      role: UserRole.PARENT,
      status: 'ACTIVE',
      emailVerified: new Date(),
      phone: '+91 98765 43230',
      timezone: 'Asia/Kolkata',
    },
  });

  await prisma.parent.upsert({
    where: { userId: parent1.id },
    update: {},
    create: {
      userId: parent1.id,
      students: {
        connect: [{ id: (await prisma.student.findUnique({ where: { userId: student1.id } }))!.id }],
      },
    },
  });
  console.log('✅ Parent Rajesh Kumar created');

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });