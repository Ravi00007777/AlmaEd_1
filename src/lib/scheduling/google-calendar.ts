import { google, calendar_v3 } from 'googleapis';
import { prisma } from '@/lib/db/prisma';
import { addMinutes, format } from 'date-fns';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALENDAR_REDIRECT_URI
);

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

export interface CalendarEventData {
  summary: string;
  description: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  attendees: { email: string; displayName?: string }[];
  conferenceData?: boolean;
  recurrenceRule?: string;
  reminders?: { method: 'email' | 'popup'; minutes: number }[];
  extendedProperties?: Record<string, string>;
}

export interface CalendarEventResponse {
  id: string;
  htmlLink: string;
  hangoutLink?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
}

async function getValidAccessToken(userId: string): Promise<string> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: 'google' },
  });

  if (!account?.access_token) {
    throw new Error('Google account not connected');
  }

  // Check if token is expired
  if (account.expires_at && account.expires_at * 1000 < Date.now()) {
    if (!account.refresh_token) {
      throw new Error('Google token expired and no refresh token available');
    }

    // Refresh the token
    oauth2Client.setCredentials({ refresh_token: account.refresh_token });
    const { credentials } = await oauth2Client.refreshAccessToken();

    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token ?? account.refresh_token,
        expires_at: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : account.expires_at,
      },
    });

    return credentials.access_token!;
  }

  return account.access_token;
}

