import { prisma } from '@/lib/db/prisma';
import { addDays, startOfWeek, endOfWeek, format, parse, isBefore, isAfter, addMinutes, differenceInMinutes } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { getDayName } from '@/lib/utils';

export interface TimeSlot {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  score?: number;
}

export interface AvailabilitySlot {
  dayOfWeek: number;
  startMinutes: number; // Minutes from midnight
  endMinutes: number;
  source: 'teacher' | 'student';
}

export interface SchedulingInput {
  studentId: string;
  teacherId: string;
  assignmentId: string;
  subject: string;
  classesPerWeek: number;
  durationMinutes: number;
  startDate: Date;
  endDate?: Date;
  studentTimezone: string;
  teacherTimezone: string;
  bufferMinutes?: number;
  maxClassesPerDay?: number;
}

export interface ScheduleResult {
  success: boolean;
  schedule: WeeklyScheduleItem[];
  conflicts: ConflictInfo[];
  alternatives?: AlternativeSchedule[];
  message?: string;
}

export interface WeeklyScheduleItem {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  duration: number;
  subject: string;
  score: number;
  utcStartTime: string;
  utcEndTime: string;
}

export interface ConflictInfo {
  type: 'TEACHER_UNAVAILABLE' | 'STUDENT_UNAVAILABLE' | 'EXISTING_BOOKING' | 'HOLIDAY' | 'BUFFER_VIOLATION' | 'MAX_CLASSES_EXCEEDED';
  dayOfWeek: number;
  time: string;
  details: string;
}

export interface AlternativeSchedule {
  schedule: WeeklyScheduleItem[];
  score: number;
  compromises: string[];
}

export interface AvailabilityGrid {
  teacher: AvailabilitySlot[];
  student: AvailabilitySlot[];
}

// Indian holidays 2024-2025
const INDIAN_HOLIDAYS = [
  '2024-01-26', // Republic Day
  '2024-03-08', // Maha Shivaratri
  '2024-03-25', // Holi
  '2024-04-09', // Ugadi/Gudi Padwa
  '2024-04-11', // Eid al-Fitr
  '2024-04-17', // Ram Navami
  '2024-05-01', // Labour Day
  '2024-06-17', // Eid al-Adha
  '2024-07-17', // Muharram
  '2024-08-15', // Independence Day
  '2024-08-19', // Raksha Bandhan
  '2024-08-26', // Janmashtami
  '2024-09-07', // Ganesh Chaturthi
  '2024-10-02', // Gandhi Jayanti
  '2024-10-12', // Dussehra
  '2024-11-01', // Diwali
  '2024-11-15', // Guru Nanak Jayanti
  '2024-12-25', // Christmas
  '2025-01-01', // New Year
  '2025-01-14', // Makar Sankranti
  '2025-01-26', // Republic Day
];

function isHoliday(date: Date): boolean {
  const dateStr = format(date, 'yyyy-MM-dd');
  return INDIAN_HOLIDAYS.includes(dateStr);
}

function timeStringToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function getOverlappingSlots(
  teacherSlots: AvailabilitySlot[],
  studentSlots: AvailabilitySlot[],
  durationMinutes: number,
  bufferMinutes: number
): TimeSlot[] {
  const overlaps: TimeSlot[] = [];

  for (const teacher of teacherSlots) {
    for (const student of studentSlots) {
      if (teacher.dayOfWeek !== student.dayOfWeek) continue;

      // Find overlap
      const overlapStart = Math.max(teacher.startMinutes, student.startMinutes);
      const overlapEnd = Math.min(teacher.endMinutes, student.endMinutes);

      // Check if overlap can accommodate duration + buffer
      if (overlapEnd - overlapStart >= durationMinutes + bufferMinutes * 2) {
        // Generate possible start times within overlap
        for (let start = overlapStart; start + durationMinutes + bufferMinutes <= overlapEnd; start += 30) {
          overlaps.push({
            dayOfWeek: teacher.dayOfWeek,
            startTime: minutesToTimeString(start),
            endTime: minutesToTimeString(start + durationMinutes),
            score: calculateSlotScore(start, teacher, student, durationMinutes),
          });
        }
      }
    }
  }

  return overlaps;
}

