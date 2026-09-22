export function parseISODate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function isSameMonth(date: Date, reference: Date): boolean {
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
}

export function isFutureMonth(date: Date, reference = today()): boolean {
  return (
    date.getFullYear() > reference.getFullYear() ||
    (date.getFullYear() === reference.getFullYear() &&
      date.getMonth() > reference.getMonth())
  );
}

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(date: Date): string {
  return `${monthFormatter.format(date)} ${date.getFullYear()}`;
}

export function formatDate(value: string): string {
  const date = parseISODate(value);
  return `${monthFormatter.format(date)} ${date.getDate()}`;
}
