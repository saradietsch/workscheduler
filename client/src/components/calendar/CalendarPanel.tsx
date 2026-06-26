import { useMemo, useState } from 'react'
import type { CalendarEvent } from '@shared'
import { Button } from '@/components/ui/button'
import { useCalendarEvents } from '@/hooks/useCalendarEvents'
import {
  useSuggestions,
  useGenerateSuggestions,
  useAcceptSuggestion,
  useDismissSuggestion,
  useRepositionSuggestion,
} from '@/hooks/useSuggestions'
import { getCurrentWeekRange } from '@/lib/week'
import { ToggleBar } from './ToggleBar'
import { WeekNav } from './WeekNav'
import { TimeGrid } from './TimeGrid'
import { EventEditDialog } from './EventEditDialog'

export function CalendarPanel() {
  const { weekStart, weekEnd } = useMemo(() => getCurrentWeekRange(), [])
  const { data: events, isLoading, isError, refetch } = useCalendarEvents(weekStart, weekEnd)

  const [showSuggested, setShowSuggested] = useState(false)
  const { data: suggestions } = useSuggestions(weekStart, weekEnd, showSuggested)
  const generateSuggestions = useGenerateSuggestions(weekStart, weekEnd)
  const acceptSuggestion = useAcceptSuggestion(weekStart, weekEnd)
  const dismissSuggestion = useDismissSuggestion(weekStart, weekEnd)
  const repositionSuggestion = useRepositionSuggestion(weekStart, weekEnd)

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  return (
    <div className="flex flex-col gap-3 rounded-card bg-ivory p-4">
      <ToggleBar showSuggested={showSuggested} onToggle={setShowSuggested} />
      <WeekNav />
      {showSuggested && (suggestions?.length ?? 0) === 0 && (
        <div className="flex items-center justify-end">
          <Button
            size="sm"
            onClick={() => generateSuggestions.mutate()}
            disabled={generateSuggestions.isPending}
          >
            {generateSuggestions.isPending ? 'Generating…' : 'Generate suggestions'}
          </Button>
        </div>
      )}
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
        <TimeGrid
          events={events ?? []}
          suggestions={showSuggested ? suggestions ?? [] : []}
          onAcceptSuggestion={(id) => acceptSuggestion.mutate(id)}
          onDismissSuggestion={(id) => dismissSuggestion.mutate(id)}
          onRepositionSuggestion={(id, start, end) => repositionSuggestion.mutate({ id, start, end })}
          onEventClick={setSelectedEvent}
        />
      )}
      <EventEditDialog event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  )
}
