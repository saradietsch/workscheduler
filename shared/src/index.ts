export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  calendarId: string
  color?: string
}

export interface AsanaTask {
  id: string
  name: string
  dueDate: string | null
  completed: boolean
  projectName: string | null
  permalink: string
}

export interface ApiError {
  error: string
  code: number
}
