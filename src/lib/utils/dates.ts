export function toDate(ts: string): Date {
  return new Date(ts);
}

export function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString();
}

export function formatDateTime(ts: string): string {
  return new Date(ts).toLocaleString();
}

export function formatDateTimeShort(ts: string): string {
  return new Date(ts).toLocaleString([], { dateStyle: "short", timeStyle: "short" });
}

export function startOfDay(ts: string): string {
  const date = new Date(ts);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export function dayKey(ts: string): string {
  const date = new Date(ts);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function weekdayKey(ts: string): string {
  return new Date(ts).toLocaleDateString(undefined, { weekday: "short" });
}

export function hourKey(ts: string): string {
  return `${new Date(ts).getHours()}`.padStart(2, "0");
}

export function durationSeconds(start: string, end: string): number {
  return Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / 1000);
}
