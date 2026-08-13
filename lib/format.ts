const TIME_ZONE = 'Europe/Budapest';

const hufFormatter = new Intl.NumberFormat('hu-HU', {
  style: 'currency',
  currency: 'HUF',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('hu-HU');

const dateFormatter = new Intl.DateTimeFormat('hu-HU', { dateStyle: 'medium', timeZone: TIME_ZONE });

const dateTimeFormatter = new Intl.DateTimeFormat('hu-HU', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: TIME_ZONE,
});

const preciseFormatter = new Intl.DateTimeFormat('hu-HU', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZone: TIME_ZONE,
});

export function formatHuf(amount: number): string {
  return hufFormatter.format(amount);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '–';
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return '–';
  return dateTimeFormatter.format(new Date(value));
}

export function formatTimestamp(value: Date | string | null | undefined): string {
  if (!value) return '–';
  return preciseFormatter.format(new Date(value));
}

export function formatDuration(days: number | null): string {
  if (days === null) return 'Határozatlan idejű';
  if (days % 365 === 0) return `${days / 365} év`;
  if (days % 30 === 0) return `${days / 30} hónap`;
  return `${days} nap`;
}

export function formatSeats(count: number): string {
  return `${formatNumber(count)} hely`;
}
