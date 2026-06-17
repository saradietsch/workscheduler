import { CalendarPanel } from '@/components/calendar/CalendarPanel'
import { Sidebar } from '@/components/sidebar/Sidebar'

export function AppShell() {
  return (
    <div
      className="grid min-h-screen gap-5 bg-terra"
      style={{ gridTemplateColumns: '1fr 240px', padding: '16px 20px' }}
    >
      <CalendarPanel />
      <Sidebar />
    </div>
  )
}
