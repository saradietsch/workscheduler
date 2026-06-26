import { useMutation, useQueryClient } from '@tanstack/react-query'
import { setEventJob } from '@/lib/api'

export function useSetEventJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      calendarId,
      eventId,
      jobId,
    }: {
      calendarId: string
      eventId: string
      jobId: string
    }) => setEventJob(calendarId, eventId, jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] })
    },
  })
}
