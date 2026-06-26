import type { CalendarEvent, AsanaTask, SuggestedBlock, Job, ApiError } from '@shared'

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

export async function updateTaskEstimate(taskId: string, estimatedMinutes: number) {
  const res = await fetch(`/api/asana/tasks/${taskId}/estimate`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estimatedMinutes }),
  })
  await handleResponse<{ success: boolean }>(res)
}

export async function fetchSuggestions(timeMin: string, timeMax: string) {
  const params = new URLSearchParams({ timeMin, timeMax })
  const res = await fetch(`/api/suggestions?${params.toString()}`)
  const data = await handleResponse<{ suggestions: SuggestedBlock[] }>(res)
  return data.suggestions
}

export async function generateSuggestions(timeMin: string, timeMax: string) {
  const res = await fetch('/api/suggestions/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timeMin, timeMax }),
  })
  const data = await handleResponse<{ suggestions: SuggestedBlock[] }>(res)
  return data.suggestions
}

export async function acceptSuggestion(id: string) {
  const res = await fetch(`/api/suggestions/${id}/accept`, { method: 'POST' })
  await handleResponse<{ id: string; googleEventId: string; status: string }>(res)
}

export async function dismissSuggestion(id: string) {
  const res = await fetch(`/api/suggestions/${id}`, { method: 'DELETE' })
  await handleResponse<{ success: boolean }>(res)
}

export async function repositionSuggestion(id: string, start: string, end: string) {
  const res = await fetch(`/api/suggestions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ start, end }),
  })
  await handleResponse<{ id: string; start: string; end: string; status: string }>(res)
}

export async function setTaskCompleted(taskId: string, completed: boolean) {
  const res = await fetch(`/api/asana/tasks/${taskId}/complete`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
  })
  await handleResponse<{ success: boolean }>(res)
}

export async function fetchJobs() {
  const res = await fetch('/api/jobs')
  const data = await handleResponse<{ jobs: Job[] }>(res)
  return data.jobs
}

export async function createJob(name: string, color: string) {
  const res = await fetch('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color }),
  })
  const data = await handleResponse<{ job: Job }>(res)
  return data.job
}

export async function setEventJob(calendarId: string, eventId: string, jobId: string) {
  const res = await fetch('/api/calendar/events/job', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ calendarId, eventId, jobId }),
  })
  await handleResponse<{ success: boolean }>(res)
}
