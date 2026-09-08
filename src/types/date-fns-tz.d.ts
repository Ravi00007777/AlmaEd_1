// Type declarations for date-fns-tz
declare module 'date-fns-tz' {
  export function toZonedTime(date: Date | string | number, timeZone: string): Date;
  export function formatInTimeZone(date: Date | string | number, timeZone: string, format: string, options?: { timeZone?: string }): string;
  export function zonedTimeToUtc(date: string | number | Date, timeZone: string): Date;
  export function utcToZonedTime(date: string | number | Date, timeZone: string): Date;
  export function getTimezoneOffset(timeZone: string, date?: Date): number;
}