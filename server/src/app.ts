import express from 'express'
import { authRouter } from './routes/auth.js'
import { calendarRouter } from './routes/calendar.js'
import { asanaRouter } from './routes/asana.js'
import { suggestionsRouter } from './routes/suggestions.js'
import { jobsRouter } from './routes/jobs.js'

export const app = express()

app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api/calendar', calendarRouter)
app.use('/api/asana', asanaRouter)
app.use('/api/suggestions', suggestionsRouter)
app.use('/api/jobs', jobsRouter)
