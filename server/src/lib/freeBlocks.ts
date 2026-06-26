interface BusyEvent {
  start: string
  end: string
}

export interface FreeBlock {
  start: Date
  end: Date
}

const MIN_BLOCK_MINUTES = 15

function isTimedEvent(event: BusyEvent) {
  return event.start.includes('T') && event.end.includes('T')
}

export function findFreeBlocks(
  events: BusyEvent[],
  rangeStart: Date,
  rangeEnd: Date,
  dayStartHour = 8,
  dayEndHour = 21,
): FreeBlock[] {
  const busy = events
    .filter(isTimedEvent)
    .map((e) => ({ start: new Date(e.start), end: new Date(e.end) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  const freeBlocks: FreeBlock[] = []

  for (
    let day = new Date(rangeStart);
    day < rangeEnd;
    day.setDate(day.getDate() + 1)
  ) {
    const windowStart = new Date(day)
    windowStart.setHours(dayStartHour, 0, 0, 0)
    const windowEnd = new Date(day)
    windowEnd.setHours(dayEndHour, 0, 0, 0)

    const dayBusy = busy
      .filter((b) => b.start < windowEnd && b.end > windowStart)
      .map((b) => ({
        start: b.start < windowStart ? windowStart : b.start,
        end: b.end > windowEnd ? windowEnd : b.end,
      }))

    const merged: FreeBlock[] = []
    for (const interval of dayBusy) {
      const last = merged[merged.length - 1]
      if (last && interval.start <= last.end) {
        if (interval.end > last.end) last.end = interval.end
      } else {
        merged.push({ ...interval })
      }
    }

    let cursor = windowStart
    for (const interval of merged) {
      if (interval.start.getTime() - cursor.getTime() >= MIN_BLOCK_MINUTES * 60 * 1000) {
        freeBlocks.push({ start: cursor, end: interval.start })
      }
      cursor = interval.end > cursor ? interval.end : cursor
    }
    if (windowEnd.getTime() - cursor.getTime() >= MIN_BLOCK_MINUTES * 60 * 1000) {
      freeBlocks.push({ start: cursor, end: windowEnd })
    }
  }

  return freeBlocks
}
