import type { CalendarEvent, JobColor } from '@shared'
import { useJobs } from '@/hooks/useJobs'
import { useSetEventJob } from '@/hooks/useSetEventJob'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const jobColorClasses: Record<JobColor, string> = {
  mango: 'bg-mango',
  blush: 'bg-blush',
  sunflower: 'bg-sunflower',
  lilac: 'bg-lilac',
  rose: 'bg-rose',
}

interface EventEditDialogProps {
  event: CalendarEvent | null
  onClose: () => void
}

export function EventEditDialog({ event, onClose }: EventEditDialogProps) {
  const { data: jobs } = useJobs()
  const { mutate: assignJob, isPending } = useSetEventJob()

  function handleSelectJob(jobId: string) {
    if (!event) return
    assignJob(
      { calendarId: event.calendarId, eventId: event.id, jobId },
      { onSuccess: onClose },
    )
  }

  return (
    <Dialog open={event !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card">
        <DialogHeader>
          <DialogTitle className="font-handwrite text-plum">{event?.title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <p className="font-body text-sm text-plum/70">Assign a job</p>
          <div className="flex flex-wrap gap-2">
            {jobs?.map((job) => (
              <button
                key={job.id}
                type="button"
                disabled={isPending}
                onClick={() => handleSelectJob(job.id)}
                className={`flex items-center gap-2 rounded-md border px-3 py-1.5 font-body text-sm text-plum ${
                  job.id === event?.jobId ? 'border-plum' : 'border-border'
                }`}
              >
                <span className={`size-3 rounded-full ${jobColorClasses[job.color]}`} />
                {job.name}
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
