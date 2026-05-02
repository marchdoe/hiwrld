const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const nths: Record<number, string> = {
  1: 'st',
  2: 'nd',
  3: 'rd',
  21: 'st',
  22: 'nd',
  23: 'rd',
  31: 'st',
};

export function generateTitle(body: string, created: Date = new Date()): string {
  const m = body.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/m);
  if (m?.[1]) return m[1].trim();
  const day = days[created.getDay()] ?? '';
  const month = months[created.getMonth()] ?? '';
  const date = created.getDate();
  const nth = nths[date] ?? 'th';
  return `Untitled - ${day}, ${month} ${date}${nth}, ${created.getFullYear()}`;
}
