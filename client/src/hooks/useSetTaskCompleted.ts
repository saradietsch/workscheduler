import { useMutation, useQueryClient } from '@tanstack/react-query'
import { setTaskCompleted } from '@/lib/api'

export function useSetTaskCompleted() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, completed }: { taskId: string; completed: boolean }) =>
      setTaskCompleted(taskId, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asana', 'tasks'] })
    },
  })
}
