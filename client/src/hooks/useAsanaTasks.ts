import { useQuery } from '@tanstack/react-query'
import { fetchAsanaTasks } from '@/lib/api'

export function useAsanaTasks() {
  return useQuery({
    queryKey: ['asana', 'tasks'],
    queryFn: fetchAsanaTasks,
    staleTime: 10 * 60 * 1000,
  })
}
