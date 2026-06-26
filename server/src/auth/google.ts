import { google } from 'googleapis'
import { tokenStore } from './tokenStore.js'
import { getOrSeedJobs, resolveJobForEvent } from '../lib/jobs.js'

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
  await tokenStore.setGoogleTokens({
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token ?? undefined,
    expiresAt: tokens.expiry_date ?? undefined,
  })
}

export async function isGoogleAuthed() {
  return (await tokenStore.getGoogleTokens()) !== null
}

async function getAuthorizedClient() {
  const stored = await tokenStore.getGoogleTokens()
  if (!stored) throw new GoogleAuthRequiredError()

  const client = createOAuthClient()
  client.setCredentials({
    access_token: stored.accessToken,
    refresh_token: stored.refreshToken,
    expiry_date: stored.expiresAt,
  })

  // googleapis silently refreshes the access token when it's near expiry;
  // persist the refreshed token so future requests don't need to re-auth.
  client.on('tokens', (tokens) => {
    void tokenStore.setGoogleTokens({
      accessToken: tokens.access_token ?? stored.accessToken,
      refreshToken: tokens.refresh_token ?? stored.refreshToken,
      expiresAt: tokens.expiry_date ?? stored.expiresAt,
    })
  })

  return client
}

export class GoogleAuthRequiredError extends Error {
  constructor() {
    super('Google Calendar is not connected')
  }
}

export async function fetchGoogleCalendarEvents(timeMin: string, timeMax: string) {
  const auth = await getAuthorizedClient()
  const calendar = google.calendar({ version: 'v3', auth })

  const [{ data: calendarList }, allJobs] = await Promise.all([
    calendar.calendarList.list(),
    getOrSeedJobs(),
  ])
  const calendarEntries = (calendarList.items ?? []).filter((cal) => cal.id)

  const results = await Promise.all(
    calendarEntries.map((cal) =>
      calendar.events.list({
        calendarId: cal.id!,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      }),
    ),
  )

  return results.flatMap(({ data }, i) => {
    const calendarId = calendarEntries[i].id!
    const isPrimary = calendarEntries[i].primary === true

    return (data.items ?? []).map((event) => {
      const explicitJobId = event.extendedProperties?.private?.jobId
      const job = resolveJobForEvent(explicitJobId, isPrimary ? 'primary' : 'secondary', allJobs)

      return {
        id: event.id!,
        title: event.summary ?? '(untitled)',
        start: event.start?.dateTime ?? event.start?.date ?? '',
        end: event.end?.dateTime ?? event.end?.date ?? '',
        calendarId,
        jobId: job?.id ?? null,
        jobName: job?.name ?? null,
        jobColor: job?.color ?? null,
      }
    })
  })
}

export async function setGoogleCalendarEventJob(calendarId: string, eventId: string, jobId: string) {
  const auth = await getAuthorizedClient()
  const calendar = google.calendar({ version: 'v3', auth })

  await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: {
      extendedProperties: {
        private: { jobId },
      },
    },
  })
}

export async function deleteGoogleCalendarEvent(calendarId: string, eventId: string) {
  const auth = await getAuthorizedClient()
  const calendar = google.calendar({ version: 'v3', auth })

  await calendar.events.delete({ calendarId, eventId })
}

export async function createGoogleCalendarEvent(title: string, start: string, end: string) {
  const auth = await getAuthorizedClient()
  const calendar = google.calendar({ version: 'v3', auth })

  const { data } = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: title,
      start: { dateTime: start },
      end: { dateTime: end },
    },
  })

  return data.id!
}

export async function updateGoogleCalendarEvent(eventId: string, start: string, end: string) {
  const auth = await getAuthorizedClient()
  const calendar = google.calendar({ version: 'v3', auth })

  await calendar.events.patch({
    calendarId: 'primary',
    eventId,
    requestBody: {
      start: { dateTime: start },
      end: { dateTime: end },
    },
  })
}
