import { useState } from 'react'
import type { AsanaTask } from '@shared'
import { useAsanaTasks } from '@/hooks/useAsanaTasks'
import { useUpdateTaskEstimate } from '@/hooks/useUpdateTaskEstimate'
import { useSetTaskCompleted } from '@/hooks/useSetTaskCompleted'
import { Button } from '@/components/ui/button'

function TaskRow({ task }: { task: AsanaTask }) {
  const [draft, setDraft] = useState(String(task.estimatedMinutes))
  const { mutate, isPending } = useUpdateTaskEstimate()
  const { mutate: setCompleted, isPending: isCompleting } = useSetTaskCompleted()

  function commit() {
    const minutes = Number(draft)
    if (Number.isFinite(minutes) && minutes > 0 && minutes !== task.estimatedMinutes) {
      mutate({ taskId: task.id, estimatedMinutes: minutes })
    } else {
      setDraft(String(task.estimatedMinutes))
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 border-t border-border py-2 first:border-t-0">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={false}
          disabled={isCompleting}
          onChange={(e) => setCompleted({ taskId: task.id, completed: e.target.checked })}
          aria-label={`Mark "${task.name}" complete`}
          className="accent-rust"
        />
        <div className="flex flex-col">
          <span className="font-body text-sm text-plum">{task.name}</span>
          {task.dueDate && (
            <span className="font-body text-xs text-plum/50">
              Due{' '}
              {new Date(`${task.dueDate}T00:00:00`).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          disabled={isPending}
          inputMode="numeric"
          className="w-12 rounded-md border border-border bg-ivory text-right font-body text-sm text-plum"
          aria-label={`Estimated minutes for ${task.name}`}
        />
        <span className="font-body text-xs text-plum/60">
          {task.estimateSource === 'ai' ? 'min (AI)' : 'min'}
        </span>
      </div>
    </div>
  )
}

export function TasksPanel() {
  const { data: tasks, isLoading, isError, refetch } = useAsanaTasks()
  const incompleteTasks = tasks?.filter((t) => !t.completed) ?? []

  return (
    <div className="flex flex-col gap-1 rounded-card bg-ivory p-4">
      <h2 className="font-handwrite text-2xl text-plum">Tasks</h2>
      {isError ? (
        <div className="flex flex-col items-start gap-2 text-rose">
          <p className="font-body text-sm">Couldn't load your tasks.</p>
          <Button size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : isLoading ? (
        <div className="h-24 animate-pulse rounded-card bg-ivory/60" />
      ) : incompleteTasks.length === 0 ? (
        <p className="font-body text-sm text-plum/60">No open tasks.</p>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          {incompleteTasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      )}
      <p className="font-body text-xs text-plum/50">
        Estimated time is editable -- click a value and type to correct it.
      </p>
    </div>
  )
}
