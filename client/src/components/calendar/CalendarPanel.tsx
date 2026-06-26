import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { useCalendarEvents } from '@/hooks/useCalendarEvents'
import { getCurrentWeekRange } from '@/lib/week'
import { ToggleBar } from './ToggleBar'
import { WeekNav } from './WeekNav'
import { TimeGrid } from './TimeGrid'

export function CalendarPanel() {
  const { weekStart, weekEnd } = useMemo(() => getCurrentWeekRange(), [])
  const { data: events, isLoading, isError, refetch } = useCalendarEvents(weekStart, weekEnd)

  return (
    <div className="flex flex-col gap-3 rounded-card bg-ivory p-4">
      <ToggleBar />
      <WeekNav />
      {isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-rose">
          <p className="font-body text-sm">Couldn't load your calendar.</p>
          <Button size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : isLoading ? (
        <div className="h-[480px] animate-pulse rounded-card bg-ivory/60" />
      ) : (
        <TimeGrid events={events ?? []} />
      )}
    </div>
  )
}
