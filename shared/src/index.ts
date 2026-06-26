export type JobColor = 'mango' | 'blush' | 'sunflower' | 'lilac' | 'rose'

export interface Job {
  id: string
  name: string
  color: JobColor
  defaultSource: 'primary' | 'secondary' | null
}

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  calendarId: string
  jobId: string | null
  jobName: string | null
  jobColor: JobColor | null
}

export interface AsanaTask {
  id: string
  name: string
  dueDate: string | null
  completed: boolean
  projectName: string | null
  permalink: string
  estimatedMinutes: number
  estimateSource: 'ai' | 'manual'
}

export interface SuggestedBlock {
  id: string
  taskId: string
  taskName: string
  start: string
  end: string
  status: 'suggested' | 'accepted' | 'dismissed'
}

export interface ApiError {
  error: string
  code: number
}
