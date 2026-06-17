import { MonthHeader } from '@/components/calendar/MonthHeader'
import { CalendarPanel } from '@/components/calendar/CalendarPanel'
import { Sidebar } from '@/components/sidebar/Sidebar'

export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col gap-3 bg-terra" style={{ padding: '16px 20px' }}>
      <MonthHeader />
      <div className="grid flex-1 gap-5" style={{ gridTemplateColumns: '1fr 300px' }}>
        <CalendarPanel />
        <Sidebar />
      </div>
    </div>
  )
}
