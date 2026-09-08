import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { registerSchema } from '@/lib/validations';
import { sendVerificationEmail } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hash(validated.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        passwordHash,
        name: validated.name,
        role: validated.role as any,
        phone: validated.phone,
        timezone: validated.timezone,
        status: 'PENDING',
      },
    });

    // Create profile based on role
    if (validated.role === 'STUDENT' || validated.role === 'PARENT') {
      await prisma.student.create({
        data: {
          userId: user.id,
          grade: '',
          board: '',
        },
      });

      if (validated.role === 'PARENT') {
        await prisma.parent.create({
          data: { userId: user.id },
        });
      }
    } else if (validated.role === 'TEACHER') {
      await prisma.teacher.create({
        data: {
          userId: user.id,
          hourlyRate: 0,
          subjects: [],
          grades: [],
          boards: [],
        },
      });
    }

    // Send verification email
    await sendVerificationEmail(user.id, user.email);

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { user: userWithoutPassword, message: 'Registration successful. Please verify your email.' },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}