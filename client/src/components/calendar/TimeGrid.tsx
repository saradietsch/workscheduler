import { useEffect, useRef } from 'react'
import type { CalendarEvent } from '@shared'

const HOUR_HEIGHT = 40
const TIME_LABEL_WIDTH = 48
const DEFAULT_SCROLL_HOUR = 7
const VISIBLE_HOURS = 12

const hours = Array.from({ length: 24 }, (_, i) => i)
const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatHour(hour: number) {
  const period = hour < 12 ? 'AM' : 'PM'
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display} ${period}`
}

function minutesIntoDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes()
}

interface TimeGridProps {
  events: CalendarEvent[]
}

export function TimeGrid({ events }: TimeGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: DEFAULT_SCROLL_HOUR * HOUR_HEIGHT })
  }, [])

  return (
    <div
      ref={scrollRef}
      className="overflow-y-auto rounded-card bg-ivory"
      style={{ height: VISIBLE_HOURS * HOUR_HEIGHT }}
    >
      <div
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
          const start = new Date(event.start)
          const end = new Date(event.end)
          const dayIndex = start.getDay()
          const top = (minutesIntoDay(start) / 60) * HOUR_HEIGHT
          const height = Math.max(
            ((minutesIntoDay(end) - minutesIntoDay(start)) / 60) * HOUR_HEIGHT,
            20,
          )

          return (
            <div
              key={event.id}
              className="absolute overflow-hidden rounded-md bg-rose p-1 text-xs text-ivory"
              style={{
                top,
                height,
                left: `calc(${TIME_LABEL_WIDTH}px + (100% - ${TIME_LABEL_WIDTH}px) * ${dayIndex} / 7)`,
                width: `calc((100% - ${TIME_LABEL_WIDTH}px) / 7)`,
              }}
            >
              {event.title}
            </div>
          )
        })}
      </div>
    </div>
  )
}
