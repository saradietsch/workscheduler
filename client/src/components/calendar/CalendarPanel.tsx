import { ToggleBar } from './ToggleBar'
import { WeekNav } from './WeekNav'
import { TimeGrid } from './TimeGrid'

export function CalendarPanel() {
  return (
    <div className="flex flex-col gap-3 rounded-card bg-ivory p-4">
      <ToggleBar />
      <WeekNav />
      <TimeGrid />
    </div>
  )
}
