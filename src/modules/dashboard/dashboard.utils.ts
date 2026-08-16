const INDIA_TIMEZONE = "Asia/Kolkata";

export function getIndiaDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIMEZONE,
  }).format(date);
}

export function getIndiaDateStart(date: string): Date {
  return new Date(`${date}T00:00:00+05:30`);
}

export function getIndiaDateEnd(date: string): Date {
  return new Date(`${date}T23:59:59.999+05:30`);
}
