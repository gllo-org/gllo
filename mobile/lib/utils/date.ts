export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays === 2) return '그저께';

  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${formatDate(dateString)} ${hours}:${minutes}`;
}

export function getYearMonth(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthProgress(yearMonth: string): number {
  const [year, month] = yearMonth.split('-').map(Number);
  const now = new Date();
  const daysInMonth = new Date(year, month, 0).getDate();
  const currentDay = now.getFullYear() === year && now.getMonth() + 1 === month
    ? now.getDate()
    : daysInMonth;
  return (currentDay / daysInMonth) * 100;
}

export function getRemainingDays(yearMonth: string): number {
  const [year, month] = yearMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const now = new Date();
  if (now.getFullYear() === year && now.getMonth() + 1 === month) {
    return daysInMonth - now.getDate();
  }
  return 0;
}
