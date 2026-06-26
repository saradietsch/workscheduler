import { Router } from 'express'
import {
  fetchGoogleCalendarEvents,
  setGoogleCalendarEventJob,
  GoogleAuthRequiredError,
} from '../auth/google.js'
import {
  fetchOutlookCalendarEvents,
  MicrosoftAuthRequiredError,
} from '../auth/microsoft.js'

export const calendarRouter = Router()

calendarRouter.get('/events', async (req, res) => {
  const { timeMin, timeMax } = req.query

  if (typeof timeMin !== 'string' || typeof timeMax !== 'string') {
    res.status(400).json({ error: 'timeMin and timeMax are required', code: 400 })
    return
  }

  try {
    const googleEvents = await fetchGoogleCalendarEvents(timeMin, timeMax)

    // Outlook/Teams is an optional add-on source -- Google remains required for the calendar
    // to function at all, so a disconnected Microsoft account shouldn't fail the whole request.
    let outlookEvents: Awaited<ReturnType<typeof fetchOutlookCalendarEvents>> = []
    try {
      outlookEvents = await fetchOutlookCalendarEvents(timeMin, timeMax)
    } catch (err) {
      if (!(err instanceof MicrosoftAuthRequiredError)) throw err
    }

    res.json({ events: [...googleEvents, ...outlookEvents] })
  } catch (err) {
    if (err instanceof GoogleAuthRequiredError) {
      res.status(401).json({ error: err.message, code: 401 })
      return
    }
    res.status(500).json({ error: 'Failed to fetch calendar events', code: 500 })
  }
})

calendarRouter.patch('/events/job', async (req, res) => {
  const { calendarId, eventId, jobId } = req.body as {
    calendarId?: string
    eventId?: string
    jobId?: string
  }

  if (!calendarId || !eventId || !jobId) {
    res.status(400).json({ error: 'calendarId, eventId, and jobId are required', code: 400 })
    return
  }

  try {
    await setGoogleCalendarEventJob(calendarId, eventId, jobId)
    res.json({ success: true })
  } catch (err) {
    if (err instanceof GoogleAuthRequiredError) {
      res.status(401).json({ error: err.message, code: 401 })
      return
    }
    res.status(500).json({ error: 'Failed to assign job', code: 500 })
  }
})