export async function createCalendarEvent(
  userId: string,
  eventData: CalendarEventData
): Promise<CalendarEventResponse> {
  const accessToken = await getValidAccessToken(userId);
  oauth2Client.setCredentials({ access_token: accessToken });

  const event: calendar_v3.Schema$Event = {
    summary: eventData.summary,
    description: eventData.description,
    start: {
      dateTime: eventData.startTime.toISOString(),
      timeZone: eventData.timezone,
    },
    end: {
      dateTime: eventData.endTime.toISOString(),
      timeZone: eventData.timezone,
    },
    attendees: eventData.attendees.map((a) => ({
      email: a.email,
      displayName: a.displayName,
      responseStatus: 'needsAction',
    })),
    conferenceData: eventData.conferenceData
      ? {
          createRequest: {
            requestId: `meet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        }
      : undefined,
    recurrence: eventData.recurrenceRule ? [eventData.recurrenceRule] : undefined,
    reminders: {
      useDefault: false,
      overrides: eventData.reminders || [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 30 },
        { method: 'popup', minutes: 10 },
      ],
    },
    extendedProperties: {
      private: eventData.extendedProperties || {},
    },
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
    conferenceDataVersion: eventData.conferenceData ? 1 : 0,
    sendUpdates: 'all',
  });

  if (!response.data.id) {
    throw new Error('Failed to create calendar event');
  }

  return {
    id: response.data.id,
    htmlLink: response.data.htmlLink || '',
    hangoutLink: response.data.hangoutLink || undefined,
    start: {
      dateTime: response.data.start?.dateTime || eventData.startTime.toISOString(),
      timeZone: response.data.start?.timeZone || eventData.timezone,
    },
    end: {
      dateTime: response.data.end?.dateTime || eventData.endTime.toISOString(),
      timeZone: response.data.end?.timeZone || eventData.timezone,
    },
  };
}

export async function updateCalendarEvent(
  userId: string,
  eventId: string,
  eventData: Partial<CalendarEventData>
): Promise<CalendarEventResponse> {
  const accessToken = await getValidAccessToken(userId);
  oauth2Client.setCredentials({ access_token: accessToken });

  const event: calendar_v3.Schema$Event = {};

  if (eventData.summary) event.summary = eventData.summary;
  if (eventData.description) event.description = eventData.description;
  if (eventData.startTime) {
    event.start = { dateTime: eventData.startTime.toISOString(), timeZone: eventData.timezone };
  }
  if (eventData.endTime) {
    event.end = { dateTime: eventData.endTime.toISOString(), timeZone: eventData.timezone };
  }
  if (eventData.attendees) {
    event.attendees = eventData.attendees.map((a) => ({
      email: a.email,
      displayName: a.displayName,
      responseStatus: 'needsAction',
    }));
  }
  if (eventData.recurrenceRule) {
    event.recurrence = [eventData.recurrenceRule];
  }
  if (eventData.reminders) {
    event.reminders = {
      useDefault: false,
      overrides: eventData.reminders,
    };
  }

  const response = await calendar.events.patch({
    calendarId: 'primary',
    eventId,
    requestBody: event,
    sendUpdates: 'all',
  });

  return {
    id: response.data.id!,
    htmlLink: response.data.htmlLink || '',
    hangoutLink: response.data.hangoutLink || undefined,
    start: {
      dateTime: response.data.start?.dateTime || '',
      timeZone: response.data.start?.timeZone || '',
    },
    end: {
      dateTime: response.data.end?.dateTime || '',
      timeZone: response.data.end?.timeZone || '',
    },
  };
}

export async function deleteCalendarEvent(userId: string, eventId: string): Promise<void> {
  const accessToken = await getValidAccessToken(userId);
  oauth2Client.setCredentials({ access_token: accessToken });

  await calendar.events.delete({
    calendarId: 'primary',
    eventId,
    sendUpdates: 'all',
  });
}

export async function getCalendarEvent(userId: string, eventId: string): Promise<CalendarEventResponse | null> {
  const accessToken = await getValidAccessToken(userId);
  oauth2Client.setCredentials({ access_token: accessToken });

  try {
    const response = await calendar.events.get({
      calendarId: 'primary',
      eventId,
    });

    return {
      id: response.data.id!,
      htmlLink: response.data.htmlLink || '',
      hangoutLink: response.data.hangoutLink || undefined,
      start: {
        dateTime: response.data.start?.dateTime || '',
        timeZone: response.data.start?.timeZone || '',
      },
      end: {
        dateTime: response.data.end?.dateTime || '',
        timeZone: response.data.end?.timeZone || '',
      },
    };
  } catch (error: any) {
    if (error.code === 404) return null;
    throw error;
  }
}

export async function listCalendarEvents(
  userId: string,
  timeMin: Date,
  timeMax: Date
): Promise<CalendarEventResponse[]> {
  const accessToken = await getValidAccessToken(userId);
  oauth2Client.setCredentials({ access_token: accessToken });

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  return (
    response.data.items?.map((event) => ({
      id: event.id!,
      htmlLink: event.htmlLink || '',
      hangoutLink: event.hangoutLink || undefined,
      start: {
        dateTime: event.start?.dateTime || '',
        timeZone: event.start?.timeZone || '',
      },
      end: {
        dateTime: event.end?.dateTime || '',
        timeZone: event.end?.timeZone || '',
      },
    })) || []
  );
}

export async function checkAvailability(
  teacherId: string,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  // Get teacher's Google Calendar access token
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: { user: { select: { id: true } } },
  });

  if (!teacher?.user) return true; // No Google Calendar connected, assume available

  const events = await listCalendarEvents(teacher.user.id, startTime, endTime);

  // Check for conflicts
  for (const event of events) {
    const eventStart = new Date(event.start.dateTime);
    const eventEnd = new Date(event.end.dateTime);

    if (startTime < eventEnd && endTime > eventStart) {
      return false; // Conflict found
    }
  }

  return true;
}

export async function syncClassToCalendar(
  classId: string,
  action: 'create' | 'update' | 'delete'
): Promise<void> {
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      teacher: { include: { user: true } },
      student: { include: { user: true } },
      assignment: { include: { teacher: true, student: true } },
    },
  });

  if (!cls) throw new Error('Class not found');

  // Use teacher's calendar as primary
  const teacherUserId = cls.teacher.userId;
  const studentUserId = cls.student.userId;

  const eventData: CalendarEventData = {
    summary: `${cls.subject} Class - ${cls.teacher.user.name} & ${cls.student.user.name}`,
    description: `
Subject: ${cls.subject}
${cls.topic ? `Topic: ${cls.topic}` : ''}
Teacher: ${cls.teacher.user.name}
Student: ${cls.student.user.name}
Duration: ${cls.duration} minutes
${cls.teacherNotes ? `\nTeacher Notes: ${cls.teacherNotes}` : ''}
${cls.assignment ? `\nAssignment: ${cls.assignment.subject}` : ''}
---
Managed by TutorConnect
    `.trim(),
    startTime: cls.scheduledAt,
    endTime: addMinutes(cls.scheduledAt, cls.duration),
    timezone: cls.timezone,
    attendees: [
      { email: cls.teacher.user.email, displayName: cls.teacher.user.name },
      { email: cls.student.user.email, displayName: cls.student.user.name },
    ],
    conferenceData: true,
    recurrenceRule: cls.recurrenceRule || undefined,
    extendedProperties: {
      classId: cls.id,
      teacherId: cls.teacherId,
      studentId: cls.studentId,
      subject: cls.subject,
    },
  };

  try {
    if (action === 'create') {
      const response = await createCalendarEvent(teacherUserId, eventData);
      await prisma.class.update({
        where: { id: classId },
        data: {
          googleCalendarEventId: response.id,
          googleMeetLink: response.hangoutLink,
        },
      });
    } else if (action === 'update' && cls.googleCalendarEventId) {
      await updateCalendarEvent(teacherUserId, cls.googleCalendarEventId, eventData);
    } else if (action === 'delete' && cls.googleCalendarEventId) {
      await deleteCalendarEvent(teacherUserId, cls.googleCalendarEventId);
      await prisma.class.update({
        where: { id: classId },
        data: { googleCalendarEventId: null, googleMeetLink: null },
      });
    }
  } catch (error) {
    console.error(`Failed to ${action} calendar event for class ${classId}:`, error);
    // Don't throw - calendar sync failure shouldn't block class operations
  }
}

export async function syncDemoToCalendar(
  demoId: string,
  action: 'create' | 'update' | 'delete'
): Promise<void> {
  const demo = await prisma.demoClass.findUnique({
    where: { id: demoId },
    include: {
      teacher: { include: { user: true } },
      student: { include: { user: true } },
    },
  });

  if (!demo) throw new Error('Demo class not found');

  const teacherUserId = demo.teacher.userId;
  const studentUserId = demo.student.userId;

  const eventData: CalendarEventData = {
    summary: `Demo Class: ${demo.subject} - ${demo.teacher.user.name} & ${demo.student.user.name}`,
    description: `
Demo Class for ${demo.subject}
Teacher: ${demo.teacher.user.name}
Student: ${demo.student.user.name}
Duration: ${demo.duration} minutes
---
Managed by TutorConnect
    `.trim(),
    startTime: demo.scheduledAt!,
    endTime: addMinutes(demo.scheduledAt!, demo.duration),
    timezone: demo.timezone,
    attendees: [
      { email: demo.teacher.user.email, displayName: demo.teacher.user.name },
      { email: demo.student.user.email, displayName: demo.student.user.name },
    ],
    conferenceData: true,
    extendedProperties: {
      demoId: demo.id,
      teacherId: demo.teacherId,
      studentId: demo.studentId,
      subject: demo.subject,
    },
  };

  try {
    if (action === 'create') {
      const response = await createCalendarEvent(teacherUserId, eventData);
      await prisma.demoClass.update({
        where: { id: demoId },
        data: {
          googleCalendarEventId: response.id,
          googleMeetLink: response.hangoutLink,
        },
      });
    } else if (action === 'update' && demo.googleCalendarEventId) {
      await updateCalendarEvent(teacherUserId, demo.googleCalendarEventId, eventData);
    } else if (action === 'delete' && demo.googleCalendarEventId) {
      await deleteCalendarEvent(teacherUserId, demo.googleCalendarEventId);
      await prisma.demoClass.update({
        where: { id: demoId },
        data: { googleCalendarEventId: null, googleMeetLink: null },
      });
    }
  } catch (error) {
    console.error(`Failed to ${action} calendar event for demo ${demoId}:`, error);
  }
}

// Webhook handler for Google Calendar push notifications
export async function handleCalendarWebhook(
  channelId: string,
  resourceId: string,
  resourceState: 'exists' | 'not_exists' | 'sync'
): Promise<void> {
  // Find the class/demo associated with this channel
  // This would require storing channelId when setting up watch
  console.log('Calendar webhook received:', { channelId, resourceId, resourceState });

  if (resourceState === 'not_exists') {
    // Event was deleted in Google Calendar
    // Find and update local record
    const cls = await prisma.class.findFirst({
      where: { googleCalendarEventId: resourceId },
    });

    if (cls) {
      await prisma.class.update({
        where: { id: cls.id },
        data: {
          googleCalendarEventId: null,
          googleMeetLink: null,
          status: 'CANCELLED',
        },
      });
    }
  }
}

export function getGoogleAuthUrl(state?: string): string {
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state,
  });
}

export async function handleGoogleCallback(code: string): Promise<{ tokens: any; userInfo: any }> {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Get user info
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();

  return { tokens, userInfo: userInfo.data };
}

export async function setupCalendarWatch(userId: string, webhookUrl: string): Promise<string> {
  const accessToken = await getValidAccessToken(userId);
  oauth2Client.setCredentials({ access_token: accessToken });

  const channelId = `tutorconnect-${userId}-${Date.now()}`;

  await calendar.events.watch({
    calendarId: 'primary',
    requestBody: {
      id: channelId,
      type: 'web_hook',
      address: webhookUrl,
      params: { ttl: '86400' }, // 24 hours
    },
  });

  return channelId;
}

export async function stopCalendarWatch(userId: string, channelId: string, resourceId: string): Promise<void> {
  const accessToken = await getValidAccessToken(userId);
  oauth2Client.setCredentials({ access_token: accessToken });

  await calendar.channels.stop({
    requestBody: { id: channelId, resourceId },
  });
}