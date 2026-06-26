export function getCurrentWeekRange(today = new Date()) {
  const weekStart = new Date(today)
  weekStart.setHours(0, 0, 0, 0)
  const daysSinceMonday = (weekStart.getDay() + 6) % 7
  weekStart.setDate(weekStart.getDate() - daysSinceMonday)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  return { weekStart, weekEnd }
}
