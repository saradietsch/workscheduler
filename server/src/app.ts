import express from 'express'
import { authRouter } from './routes/auth.js'
import { calendarRouter } from './routes/calendar.js'
import { asanaRouter } from './routes/asana.js'

export const app = express()

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api/calendar', calendarRouter)
app.use('/api/asana', asanaRouter)
