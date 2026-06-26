import { tokenStore } from './tokenStore.js'
import { getOrSeedJobs, resolveJobForEvent } from '../lib/jobs.js'

const AUTHORIZE_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
const TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
const GRAPH_BASE = 'https://graph.microsoft.com/v1.0'
const SCOPES = ['offline_access', 'Calendars.Read'].join(' ')

export class MicrosoftAuthRequiredError extends Error {
  constructor() {
    super('Microsoft 365 is not connected')
  }
}

export function getMicrosoftAuthUrl() {
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
    response_type: 'code',
    response_mode: 'query',
    scope: SCOPES,
  })
  return `${AUTHORIZE_URL}?${params.toString()}`
}

export async function exchangeMicrosoftCode(code: string) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
      scope: SCOPES,
      code,
    }),
  })

  if (!response.ok) throw new Error(`Microsoft token exchange failed: ${response.status}`)

  const data = (await response.json()) as {
    access_token: string
    refresh_token: string
    expires_in: number
  }

  await tokenStore.setMicrosoftTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  })
}

export async function isMicrosoftAuthed() {
  return (await tokenStore.getMicrosoftTokens()) !== null
}

async function refreshMicrosoftTokens(refreshToken: string) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      scope: SCOPES,
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) throw new Error(`Microsoft token refresh failed: ${response.status}`)

  const data = (await response.json()) as {
    access_token: string
    refresh_token?: string
    expires_in: number
  }

  const updated = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
  await tokenStore.setMicrosoftTokens(updated)
  return updated.accessToken
}

async function getValidAccessToken() {
  const stored = await tokenStore.getMicrosoftTokens()
  if (!stored) throw new MicrosoftAuthRequiredError()

  const isNearExpiry = !stored.expiresAt || stored.expiresAt - Date.now() < 60 * 1000
  if (isNearExpiry && stored.refreshToken) {
    return refreshMicrosoftTokens(stored.refreshToken)
  }
  return stored.accessToken
}

interface GraphEvent {
  id: string
  subject: string
  start: { dateTime: string }
  end: { dateTime: string }
}

export async function fetchOutlookCalendarEvents(timeMin: string, timeMax: string) {
  const accessToken = await getValidAccessToken()
  const allJobs = await getOrSeedJobs()

  const params = new URLSearchParams({
    startDateTime: timeMin,
    endDateTime: timeMax,
    $select: 'id,subject,start,end',
    $top: '999',
  })

  const response = await fetch(`${GRAPH_BASE}/me/calendarView?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'outlook.timezone="UTC"',
    },
  })

  if (!response.ok) throw new Error(`Outlook calendar fetch failed: ${response.status}`)

  const { value } = (await response.json()) as { value: GraphEvent[] }
  const job = resolveJobForEvent(undefined, 'outlook', allJobs)

  return value.map((event) => ({
    id: event.id,
    title: event.subject || '(untitled)',
    start: `${event.start.dateTime}Z`,
    end: `${event.end.dateTime}Z`,
    calendarId: 'outlook',
    jobId: job?.id ?? null,
    jobName: job?.name ?? null,
    jobColor: job?.color ?? null,
  }))
}
