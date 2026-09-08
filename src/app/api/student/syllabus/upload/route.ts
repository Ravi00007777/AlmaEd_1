import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { analyzeSyllabus } from '@/lib/ai/syllabus-analyzer';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Validate files
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: `File type ${file.type} not allowed` }, { status: 400 });
      }
      if (file.size > maxSize) {
        return NextResponse.json({ error: `File ${file.name} exceeds 10MB limit` }, { status: 400 });
      }
    }

    // Upload files to storage
    const uploadedUrls: string[] = [];
    for (const file of files) {
      const blob = await put(`syllabus/${student.id}/${Date.now()}-${file.name}`, file, {
        access: 'public',
        addRandomSuffix: true,
      });
      uploadedUrls.push(blob.url);
    }

    // Create or update syllabus record
    const syllabus = await prisma.syllabus.upsert({
      where: { studentId: student.id },
      create: {
        studentId: student.id,
        originalFiles: uploadedUrls,
        processingStatus: 'PENDING',
        subjects: [],
      },
      update: {
        originalFiles: uploadedUrls,
        processingStatus: 'PENDING',
      },
    });

    // Extract text from files (simplified - in production use OCR/PDF parsing)
    let extractedText = '';
    for (const file of files) {
      if (file.type === 'text/plain') {
        extractedText += await file.text() + '\n\n';
      } else {
        // For PDF/Word/Image, would use a proper extraction library
        extractedText += `[File: ${file.name} (${file.type})]\n`;
      }
    }

    // Trigger AI analysis asynchronously
    analyzeSyllabus(syllabus.id, extractedText).catch(console.error);

    return NextResponse.json({
      syllabus: {
        id: syllabus.id,
        files: uploadedUrls,
        processingStatus: 'PROCESSING',
      },
    });
  } catch (error) {
    console.error('Syllabus upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: { syllabus: true },
    });

    if (!student?.syllabus) {
      return NextResponse.json({ syllabus: null });
    }

    return NextResponse.json({ syllabus: student.syllabus });
  } catch (error) {
    console.error('Get syllabus error:', error);
    return NextResponse.json({ error: 'Failed to fetch syllabus' }, { status: 500 });
  }
}