# scheduling-engine.md

## Purpose
This is the core feature of Sara Scheduler: closing the loop between "what work do I have"
(Asana) and "when can I actually do it" (Google Calendar). The app doesn't just display both —
it actively suggests when to do each task and lets the user accept or adjust those suggestions.

## The loop
1. Pull incomplete Asana tasks assigned to the user (see `api-patterns.md`)
2. Estimate how long each task will actually take
3. Find open time on the calendar (`find_free_blocks`, see `agent-tools.md`)
4. Suggest specific blocks: "do task X from 3-4pm Thursday"
5. User reviews suggestions on the calendar — accept, drag to a different time, or dismiss
6. Accepting a suggestion creates a real Google Calendar event (`create_calendar_event`)

## Task duration estimation
- Asana tasks don't reliably state how long they'll take. Sometimes the task text gives a hint
  ("5 hours of learning X"); most of the time it doesn't.
- Claude reads the task name/notes and estimates a duration. If the text has an explicit time
  reference, use that. Otherwise estimate based on task complexity — default to short estimates
  (~30 min) for vague/simple-sounding tasks.
- Estimates are always user-editable. Claude's guess is a starting point, not a final answer —
  the user can correct it, and the correction should stick (don't silently re-estimate over a
  manual edit).
- Estimates are stored per-task in the database, not derived fresh on every page load.

## Suggested blocks
- Generation is real Claude reasoning (not a deterministic scheduling algorithm) — given the
  task list with estimates, due dates, and the user's free time blocks, Claude proposes specific
  (task, start, end) suggestions.
- Suggestions are visually distinct from real events on the calendar (per `component-style.md`,
  rendered as a diagonal-striped pattern, not a solid block) until accepted.
- The "Suggested blocks" toggle in the calendar toolbar controls whether suggestions are shown.
- Generation is scoped to the week being viewed: tasks due in a later week are excluded from that
  week's suggestions, even if there's free time available. A task with no due date is never
  excluded on this basis (it has no week to be "ahead of").
- A suggestion is a draft until the user acts on it:
  - **Accept** (a per-block Switch, not a button) → creates a real Google Calendar event; the
    block leaves the suggested overlay and renders as a normal job-colored event from then on
  - **Drag** → repositions the suggestion (and, if already accepted, updates the real event's time)
  - **Dismiss** → hidden as a draft (row kept, not shown); if it had already been accepted, the
    real Google Calendar event is deleted too, so there's never an accepted-but-invisible event

## Jobs
- See `component-style.md` for the job color/auto-assignment rules. Mechanically: job
  *definitions* (name + color) live in the database (`jobs` table), but which job a specific
  calendar event belongs to is stored on the Google event itself
  (`extendedProperties.private.jobId`), not in a local join table. This means job assignment
  survives independent of our database, and works uniformly for events we created (accepted
  suggestions) and events we didn't (synced shifts) — both are just Google Calendar events we
  have write access to.
- When listing calendar events, resolve each event's job by: explicit `jobId` in
  `extendedProperties` if present, otherwise fall back to the source-based default. The fallback
  is keyed off a `defaultSource` column on the job (`'primary' | 'secondary' | 'outlook'`), not a
  hardcoded job name. Three sources, three seeded default jobs:
  - Primary Google calendar → "Internship" (lilac)
  - Any non-primary Google calendar, e.g. the 7shifts sync → "Serving" (mango)
  - Outlook/Microsoft 365 (Teams meetings) → "School" (blush)
- Outlook events can't carry an explicit `jobId` override (Graph extended-property writes aren't
  wired up, and the integration is read-only by design) — they always show the "School" default
  and aren't clickable in the click-to-edit dialog. Google events (synced or accepted) can always
  be reassigned, since `extendedProperties` writes are cheap and already built.

## Persistence
- Task estimates, suggested blocks (and their accept/dismiss/drag state), job definitions, and
  OAuth tokens all live in a real database (Neon Postgres via Drizzle) — not in-memory, not a
  local file. Per-event job *assignment* is the one exception — see Jobs above.
- This matters specifically because the app deploys to Vercel: serverless functions don't
  persist memory or disk between invocations, so anything that needs to survive a request has to
  live in the database, including OAuth tokens (previously in-memory — that would silently break
  in production).

## Out of scope (for now)
- Asana custom fields for estimates — estimates live only in Sara Scheduler, not synced back to Asana
- Recurring/repeating suggested blocks
- Multi-user support — this remains a single-user personal app

## Future ideas (not built yet)
- A small "work ahead" box showing next week's tasks, separate from the main suggestion flow —
  for when the user wants to voluntarily pull forward work that wouldn't normally be suggested
  for the current week per the due-date scoping rule above