function calculateSlotScore(
  startMinutes: number,
  teacherSlot: AvailabilitySlot,
  studentSlot: AvailabilitySlot,
  durationMinutes: number
): number {
  let score = 100;

  // Prefer slots centered in availability (not at edges)
  const teacherCenter = (teacherSlot.startMinutes + teacherSlot.endMinutes) / 2;
  const studentCenter = (studentSlot.startMinutes + studentSlot.endMinutes) / 2;
  const slotCenter = startMinutes + durationMinutes / 2;

  const teacherDist = Math.abs(slotCenter - teacherCenter);
  const studentDist = Math.abs(slotCenter - studentCenter);
  score -= (teacherDist + studentDist) / 10;

  // Prefer evening slots (after 5 PM) for students
  if (startMinutes >= 17 * 60) score += 10;
  if (startMinutes >= 18 * 60) score += 5;

  // Prefer consistent timing (same time each day)
  // This would be evaluated across days

  return Math.max(0, score);
}

async function getExistingBookings(
  teacherId: string,
  studentId: string,
  startDate: Date,
  endDate: Date
): Promise<{ teacher: Date[]; student: Date[] }> {
  const [teacherClasses, studentClasses] = await Promise.all([
    prisma.class.findMany({
      where: {
        teacherId,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        scheduledAt: { gte: startDate, lte: endDate },
      },
      select: { scheduledAt: true, duration: true },
    }),
    prisma.class.findMany({
      where: {
        studentId,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        scheduledAt: { gte: startDate, lte: endDate },
      },
      select: { scheduledAt: true, duration: true },
    }),
  ]);

  const teacherBookings = teacherClasses.flatMap((c) => {
    const bookings: Date[] = [];
    const start = new Date(c.scheduledAt);
    const end = new Date(start.getTime() + c.duration * 60000);
    for (let d = new Date(start); d < end; d = addMinutes(d, 30)) {
      bookings.push(new Date(d));
    }
    return bookings;
  });

  const studentBookings = studentClasses.flatMap((c) => {
    const bookings: Date[] = [];
    const start = new Date(c.scheduledAt);
    const end = new Date(start.getTime() + c.duration * 60000);
    for (let d = new Date(start); d < end; d = addMinutes(d, 30)) {
      bookings.push(new Date(d));
    }
    return bookings;
  });

  return { teacher: teacherBookings, student: studentBookings };
}

async function getTeacherExceptions(
  teacherId: string,
  startDate: Date,
  endDate: Date
): Promise<Date[]> {
  const exceptions = await prisma.teacherAvailabilityException.findMany({
    where: {
      teacherId,
      date: { gte: startDate, lte: endDate },
    },
  });

  const blockedDates: Date[] = [];
  for (const exc of exceptions) {
    const date = new Date(exc.date);
    if (!exc.startTime && !exc.endTime) {
      // Full day blocked
      blockedDates.push(date);
    } else {
      // Partial day - would need more complex handling
      blockedDates.push(date);
    }
  }
  return blockedDates;
}

function filterConflicts(
  slots: TimeSlot[],
  existingBookings: Date[],
  exceptions: Date[],
  durationMinutes: number,
  bufferMinutes: number,
  timezone: string
): { valid: TimeSlot[]; conflicts: ConflictInfo[] } {
  const valid: TimeSlot[] = [];
  const conflicts: ConflictInfo[] = [];

  for (const slot of slots) {
    let hasConflict = false;
    let conflictReason = '';

    // Check holidays
    // We need to check for each occurrence in the date range
    // For now, check if the day of week falls on a holiday in the first week
    const sampleDate = getNextDateForDay(new Date(), slot.dayOfWeek);
    if (isHoliday(sampleDate)) {
      hasConflict = true;
      conflictReason = 'Holiday';
    }

    // Check existing bookings (simplified - would need to check each week)
    // This is a simplified check
    const slotStartMinutes = timeStringToMinutes(slot.startTime);
    const slotEndMinutes = timeStringToMinutes(slot.endTime);

    for (const booking of existingBookings) {
      const bookingDay = booking.getDay();
      if (bookingDay !== slot.dayOfWeek) continue;

      const bookingStart = timeStringToMinutes(format(booking, 'HH:mm'));
      const bookingEnd = bookingStart + durationMinutes; // approximate

      // Check overlap with buffer
      if (
        slotStartMinutes < bookingEnd + bufferMinutes &&
        slotEndMinutes > bookingStart - bufferMinutes
      ) {
        hasConflict = true;
        conflictReason = 'Existing booking';
        break;
      }
    }

    // Check exceptions
    for (const exc of exceptions) {
      if (exc.getDay() === slot.dayOfWeek) {
        hasConflict = true;
        conflictReason = 'Teacher unavailable';
        break;
      }
    }

    if (hasConflict) {
      conflicts.push({
        type: 'EXISTING_BOOKING',
        dayOfWeek: slot.dayOfWeek,
        time: slot.startTime,
        details: conflictReason,
      });
    } else {
      valid.push(slot);
    }
  }

  return { valid, conflicts };
}

