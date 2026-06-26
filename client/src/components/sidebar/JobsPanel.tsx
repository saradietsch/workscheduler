import { useState } from 'react'
import type { JobColor } from '@shared'
import { useJobs, useCreateJob } from '@/hooks/useJobs'
import { Button } from '@/components/ui/button'

const jobColorClasses: Record<JobColor, string> = {
  mango: 'bg-mango',
  blush: 'bg-blush',
  sunflower: 'bg-sunflower',
  lilac: 'bg-lilac',
  rose: 'bg-rose',
}

const allColors = Object.keys(jobColorClasses) as JobColor[]

export function JobsPanel() {
  const { data: jobs, isLoading } = useJobs()
  const { mutate: createJob, isPending } = useCreateJob()

  const [name, setName] = useState('')
  const [color, setColor] = useState<JobColor>('rose')

  function handleCreate() {
    if (!name.trim()) return
    createJob({ name: name.trim(), color }, { onSuccess: () => setName('') })
  }

  return (
    <div className="flex flex-col gap-2 rounded-card bg-ivory p-4">
      <h2 className="font-handwrite text-2xl text-plum">Jobs</h2>

      {isLoading ? (
        <div className="h-12 animate-pulse rounded-card bg-ivory/60" />
      ) : (
        <div className="flex flex-col gap-1">
          {jobs?.map((job) => (
            <div key={job.id} className="flex items-center gap-2">
              <span className={`size-3 rounded-full ${jobColorClasses[job.color]}`} />
              <span className="font-body text-sm text-plum">{job.name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-border pt-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="New job"
          className="flex-1 rounded-md border border-border bg-ivory px-2 py-1 font-body text-sm text-plum"
        />
        <div className="flex gap-1">
          {allColors.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Select ${c}`}
              onClick={() => setColor(c)}
              className={`size-5 rounded-full ${jobColorClasses[c]} ${
                color === c ? 'ring-2 ring-plum ring-offset-1' : ''
              }`}
            />
          ))}
        </div>
        <Button size="sm" disabled={isPending || !name.trim()} onClick={handleCreate}>
          +
        </Button>
      </div>
    </div>
  )
}
