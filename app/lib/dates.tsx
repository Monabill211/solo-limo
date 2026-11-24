export const TZ = 'Africa/Cairo';

export const todayISO = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());

const parse = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

export const isISO = (s: unknown): s is string =>
  typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parse(s));

export const diffDays = (start: string, end: string) =>
  Math.round((parse(end) - parse(start)) / 86400000);

export const addDays = (iso: string, n: number) =>
  new Date(parse(iso) + n * 86400000).toISOString().slice(0, 10);

export const toISO = (y: number, m: number, d: number) =>
  new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);