function getNextDateForDay(from: Date, dayOfWeek: number): Date {
  const result = new Date(from);
  const currentDay = result.getDay();
  const diff = (dayOfWeek - currentDay + 7) % 7;
  result.setDate(result.getDate() + diff);
  return result;
}

function selectOptimalSchedule(
  validSlots: TimeSlot[],
  classesPerWeek: number,
  preferredDays?: number[],
  preferredTimeRange?: { start: string; end: string }
): { schedule: WeeklyScheduleItem[]; score: number } {
  // Group slots by day
  const slotsByDay: Record<number, TimeSlot[]> = {};
  for (const slot of validSlots) {
    if (!slotsByDay[slot.dayOfWeek]) slotsByDay[slot.dayOfWeek] = [];
    slotsByDay[slot.dayOfWeek].push(slot);
  }

  // Sort each day by score
  for (const day in slotsByDay) {
    slotsByDay[Number(day)].sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  // Try to find best combination
  const days = Object.keys(slotsByDay).map(Number).sort();
  let bestSchedule: WeeklyScheduleItem[] = [];
  let bestScore = -1;

  // Simple greedy: pick best slot from each day until we have enough classes
  // In a real implementation, this would be a more sophisticated optimization
  for (const day of days) {
    if (bestSchedule.length >= classesPerWeek) break;

    const daySlots = slotsByDay[day];
    if (daySlots.length === 0) continue;

    // Filter by preferred days if specified
    if (preferredDays && !preferredDays.includes(day)) continue;

    // Filter by preferred time range
    let filteredSlots = daySlots;
    if (preferredTimeRange) {
      const prefStart = timeStringToMinutes(preferredTimeRange.start);
      const prefEnd = timeStringToMinutes(preferredTimeRange.end);
      filteredSlots = daySlots.filter(
        (s) => timeStringToMinutes(s.startTime) >= prefStart && timeStringToMinutes(s.endTime) <= prefEnd
      );
    }

    if (filteredSlots.length > 0) {
      const bestSlot = filteredSlots[0];
      bestSchedule.push({
        dayOfWeek: bestSlot.dayOfWeek,
        startTime: bestSlot.startTime,
        endTime: bestSlot.endTime,
        duration: timeStringToMinutes(bestSlot.endTime) - timeStringToMinutes(bestSlot.startTime),
        subject: '', // Will be set by caller
        score: bestSlot.score || 0,
        utcStartTime: '',
        utcEndTime: '',
      });
      bestScore += bestSlot.score || 0;
    }
  }

  // If we don't have enough, try without preferred day filter
  if (bestSchedule.length < classesPerWeek) {
    for (const day of days) {
      if (bestSchedule.length >= classesPerWeek) break;
      if (bestSchedule.some((s) => s.dayOfWeek === day)) continue;

      const daySlots = slotsByDay[day];
      if (daySlots.length > 0) {
        const bestSlot = daySlots[0];
        bestSchedule.push({
          dayOfWeek: bestSlot.dayOfWeek,
          startTime: bestSlot.startTime,
          endTime: bestSlot.endTime,
          duration: timeStringToMinutes(bestSlot.endTime) - timeStringToMinutes(bestSlot.startTime),
          subject: '',
          score: bestSlot.score || 0,
          utcStartTime: '',
          utcEndTime: '',
        });
        bestScore += bestSlot.score || 0;
      }
    }
  }

  return { schedule: bestSchedule, score: bestScore };
}

function generateAlternatives(
  validSlots: TimeSlot[],
  classesPerWeek: number,
  selectedSchedule: WeeklyScheduleItem[]
): AlternativeSchedule[] {
  const alternatives: AlternativeSchedule[] = [];
  const usedSlots = new Set(selectedSchedule.map((s) => `${s.dayOfWeek}-${s.startTime}`));

  // Find alternative slots for each scheduled class
  for (const item of selectedSchedule) {
    const daySlots = validSlots.filter((s) => s.dayOfWeek === item.dayOfWeek && !usedSlots.has(`${s.dayOfWeek}-${s.startTime}`));
    if (daySlots.length > 0) {
      daySlots.sort((a, b) => (b.score || 0) - (a.score || 0));
      const alt = daySlots[0];
      alternatives.push({
        schedule: [
          {
            dayOfWeek: alt.dayOfWeek,
            startTime: alt.startTime,
            endTime: alt.endTime,
            duration: timeStringToMinutes(alt.endTime) - timeStringToMinutes(alt.startTime),
            subject: item.subject,
            score: alt.score || 0,
            utcStartTime: '',
            utcEndTime: '',
          },
        ],
        score: alt.score || 0,
        compromises: [`Alternative time for ${getDayName(item.dayOfWeek)}`],
      });
    }
  }

  return alternatives.slice(0, 3);
}

export async function generateSchedule(input: SchedulingInput): Promise<ScheduleResult> {
  const {
    studentId,
    teacherId,
    assignmentId,
    subject,
    classesPerWeek,
    durationMinutes,
    startDate,
    endDate,
    studentTimezone,
    teacherTimezone,
    bufferMinutes = 15,
    maxClassesPerDay = 4,
  } = input;

  try {
    // 1. Get availability for both parties
    const [teacherAvail, studentAvail, teacherExceptions, existingBookings] = await Promise.all([
      prisma.teacherAvailability.findMany({
        where: { teacherId, isRecurring: true },
      }),
      prisma.studentAvailability.findMany({
        where: { studentId, isRecurring: true },
      }),
      prisma.teacherAvailabilityException.findMany({
        where: {
          teacherId,
          date: { gte: startDate, lte: endDate || addDays(startDate, 90) },
        },
      }),
      getExistingBookings(teacherId, studentId, startDate, endDate || addDays(startDate, 90)),
    ]);

    // 2. Convert to availability slots
    const teacherSlots: AvailabilitySlot[] = teacherAvail.map((a) => ({
      dayOfWeek: a.dayOfWeek,
      startMinutes: timeStringToMinutes(a.startTime),
      endMinutes: timeStringToMinutes(a.endTime),
      source: 'teacher',
    }));

    const studentSlots: AvailabilitySlot[] = studentAvail.map((a) => ({
      dayOfWeek: a.dayOfWeek,
      startMinutes: timeStringToMinutes(a.startTime),
      endMinutes: timeStringToMinutes(a.endTime),
      source: 'student',
    }));

    // 3. Find overlapping slots
    const overlappingSlots = getOverlappingSlots(teacherSlots, studentSlots, durationMinutes, bufferMinutes);

    // 4. Filter conflicts
    const exceptionDates = teacherExceptions.map((e) => new Date(e.date));
    const { valid: validSlots, conflicts } = filterConflicts(
      overlappingSlots,
      [...existingBookings.teacher, ...existingBookings.student],
      exceptionDates,
      durationMinutes,
      bufferMinutes,
      teacherTimezone
    );

    // 5. Get preferred days/times from student
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { preferredDays: true, preferredTimeStart: true, preferredTimeEnd: true },
    });

    const preferredDays = student?.preferredDays?.map((d) => ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].indexOf(d)) || [];
    const preferredTimeRange = student?.preferredTimeStart && student?.preferredTimeEnd
      ? { start: student.preferredTimeStart, end: student.preferredTimeEnd }
      : undefined;

    // 6. Select optimal schedule
    const { schedule, score } = selectOptimalSchedule(
      validSlots,
      classesPerWeek,
      preferredDays,
      preferredTimeRange
    );

    // 7. Convert to UTC for storage
    const scheduleWithUtc = schedule.map((item) => {
      const sampleDate = getNextDateForDay(startDate, item.dayOfWeek);
      const startDateTime = new Date(sampleDate);
      const [startH, startM] = item.startTime.split(':').map(Number);
      startDateTime.setHours(startH, startM, 0, 0);

      const endDateTime = new Date(startDateTime.getTime() + item.duration * 60000);

      return {
        ...item,
        subject,
        utcStartTime: startDateTime.toISOString(),
        utcEndTime: endDateTime.toISOString(),
      };
    });

    // 8. Generate alternatives if not perfect
    const alternatives = scheduleWithUtc.length < classesPerWeek
      ? generateAlternatives(validSlots, classesPerWeek, scheduleWithUtc)
      : [];

    return {
      success: scheduleWithUtc.length === classesPerWeek,
      schedule: scheduleWithUtc,
      conflicts,
      alternatives: alternatives.length > 0 ? alternatives : undefined,
      message:
        scheduleWithUtc.length === classesPerWeek
          ? 'Perfect schedule found'
          : `Could only schedule ${scheduleWithUtc.length} of ${classesPerWeek} classes per week`,
    };
  } catch (error) {
    console.error('Scheduling error:', error);
    return {
      success: false,
      schedule: [],
      conflicts: [],
      message: 'Failed to generate schedule',
    };
  }
}

