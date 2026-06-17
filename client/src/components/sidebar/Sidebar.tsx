import { Button } from '@/components/ui/button'
import { JobsPanel } from './JobsPanel'
import { ChatBox } from './ChatBox'
import { FrogMascot } from './FrogMascot'

export function Sidebar() {
  return (
    <div className="flex flex-col gap-3">
      <Button className="font-handwrite text-lg" size="lg">
        + Add event
      </Button>
      <JobsPanel />
      <ChatBox />
      <FrogMascot />
    </div>
  )
}
