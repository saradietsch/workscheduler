# api-patterns.md

## Auth Pattern
Both Google Calendar and Asana use OAuth 2.0.
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
- Return shape from server to client: { id, title, start, end, calendarId, color? }

## Asana
- Auth: OAuth 2.0 via asana npm package
- Key endpoints used:
  - GET /tasks — fetch tasks assigned to me with a due date
  - PUT /tasks/:id — update a task (due date, completion)
- Always filter by workspace and assignee
- Return shape from server to client: { id, name, dueDate, completed, projectName, permalink }

## TanStack Query Patterns
- All server data goes through TanStack Query — no raw fetch calls in components
- Query keys: ['calendar', 'events', weekStart, weekEnd] and ['asana', 'tasks']
- Stale time: 5 minutes for calendar, 10 minutes for Asana
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
SESSION_SECRET