export async function checkScheduleConflict(
  teacherId: string,
  studentId: string,
  scheduledAt: Date,
  durationMinutes: number,
  excludeClassId?: string
): Promise<{ hasConflict: boolean; conflicts: ConflictInfo[] }> {
  const conflicts: ConflictInfo[] = [];

  // Check teacher existing classes
  const teacherClasses = await prisma.class.findMany({
    where: {
      teacherId,
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      id: { not: excludeClassId },
      scheduledAt: {
        lt: new Date(scheduledAt.getTime() + durationMinutes * 60000),
        gte: new Date(scheduledAt.getTime() - durationMinutes * 60000),
      },
    },
  });

  for (const cls of teacherClasses) {
    const clsEnd = new Date(cls.scheduledAt.getTime() + cls.duration * 60000);
    const newEnd = new Date(scheduledAt.getTime() + durationMinutes * 60000);

    if (scheduledAt < clsEnd && newEnd > cls.scheduledAt) {
      conflicts.push({
        type: 'EXISTING_BOOKING',
        dayOfWeek: scheduledAt.getDay(),
        time: format(scheduledAt, 'HH:mm'),
        details: `Teacher has class with another student at this time`,
      });
    }
  }

  // Check student existing classes
  const studentClasses = await prisma.class.findMany({
    where: {
      studentId,
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      id: { not: excludeClassId },
      scheduledAt: {
        lt: new Date(scheduledAt.getTime() + durationMinutes * 60000),
        gte: new Date(scheduledAt.getTime() - durationMinutes * 60000),
      },
    },
  });

  for (const cls of studentClasses) {
    const clsEnd = new Date(cls.scheduledAt.getTime() + cls.duration * 60000);
    const newEnd = new Date(scheduledAt.getTime() + durationMinutes * 60000);

    if (scheduledAt < clsEnd && newEnd > cls.scheduledAt) {
      conflicts.push({
        type: 'EXISTING_BOOKING',
        dayOfWeek: scheduledAt.getDay(),
        time: format(scheduledAt, 'HH:mm'),
        details: `Student has another class at this time`,
      });
    }
  }

  // Check teacher exceptions
  const exceptions = await prisma.teacherAvailabilityException.findMany({
    where: {
      teacherId,
      date: {
        gte: new Date(scheduledAt.setHours(0, 0, 0, 0)),
        lte: new Date(scheduledAt.setHours(23, 59, 59, 999)),
      },
    },
  });

  for (const exc of exceptions) {
    if (!exc.startTime && !exc.endTime) {
      conflicts.push({
        type: 'TEACHER_UNAVAILABLE',
        dayOfWeek: scheduledAt.getDay(),
        time: format(scheduledAt, 'HH:mm'),
        details: exc.reason || 'Teacher marked as unavailable',
      });
    }
  }

  return { hasConflict: conflicts.length > 0, conflicts };
}

export function calculateRecurrenceEndDate(
  startDate: Date,
  classesPerWeek: number,
  totalClasses?: number,
  maxWeeks?: number
): Date {
  if (totalClasses) {
    const weeksNeeded = Math.ceil(totalClasses / classesPerWeek);
    return addDays(startDate, weeksNeeded * 7);
  }
  if (maxWeeks) {
    return addDays(startDate, maxWeeks * 7);
  }
  // Default: 6 months
  return addDays(startDate, 180);
}

export function generateRecurrenceRule(
  daysOfWeek: number[],
  startDate: Date,
  endDate: Date
): string {
  const dayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const byDay = daysOfWeek.map((d) => dayNames[d]).join(',');
  const until = format(endDate, "yyyyMMdd'T'HHmmss'Z'");

  return `FREQ=WEEKLY;BYDAY=${byDay};UNTIL=${until}`;
}