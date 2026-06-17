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

## Spacing & Radius
- Page padding: 16px 20px
- Card border-radius: 14-16px
- Button border-radius: 8-9px
- Gap between main columns: 20px
- No box shadows with pure black — use rgba(92,48,84,.12) (plum-tinted)

## Layout
- Two-column grid: `1fr 240px` (calendar left, sidebar right)
- Sidebar stack (top to bottom): add event button → jobs panel → chat box → frog mascot
- Calendar panel contains: toggle bar → week nav (◀ week-strip ▶) → scrollable time grid

## Calendar
- Time grid: 24 hours (midnight to midnight), scrollable
- Default scroll position on load: 7am
- Visible window height: 15 hours (7am–10pm)
- Time label column: 48px wide
- Week strip uses grid-template-columns: 48px repeat(7, 1fr) to align with time grid
- Hour height: 44px

## Components to use from shadcn/ui
- Dialog → modals (add shift, add job)
- Toggle → suggested blocks switch
- Button → all buttons

## Rules
- No #FFFFFF or `white` anywhere — always use ivory (#FFFEEA)
- No colors outside the palette above
- No fonts outside the 3 listed
- No Tailwind default color utilities