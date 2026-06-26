import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchSuggestions,
  generateSuggestions,
  acceptSuggestion,
  dismissSuggestion,
  repositionSuggestion,
} from '@/lib/api'

function suggestionsKey(weekStart: Date, weekEnd: Date) {
  return ['suggestions', weekStart.toISOString(), weekEnd.toISOString()]
}

export function useSuggestions(weekStart: Date, weekEnd: Date, enabled: boolean) {
  return useQuery({
    queryKey: suggestionsKey(weekStart, weekEnd),
    queryFn: () => fetchSuggestions(weekStart.toISOString(), weekEnd.toISOString()),
    enabled,
  })
}

export function useGenerateSuggestions(weekStart: Date, weekEnd: Date) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => generateSuggestions(weekStart.toISOString(), weekEnd.toISOString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suggestionsKey(weekStart, weekEnd) })
    },
  })
}

export function useAcceptSuggestion(weekStart: Date, weekEnd: Date) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => acceptSuggestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suggestionsKey(weekStart, weekEnd) })
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] })
    },
  })
}

export function useDismissSuggestion(weekStart: Date, weekEnd: Date) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => dismissSuggestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suggestionsKey(weekStart, weekEnd) })
    },
  })
}

export function useRepositionSuggestion(weekStart: Date, weekEnd: Date) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, start, end }: { id: string; start: string; end: string }) =>
      repositionSuggestion(id, start, end),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suggestionsKey(weekStart, weekEnd) })
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] })
    },
  })
}
