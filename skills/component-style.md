# component-style.md

## Project
Sara Scheduler — personal scheduling OS. React + TypeScript + Tailwind + shadcn/ui.

## Colors
Only these 5 colors are permitted anywhere in the codebase. No exceptions, no white, no grays.

--plum:      #8C4064   → primary text, headers, borders, buttons
--terra:     #D48868   → page background, warm fills, total box
--ivory:     #FFFEEA   → cards, calendar grid, inputs, panels (replaces white everywhere)
--rose:      #C38288   → secondary accents, shift blocks default
--rust:      #BB581D   → CTAs, active states, highlights

In Tailwind, extend the theme with these as custom colors named plum, terra, ivory, rose, rust.
Never use any Tailwind default color classes (no bg-white, no text-gray-500, etc).

## Job Colors (shift blocks only)
--mango:     #F2A65A
--blush:     #F4A7B9
--sunflower: #F7D06A
--lilac:     #9B72CF
--rose:      #C38288

Each job has one of these colors. Shift blocks on the calendar render in their job's color.

## Fonts
Only these 3 fonts. Load all via Google Fonts.

Modak              → display titles only (page/month header)
Love Ya Like A Sister → handwritten labels, job names, chat prompts, button text
Maiden Orange      → all body text, data, inputs, time labels

In Tailwind, extend fontFamily with: display, handwrite, body mapped to these.
Never use default Tailwind font classes.

Reference sizes (Tailwind text- scale):
- Month header (Modak): text-7xl, leading-none
- Week-nav day labels (handwrite): text-xl; prev/next arrows: text-2xl
- Sidebar section headings — "Jobs", "Ribbit" (handwrite): text-2xl
- Add event button (handwrite): text-lg
- Suggested-blocks toggle label (handwrite): text-lg
- Time grid hour labels (body): text-sm

## Spacing & Radius
- Page padding: 16px 20px
- Card border-radius: 14-16px
- Button border-radius: 8-9px
- Gap between main columns: 20px
- No box shadows with pure black — use rgba(92,48,84,.12) (plum-tinted)

## Layout
- Page is a flex column: month header on its own row, full width, sitting directly on the terra background (outside/above the calendar card) — not nested inside the calendar panel
- Below the header, a two-column grid: `1fr 300px` (calendar left, sidebar right)
- Sidebar stack (top to bottom): add event button → jobs panel → chat box → frog mascot
- Calendar panel contains: toggle bar → week nav (◀ week-strip ▶) → scrollable time grid

## Calendar
- Time grid: 24 hours (midnight to midnight), scrollable
- Default scroll position on load: 7am
- Visible window height: 12 hours (7am–7pm)
- Time label column: 48px wide
- Week strip uses grid-template-columns: 48px repeat(7, 1fr) to align with time grid
- Hour height: 40px
- Defualt week starts on Monday, ends on Sunday

## Frog Mascot
- Source image: `client/src/frog.png` (flat doodle-style illustration, thick uneven black outline, open mouth with pink/rose tongue)
- Rendered with a transparent background — no circular avatar backing
- Large relative to the sidebar: ~160px (h-40 w-40), right-aligned at the bottom of the sidebar stack

## Jobs
- A job is a name + one color from the Job Colors palette (mango, blush, sunflower, lilac, rose)
- A calendar block's color always comes from its assigned job's color — never set independently
- Default jobs seeded: "Serving" (mango), "Internship" (lilac), "School" (blush)
- Auto-assignment when a block has no explicit job yet:
  - Events from a non-primary Google calendar (e.g. the 7shifts iCal sync calendar) default to
    the "Serving" job
  - Events created by accepting a suggested block (always land on the primary Google calendar)
    default to the "Internship" job
  - Events from Outlook/Microsoft 365 (Teams meetings) default to the "School" job
  - This is a fallback only — explicit assignment (see below) always wins, for sources that
    support it
- Job assignment is stored on the Google Calendar event itself via `extendedProperties.private.jobId`,
  not in a local join table — it travels with the event and survives even if our DB doesn't have a
  record of it. Outlook events don't support this (read-only integration), so they always show
  their default and aren't clickable for reassignment

## Calendar Block Interaction
- Clicking any block (real event or accepted suggestion) opens a Dialog to reassign its job
  (which changes its color accordingly)
- All blocks (real events and suggestions) render with a thin plum-tinted border (not pure
  black — use the same `rgba(92,48,84,.12)` tint as shadows) so adjacent blocks on the same day
  don't visually blend together
- Suggested blocks use a Switch (not a button) to accept: flipping it on creates the real
  Google Calendar event and the block leaves the "suggested" overlay (it now renders as a normal
  job-colored event instead of a striped suggestion). Dismissing a suggestion (switch left off,
  or explicitly dismissed) hides it as a draft without deleting its row — but if it had already
  been accepted (a real event exists) and is then dismissed, the real event is deleted too, so
  there's never an orphaned calendar event with no corresponding UI state

## Tasks Panel
- Each task has a checkbox to mark it complete, which updates the task in Asana directly (not
  just locally)

## Components to use from shadcn/ui
- Dialog → modals (add shift, add job, edit a calendar block's job/color)
- Toggle → suggested blocks visibility switch (the toolbar toggle, not the per-block accept control)
- Switch → per-block accept control on suggested blocks
- Button → all other buttons

## Rules
- No #FFFFFF or `white` anywhere — always use ivory (#FFFEEA)
- No colors outside the palette above
- No fonts outside the 3 listed
- No Tailwind default color utilities