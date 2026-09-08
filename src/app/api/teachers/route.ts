import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { teacherSearchSchema } from '@/lib/validations';
import { findTeacherMatches } from '@/lib/ai/teacher-matcher';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const isStudent = session?.user?.role === 'STUDENT';

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || undefined;
    const subjects = searchParams.get('subjects')?.split(',').filter(Boolean) || undefined;
    const grades = searchParams.get('grades')?.split(',').filter(Boolean) || undefined;
    const boards = searchParams.get('boards')?.split(',').filter(Boolean) || undefined;
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined;
    const maxHourlyRate = searchParams.get('maxHourlyRate') ? parseFloat(searchParams.get('maxHourlyRate')!) : undefined;
    const languages = searchParams.get('languages')?.split(',').filter(Boolean) || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const sortBy = searchParams.get('sortBy') as any || 'rating';
    const sortOrder = searchParams.get('sortOrder') as any || 'desc';

    // If student, get AI recommendations
    if (isStudent && session.user) {
      const student = await prisma.student.findUnique({
        where: { userId: session.user.id },
      });

      if (student && (!subjects || subjects.length === 0)) {
        const matches = await findTeacherMatches(student.id, { limit });
        const teacherIds = matches.map((m) => m.teacherId);

        const teachers = await prisma.teacher.findMany({
          where: { id: { in: teacherIds } },
          include: {
            user: { select: { name: true, avatarUrl: true, timezone: true } },
            availability: true,
            reviews: { take: 3, orderBy: { createdAt: 'desc' } },
            _count: { select: { reviews: true, teacherAssignments: true } },
          },
        });

        // Sort by match score
        const sortedTeachers = teacherIds.map((id) => teachers.find((t) => t.id === id)).filter(Boolean);

        return NextResponse.json({
          teachers: sortedTeachers,
          matches: matches.reduce((acc, m) => ({ ...acc, [m.teacherId]: m }), {}),
          total: sortedTeachers.length,
          page: 1,
          totalPages: 1,
        });
      }
    }

    // Regular search
    const where: any = {
      verificationStatus: 'VERIFIED',
      user: { status: 'ACTIVE' },
    };

    if (subjects?.length) where.subjects = { hasSome: subjects };
    if (grades?.length) where.grades = { hasSome: grades };
    if (boards?.length) where.boards = { hasSome: boards };
    if (minRating) where.rating = { gte: minRating };
    if (maxHourlyRate) where.hourlyRate = { lte: maxHourlyRate };
    if (languages?.length) where.languages = { hasSome: languages };

    if (query) {
      where.OR = [
        { user: { name: { contains: query, mode: 'insensitive' } } },
        { bio: { contains: query, mode: 'insensitive' } },
        { university: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where,
        include: {
          user: { select: { name: true, avatarUrl: true, timezone: true } },
          availability: true,
          reviews: { take: 3, orderBy: { createdAt: 'desc' } },
          _count: { select: { reviews: true, teacherAssignments: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.teacher.count({ where }),
    ]);

    return NextResponse.json({
      teachers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Teacher search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}