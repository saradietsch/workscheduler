import { useAsanaTasks } from '@/hooks/useAsanaTasks'

export function ChatBox() {
  const { data: tasks, isLoading, isError, refetch } = useAsanaTasks()
  const incompleteCount = tasks?.filter((task) => !task.completed).length

  return (
    <div className="flex flex-1 flex-col gap-2 rounded-card bg-ivory p-4">
      <h2 className="font-handwrite text-2xl text-plum">Ribbit</h2>
      {isError ? (
        <button
          type="button"
          onClick={() => refetch()}
          className="text-left font-body text-sm text-rose"
        >
          Couldn't load tasks — retry
        </button>
      ) : isLoading ? (
        <p className="font-body text-sm text-plum/60">Loading tasks…</p>
      ) : (
        <p className="font-body text-sm text-plum/70">
          {incompleteCount} open task{incompleteCount === 1 ? '' : 's'} in Asana
        </p>
      )}
    </div>
  )
}
