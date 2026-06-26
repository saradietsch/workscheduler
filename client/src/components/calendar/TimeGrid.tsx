import { useEffect, useRef } from 'react'
import { DndContext, useDraggable, type DragEndEvent } from '@dnd-kit/core'
import type { CalendarEvent, SuggestedBlock, JobColor } from '@shared'
import { Switch } from '@/components/ui/switch'

const HOUR_HEIGHT = 40
const TIME_LABEL_WIDTH = 48
const DEFAULT_SCROLL_HOUR = 7
const VISIBLE_HOURS = 12
const SNAP_MINUTES = 15

const hours = Array.from({ length: 24 }, (_, i) => i)
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const jobColorClasses: Record<JobColor, string> = {
  mango: 'bg-mango',
  blush: 'bg-blush',
  sunflower: 'bg-sunflower',
  lilac: 'bg-lilac',
  rose: 'bg-rose',
}

function formatHour(hour: number) {
  const period = hour < 12 ? 'AM' : 'PM'
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display} ${period}`
}

function minutesIntoDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes()
}

function blockPosition(start: Date, end: Date) {
  const dayIndex = (start.getDay() + 6) % 7
  const top = (minutesIntoDay(start) / 60) * HOUR_HEIGHT
  const height = Math.max(((minutesIntoDay(end) - minutesIntoDay(start)) / 60) * HOUR_HEIGHT, 20)
  return {
    top,
    height,
    left: `calc(${TIME_LABEL_WIDTH}px + (100% - ${TIME_LABEL_WIDTH}px) * ${dayIndex} / 7)`,
    width: `calc((100% - ${TIME_LABEL_WIDTH}px) / 7)`,
  }
}

interface SuggestionBlockProps {
  suggestion: SuggestedBlock
  onAccept: (id: string) => void
  onDismiss: (id: string) => void
}

function SuggestionBlock({ suggestion, onAccept, onDismiss }: SuggestionBlockProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: suggestion.id,
  })
  const position = blockPosition(new Date(suggestion.start), new Date(suggestion.end))

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="absolute cursor-grab overflow-hidden rounded-md border border-plum/10 p-1 text-xs text-plum"
      style={{
        ...position,
        backgroundColor: 'rgba(247, 208, 106, 0.2)',
        backgroundImage:
          'repeating-linear-gradient(45deg, rgba(247, 208, 106, 0.4) 0 6px, transparent 6px 12px)',
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        zIndex: isDragging ? 10 : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="truncate">{suggestion.taskName}</span>
        <div className="flex shrink-0 items-center gap-1">
          <Switch
            size="sm"
            checked={false}
            onCheckedChange={(checked) => checked && onAccept(suggestion.id)}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Accept suggestion"
          />
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onDismiss(suggestion.id)}
            aria-label="Dismiss suggestion"
            className="text-plum/60"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

interface TimeGridProps {
  events: CalendarEvent[]
  suggestions: SuggestedBlock[]
  onAcceptSuggestion: (id: string) => void
  onDismissSuggestion: (id: string) => void
  onRepositionSuggestion: (id: string, start: string, end: string) => void
  onEventClick: (event: CalendarEvent) => void
}

export function TimeGrid({
  events,
  suggestions,
  onAcceptSuggestion,
  onDismissSuggestion,
  onRepositionSuggestion,
  onEventClick,
}: TimeGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: DEFAULT_SCROLL_HOUR * HOUR_HEIGHT })
  }, [])

  function handleDragEnd({ active, delta }: DragEndEvent) {
    const suggestion = suggestions.find((s) => s.id === active.id)
    if (!suggestion || !gridRef.current) return

    const rect = gridRef.current.getBoundingClientRect()
    const dayColumnWidth = (rect.width - TIME_LABEL_WIDTH) / 7

    const rawMinuteDelta = (delta.y / HOUR_HEIGHT) * 60
    const minuteDelta = Math.round(rawMinuteDelta / SNAP_MINUTES) * SNAP_MINUTES
    const dayDelta = Math.round(delta.x / dayColumnWidth)

    if (minuteDelta === 0 && dayDelta === 0) return

    const newStart = new Date(suggestion.start)
    newStart.setDate(newStart.getDate() + dayDelta)
    newStart.setMinutes(newStart.getMinutes() + minuteDelta)

    const duration = new Date(suggestion.end).getTime() - new Date(suggestion.start).getTime()
    const newEnd = new Date(newStart.getTime() + duration)

    onRepositionSuggestion(suggestion.id, newStart.toISOString(), newEnd.toISOString())
  }

  return (
    <div
      ref={scrollRef}
      className="overflow-y-auto rounded-card bg-ivory"
      style={{ height: VISIBLE_HOURS * HOUR_HEIGHT }}
    >
      <DndContext onDragEnd={handleDragEnd}>
        <div
          ref={gridRef}
          className="relative grid"
          style={{ gridTemplateColumns: `${TIME_LABEL_WIDTH}px repeat(7, 1fr)` }}
        >
          {hours.map((hour) => (
            <div key={hour} className="contents">
              <div
                className="border-t border-border pr-2 text-right text-sm text-plum/70"
                style={{ height: HOUR_HEIGHT }}
              >
                {formatHour(hour)}
              </div>
              {days.map((day) => (
                <div
                  key={`${day}-${hour}`}
                  className="border-t border-l border-border"
                  style={{ height: HOUR_HEIGHT }}
                />
              ))}
            </div>
          ))}

          {events.map((event) => {
            const position = blockPosition(new Date(event.start), new Date(event.end))
            const colorClass = jobColorClasses[event.jobColor ?? 'rose']
            // Outlook events are read-only (no Graph extended-property write wired up yet),
            // so they're not editable via the job dialog the way Google events are.
            const isEditable = event.calendarId !== 'outlook'

            if (!isEditable) {
              return (
                <div
                  key={event.id}
                  className={`absolute overflow-hidden rounded-md border border-plum/10 p-1 text-left text-xs text-ivory ${colorClass}`}
                  style={position}
                >
                  {event.title}
                </div>
              )
            }

            return (
              <button
                key={event.id}
                type="button"
                onClick={() => onEventClick(event)}
                className={`absolute overflow-hidden rounded-md border border-plum/10 p-1 text-left text-xs text-ivory ${colorClass}`}
                style={position}
              >
                {event.title}
              </button>
            )
          })}

          {suggestions
            .filter((s) => s.status === 'suggested')
            .map((suggestion) => (
              <SuggestionBlock
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={onAcceptSuggestion}
                onDismiss={onDismissSuggestion}
              />
            ))}
        </div>
      </DndContext>
    </div>
  )
}
