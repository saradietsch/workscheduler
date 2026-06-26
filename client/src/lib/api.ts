import type { CalendarEvent, AsanaTask, ApiError } from '@shared'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiError | null
    throw new Error(body?.error ?? `Request failed with status ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function fetchCalendarEvents(timeMin: string, timeMax: string) {
  const params = new URLSearchParams({ timeMin, timeMax })
  const res = await fetch(`/api/calendar/events?${params.toString()}`)
  const data = await handleResponse<{ events: CalendarEvent[] }>(res)
  return data.events
}

export async function fetchAsanaTasks() {
  const res = await fetch('/api/asana/tasks')
  const data = await handleResponse<{ tasks: AsanaTask[] }>(res)
  return data.tasks
}
