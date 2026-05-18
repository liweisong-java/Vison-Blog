export function formatReadingTime(minutes: number) {
  return `预计阅读 ${minutes} 分钟`;
}

export function formatDisplayDate(date: Date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}
