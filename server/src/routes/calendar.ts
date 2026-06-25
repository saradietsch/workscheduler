import { Router } from 'express'
import { fetchGoogleCalendarEvents, GoogleAuthRequiredError } from '../auth/google.js'

export const calendarRouter = Router()

calendarRouter.get('/events', async (req, res) => {
  const { timeMin, timeMax } = req.query

  if (typeof timeMin !== 'string' || typeof timeMax !== 'string') {
    res.status(400).json({ error: 'timeMin and timeMax are required', code: 400 })
    return
  }

  try {
    const events = await fetchGoogleCalendarEvents(timeMin, timeMax)
    res.json({ events })
  } catch (err) {
    if (err instanceof GoogleAuthRequiredError) {
      res.status(401).json({ error: err.message, code: 401 })
      return
    }
    res.status(500).json({ error: 'Failed to fetch calendar events', code: 500 })
  }
})
