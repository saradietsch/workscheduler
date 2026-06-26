# api-patterns.md

## Auth Pattern
Google Calendar, Asana, and Microsoft 365 all use OAuth 2.0.
- OAuth flow is handled server-side in /server
- Tokens are stored server-side, never exposed to the frontend
- Frontend never sees raw credentials
- All API calls go through /server endpoints, not directly from the client

## Google Calendar
- Auth: OAuth 2.0 via googleapis npm package
- Scopes needed: https://www.googleapis.com/auth/calendar.readonly, https://www.googleapis.com/auth/calendar.events
- 7shifts shifts arrive via iCal subscription synced into Google Calendar — no 7shifts API needed
- Key endpoints used:
  - GET /calendar/v3/calendars/primary/events — fetch events for a date range
  - POST /calendar/v3/calendars/primary/events — create a new event
- Always request events with timeMin and timeMax parameters (never fetch unbounded)
- Return shape from server to client: `{ id, title, start, end, calendarId, jobId, jobName, jobColor }`
  — job fields are resolved server-side per event (explicit `extendedProperties.private.jobId` on
  the event if set, otherwise the source-based default job). See `scheduling-engine.md` for the
  resolution rule and why job assignment lives on the Google event, not a local table.
- `PATCH /api/calendar/events/job` — body `{ calendarId, eventId, jobId }`, sets
  `extendedProperties.private.jobId` on the actual Google event
- `DELETE /calendar/v3/calendars/{calendarId}/events/{eventId}` — used when un-accepting a
  suggestion (see scheduling-engine.md)

## Microsoft 365 / Teams
- Teams meetings don't have their own calendar — they're events in Outlook/Microsoft 365
  Calendar, fetched via Microsoft Graph (`https://graph.microsoft.com/v1.0/me/calendarView`),
  the same way 7shifts shifts arrive as Google Calendar events rather than via a 7shifts API
- Auth: OAuth 2.0 via direct HTTPS calls to the Microsoft identity platform (`login.microsoftonline.com`),
  not the MSAL SDK — same reasoning as Asana, kept dependency-light
- Scopes: `offline_access Calendars.Read` — **read-only**, by design. Sara Scheduler never
  creates/edits events on the Microsoft side; accepting a suggestion always creates the real
  event on Google Calendar regardless of source
- Access tokens expire in ~1 hour; refreshed proactively (checked before each fetch, refreshed if
  within 60s of expiry) using the stored refresh token — there's no SDK auto-refresh hook like
  `googleapis` provides, so this is handled manually in `microsoft.ts`
- Because Outlook events are read-only, they're **not** assignable via the click-to-edit job
  dialog the way Google events are (there's no Graph extended-property write wired up) — they
  always show their source-based default job color. The frontend renders them as a plain
  (non-clickable) block instead of a button to avoid offering a broken edit action
- Outlook is an *optional* calendar source: if Microsoft isn't connected, `/api/calendar/events`
  still succeeds with just Google's events — only a disconnected/failed Google fetch returns 401
  for the whole request, since Google is the source the calendar is built around
- Return shape merges into the same `CalendarEvent` shape as Google events, with
  `calendarId: 'outlook'`

## Asana
- Auth: OAuth 2.0 via direct HTTPS calls to Asana's documented REST endpoints (not the `asana`
  npm package — avoided depending on an SDK API surface that wasn't confidently verified)
- Key endpoints used:
  - GET /tasks — fetch tasks assigned to me with a due date (requests `notes` too, used
    server-side only for duration estimation — never sent to the client)
  - PUT /tasks/:id — update a task (due date, completion)
- Always filter by workspace and assignee
- Return shape from server to client:
  `{ id, name, dueDate, completed, projectName, permalink, estimatedMinutes, estimateSource }`
  — `estimateSource` is `'ai'` or `'manual'`. See `scheduling-engine.md` for how estimates are
  generated and why they're sticky once set.
- `PATCH /api/asana/tasks/:id/estimate` — body `{ estimatedMinutes }`, lets the user override an
  estimate; always sets `estimateSource` to `'manual'`
- `PATCH /api/asana/tasks/:id/complete` — body `{ completed }`, updates the task in Asana itself
  via `PUT /tasks/:id`, not just locally — completing a task in Sara Scheduler completes it in
  Asana too

## Jobs
- `GET /api/jobs` — list all jobs (id, name, color, defaultSource)
- `POST /api/jobs` — create a job, body `{ name, color }` (color must be one of the Job Colors
  from `component-style.md`); user-created jobs have no `defaultSource`, so they're never
  auto-assigned, only picked manually via the block-edit dialog

## TanStack Query Patterns
- All server data goes through TanStack Query — no raw fetch calls in components
- Query keys: ['calendar', 'events', weekStart, weekEnd], ['asana', 'tasks'],
  ['suggestions', weekStart, weekEnd], and ['jobs']
- Stale time: 5 minutes for calendar, 10 minutes for Asana, 10 minutes for jobs
- On mutation (create event, update task), always invalidate the relevant query key
- Show loading skeletons in ivory while queries are pending
- Show error state in rose with a retry button

## Error Handling
- All Express routes wrap logic in try/catch
- Return { error: string, code: number } on failure
- 401 → redirect to OAuth flow
- 500 → show user-facing error in rose toast notification

## Environment Variables
Store in .env (never commit):
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI
ASANA_CLIENT_ID
ASANA_CLIENT_SECRET
ASANA_REDIRECT_URI
MICROSOFT_CLIENT_ID
MICROSOFT_CLIENT_SECRET
MICROSOFT_REDIRECT_URI
CLIENT_URL — where OAuth callbacks redirect after success (e.g. http://localhost:5173 in dev)
PORT
DATABASE_URL — Neon Postgres connection string (pooled), read by Drizzle
ANTHROPIC_API_KEY — for task duration estimation and suggested-block generation (see scheduling-engine.md)

SESSION_SECRET is listed in .env.example but currently unused — there's no express-session in
this codebase; OAuth tokens are stored in the database instead (single-user app, no per-request
session needed).