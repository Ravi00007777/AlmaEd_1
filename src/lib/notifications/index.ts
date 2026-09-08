import { prisma } from '@/lib/db/prisma';
import { formatDateTime, formatCurrency } from '@/lib/utils';

export interface NotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels?: ('IN_APP' | 'EMAIL' | 'WHATSAPP' | 'SMS')[];
}

export async function createNotification(data: NotificationData): Promise<void> {
  const notification = await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
      channels: data.channels || ['IN_APP'],
    },
  });

  // Send via configured channels
  for (const channel of data.channels || ['IN_APP']) {
    await sendNotification(notification, channel);
  }
}

async function sendNotification(notification: any, channel: string): Promise<void> {
  try {
    switch (channel) {
      case 'EMAIL':
        await sendEmailNotification(notification);
        break;
      case 'WHATSAPP':
        await sendWhatsAppNotification(notification);
        break;
      case 'SMS':
        await sendSMSNotification(notification);
        break;
      case 'IN_APP':
      default:
        // Already stored in DB, real-time delivery via WebSocket would happen here
        break;
    }
  } catch (error) {
    console.error(`Failed to send ${channel} notification:`, error);
  }
}

async function sendEmailNotification(notification: any): Promise<void> {
  // Use Resend or Nodemailer
  if (process.env.RESEND_API_KEY) {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const user = await prisma.user.findUnique({
      where: { id: notification.userId },
      select: { email: true, name: true },
    });

    if (user?.email) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'TutorConnect <noreply@tutorconnect.com>',
        to: user.email,
        subject: notification.title,
        html: generateEmailHTML(notification, user.name),
      });
    }
  }
}

