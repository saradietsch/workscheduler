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
- A suggestion is a draft until the user acts on it:
  - **Accept** → creates a real Google Calendar event; the suggestion becomes a normal event
  - **Drag** → repositions the suggestion (and, if already accepted, updates the real event)
  - **Dismiss** → discarded, no calendar change

## Persistence
- Task estimates, suggested blocks (and their accept/dismiss/drag state), and OAuth tokens all
  live in a real database (Neon Postgres via Drizzle) — not in-memory, not a local file.
- This matters specifically because the app deploys to Vercel: serverless functions don't
  persist memory or disk between invocations, so anything that needs to survive a request has to
  live in the database, including OAuth tokens (previously in-memory — that would silently break
  in production).

## Out of scope (for now)
- Asana custom fields for estimates — estimates live only in Sara Scheduler, not synced back to Asana
- Recurring/repeating suggested blocks
- Multi-user support — this remains a single-user personal app
