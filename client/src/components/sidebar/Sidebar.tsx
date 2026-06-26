import { Button } from '@/components/ui/button'
import { ConnectAccounts } from './ConnectAccounts'
import { TasksPanel } from './TasksPanel'
import { JobsPanel } from './JobsPanel'
import { ChatBox } from './ChatBox'
import { FrogMascot } from './FrogMascot'

export function Sidebar() {
  return (
    <div className="flex flex-col gap-3">
      <Button className="font-handwrite text-lg" size="lg">
        + Add event
      </Button>
      <ConnectAccounts />
      <TasksPanel />
      <JobsPanel />
      <ChatBox />
      <FrogMascot />
    </div>
  )
}