function generateEmailHTML(notification: any, userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">TutorConnect</h1>
      </div>
      <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="color: #1e293b; margin-top: 0;">${notification.title}</h2>
        <p style="color: #475569; font-size: 16px;">Hi ${userName},</p>
        <p style="color: #475569; font-size: 16px;">${notification.message}</p>
        ${notification.data?.actionUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${notification.data.actionUrl}" style="background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              ${notification.data.actionText || 'View Details'}
            </a>
          </div>
        ` : ''}
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="color: #94a3b8; font-size: 14px; margin: 0;">
          This email was sent by TutorConnect. If you don't want to receive these notifications, you can update your preferences in the app.
        </p>
      </div>
    </body>
    </html>
  `;
}

async function sendWhatsAppNotification(notification: any): Promise<void> {
  // Implement WhatsApp via Twilio/Gupshup
  if (process.env.WHATSAPP_API_KEY) {
    // Implementation would go here
    console.log('WhatsApp notification:', notification);
  }
}

async function sendSMSNotification(notification: any): Promise<void> {
  // Implement SMS via Twilio
  console.log('SMS notification:', notification);
}

// ============================================
// SPECIFIC NOTIFICATION HELPERS
// ============================================

export async function notifyClassReminder(
  userId: string,
  classData: {
    id: string;
    subject: string;
    teacherName: string;
    scheduledAt: Date;
    duration: number;
    meetLink?: string;
  },
  minutesBefore: number
): Promise<void> {
  const timeStr = formatDateTime(classData.scheduledAt);
  await createNotification({
    userId,
    type: 'CLASS_REMINDER',
    title: `Class starting in ${minutesBefore} minutes`,
    message: `Your ${classData.subject} class with ${classData.teacherName} starts at ${timeStr} (${classData.duration} min)`,
    data: {
      classId: classData.id,
      meetLink: classData.meetLink,
      actionUrl: `/student/classes/${classData.id}`,
      actionText: 'Join Class',
    },
    channels: ['IN_APP', 'EMAIL'],
  });
}

export async function notifyAssignmentDue(
  userId: string,
  assignmentData: {
    id: string;
    title: string;
    subject: string;
    dueAt: Date;
  }
): Promise<void> {
  await createNotification({
    userId,
    type: 'ASSIGNMENT_DUE',
    title: 'Assignment due soon',
    message: `Your ${assignmentData.subject} assignment "${assignmentData.title}" is due on ${formatDateTime(assignmentData.dueAt)}`,
    data: {
      assignmentId: assignmentData.id,
      actionUrl: `/student/assignments/${assignmentData.id}`,
      actionText: 'Submit Assignment',
    },
    channels: ['IN_APP', 'EMAIL'],
  });
}

export async function notifyAssignmentGraded(
  userId: string,
  assignmentData: {
    id: string;
    title: string;
    subject: string;
    marksObtained: number;
    maxMarks: number;
    teacherName: string;
  }
): Promise<void> {
  const percentage = Math.round((assignmentData.marksObtained / assignmentData.maxMarks) * 100);
  await createNotification({
    userId,
    type: 'ASSIGNMENT_GRADED',
    title: 'Assignment graded',
    message: `${assignmentData.teacherName} graded your ${assignmentData.subject} assignment "${assignmentData.title}": ${assignmentData.marksObtained}/${assignmentData.maxMarks} (${percentage}%)`,
    data: {
      assignmentId: assignmentData.id,
      actionUrl: `/student/assignments/${assignmentData.id}`,
      actionText: 'View Feedback',
    },
    channels: ['IN_APP'],
  });
}

export async function notifyDemoBooked(
  userId: string,
  demoData: {
    id: string;
    teacherName: string;
    subject: string;
    scheduledAt: Date;
    duration: number;
  }
): Promise<void> {
  await createNotification({
    userId,
    type: 'DEMO_BOOKED',
    title: 'Demo class confirmed',
    message: `Your demo class with ${demoData.teacherName} for ${demoData.subject} is scheduled for ${formatDateTime(demoData.scheduledAt)} (${demoData.duration} min)`,
    data: {
      demoId: demoData.id,
      actionUrl: `/student/demo/${demoData.id}`,
      actionText: 'View Details',
    },
    channels: ['IN_APP', 'EMAIL'],
  });
}

export async function notifyDemoFeedbackRequired(
  userId: string,
  demoData: {
    id: string;
    teacherName: string;
    subject: string;
  }
): Promise<void> {
  await createNotification({
    userId,
    type: 'DEMO_FEEDBACK_REQUIRED',
    title: 'Demo feedback requested',
    message: `Please share your feedback for the demo class with ${demoData.teacherName} (${demoData.subject})`,
    data: {
      demoId: demoData.id,
      actionUrl: `/student/demo/${demoData.id}/feedback`,
      actionText: 'Give Feedback',
    },
    channels: ['IN_APP', 'EMAIL'],
  });
}

export async function notifyPaymentSuccess(
  userId: string,
  paymentData: {
    amount: number;
    planType: string;
    subject: string;
  }
): Promise<void> {
  await createNotification({
    userId,
    type: 'PAYMENT_SUCCESS',
    title: 'Payment successful',
    message: `Your payment of ${formatCurrency(paymentData.amount)} for ${paymentData.planType} ${paymentData.subject} classes has been processed`,
    data: {
      actionUrl: '/student/payments',
      actionText: 'View Receipt',
    },
    channels: ['IN_APP', 'EMAIL'],
  });
}

export async function notifyPaymentFailed(
  userId: string,
  paymentData: {
    amount: number;
    reason?: string;
  }
): Promise<void> {
  await createNotification({
    userId,
    type: 'PAYMENT_FAILED',
    title: 'Payment failed',
    message: `Your payment of ${formatCurrency(paymentData.amount)} could not be processed. ${paymentData.reason || 'Please try again.'}`,
    data: {
      actionUrl: '/student/payments',
      actionText: 'Retry Payment',
    },
    channels: ['IN_APP', 'EMAIL'],
  });
}

export async function notifyTeacherEarning(
  teacherId: string,
  earningData: {
    amount: number;
    studentName: string;
    subject: string;
  }
): Promise<void> {
  await createNotification({
    userId: teacherId,
    type: 'EARNING_RECEIVED',
    title: 'New earning',
    message: `You earned ${formatCurrency(earningData.amount)} from ${earningData.studentName}'s ${earningData.subject} class`,
    data: {
      actionUrl: '/teacher/earnings',
      actionText: 'View Earnings',
    },
    channels: ['IN_APP'],
  });
}

export async function notifyPayoutCompleted(
  teacherId: string,
  amount: number
): Promise<void> {
  await createNotification({
    userId: teacherId,
    type: 'PAYOUT_COMPLETED',
    title: 'Payout completed',
    message: `Your payout of ${formatCurrency(amount)} has been transferred to your bank account`,
    data: {
      actionUrl: '/teacher/earnings',
      actionText: 'View Details',
    },
    channels: ['IN_APP', 'EMAIL'],
  });
}

export async function notifyScheduleChange(
  userId: string,
  changeData: {
    classId: string;
    subject: string;
    oldTime: Date;
    newTime: Date;
    reason?: string;
  }
): Promise<void> {
  await createNotification({
    userId,
    type: 'SCHEDULE_CHANGE',
    title: 'Class rescheduled',
    message: `Your ${changeData.subject} class has been moved from ${formatDateTime(changeData.oldTime)} to ${formatDateTime(changeData.newTime)}${changeData.reason ? `. Reason: ${changeData.reason}` : ''}`,
    data: {
      classId: changeData.classId,
      actionUrl: `/student/classes/${changeData.classId}`,
      actionText: 'View Class',
    },
    channels: ['IN_APP', 'EMAIL'],
  });
}

export async function notifyClassCancelled(
  userId: string,
  classData: {
    id: string;
    subject: string;
    scheduledAt: Date;
    reason?: string;
    byWhom: 'teacher' | 'student' | 'admin';
  }
): Promise<void> {
  await createNotification({
    userId,
    type: 'CLASS_CANCELLED',
    title: 'Class cancelled',
    message: `Your ${classData.subject} class scheduled for ${formatDateTime(classData.scheduledAt)} has been cancelled by ${classData.byWhom}${classData.reason ? `. Reason: ${classData.reason}` : ''}`,
    data: {
      classId: classData.id,
      actionUrl: '/student/dashboard',
      actionText: 'View Dashboard',
    },
    channels: ['IN_APP', 'EMAIL'],
  });
}

export async function notifyNewMessage(
  userId: string,
  messageData: {
    senderName: string;
    senderId: string;
    preview: string;
    classId?: string;
  }
): Promise<void> {
  await createNotification({
    userId,
    type: 'NEW_MESSAGE',
    title: `New message from ${messageData.senderName}`,
    message: messageData.preview.length > 100 ? messageData.preview.slice(0, 100) + '...' : messageData.preview,
    data: {
      senderId: messageData.senderId,
      classId: messageData.classId,
      actionUrl: messageData.classId ? `/student/classes/${messageData.classId}/messages` : `/messages/${messageData.senderId}`,
      actionText: 'View Message',
    },
    channels: ['IN_APP'],
  });
}

export async function notifyTeacherApplication(
  adminId: string,
  teacherData: {
    id: string;
    name: string;
    subjects: string[];
  }
): Promise<void> {
  await createNotification({
    userId: adminId,
    type: 'TEACHER_APPLICATION',
    title: 'New teacher application',
    message: `${teacherData.name} has applied to teach ${teacherData.subjects.join(', ')}`,
    data: {
      teacherId: teacherData.id,
      actionUrl: `/admin/teachers/${teacherData.id}`,
      actionText: 'Review Application',
    },
    channels: ['IN_APP'],
  });
}

export async function notifySchedulingConflict(
  adminId: string,
  conflictData: {
    type: string;
    teacherName: string;
    studentName: string;
    time: string;
  }
): Promise<void> {
  await createNotification({
    userId: adminId,
    type: 'SCHEDULING_CONFLICT',
    title: 'Scheduling conflict detected',
    message: `${conflictData.type} conflict: ${conflictData.teacherName} and ${conflictData.studentName} at ${conflictData.time}`,
    data: {
      actionUrl: '/admin/scheduling',
      actionText: 'Resolve Conflict',
    },
    channels: ['IN_APP'],
  });
}

export async function sendVerificationEmail(userId: string, email: string): Promise<void> {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?userId=${userId}`;
  
  await createNotification({
    userId,
    type: 'EMAIL_VERIFICATION',
    title: 'Verify your email address',
    message: 'Please click the link below to verify your email address and activate your account.',
    data: {
      actionUrl: verificationUrl,
      actionText: 'Verify Email',
    },
    channels: ['EMAIL'],
  });
}