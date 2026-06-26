import { useQuery } from '@tanstack/react-query'
import { fetchCalendarEvents } from '@/lib/api'

export function useCalendarEvents(weekStart: Date, weekEnd: Date) {
  return useQuery({
    queryKey: ['calendar', 'events', weekStart.toISOString(), weekEnd.toISOString()],
    queryFn: () => fetchCalendarEvents(weekStart.toISOString(), weekEnd.toISOString()),
    staleTime: 5 * 60 * 1000,
  })
}
