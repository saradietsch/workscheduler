import { google } from 'googleapis'
import { tokenStore } from './tokenStore.js'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
]

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  )
}

export function getGoogleAuthUrl() {
  const client = createOAuthClient()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  })
}

export async function exchangeGoogleCode(code: string) {
  const client = createOAuthClient()
  const { tokens } = await client.getToken(code)
  tokenStore.setGoogleTokens({
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token ?? undefined,
    expiryDate: tokens.expiry_date ?? undefined,
  })
}

export function isGoogleAuthed() {
  return tokenStore.getGoogleTokens() !== null
}

function getAuthorizedClient() {
  const stored = tokenStore.getGoogleTokens()
  if (!stored) throw new GoogleAuthRequiredError()

  const client = createOAuthClient()
  client.setCredentials({
    access_token: stored.accessToken,
    refresh_token: stored.refreshToken,
    expiry_date: stored.expiryDate,
  })
  return client
}

export class GoogleAuthRequiredError extends Error {
  constructor() {
    super('Google Calendar is not connected')
  }
}

export async function fetchGoogleCalendarEvents(timeMin: string, timeMax: string) {
  const auth = getAuthorizedClient()
  const calendar = google.calendar({ version: 'v3', auth })

  const { data } = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
  })

  return (data.items ?? []).map((event) => ({
    id: event.id!,
    title: event.summary ?? '(untitled)',
    start: event.start?.dateTime ?? event.start?.date ?? '',
    end: event.end?.dateTime ?? event.end?.date ?? '',
    calendarId: 'primary',
  }))
}
