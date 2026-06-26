import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateTaskEstimate } from '@/lib/api'

export function useUpdateTaskEstimate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, estimatedMinutes }: { taskId: string; estimatedMinutes: number }) =>
      updateTaskEstimate(taskId, estimatedMinutes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asana', 'tasks'] })
    },
  })
}
