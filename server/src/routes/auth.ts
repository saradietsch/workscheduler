import { Router } from 'express'
import { getGoogleAuthUrl, exchangeGoogleCode, isGoogleAuthed } from '../auth/google.js'
import { getAsanaAuthUrl, exchangeAsanaCode, isAsanaAuthed } from '../auth/asana.js'

export const authRouter = Router()

const clientUrl = process.env.CLIENT_URL ?? '/'

authRouter.get('/google', (_req, res) => {
  res.redirect(getGoogleAuthUrl())
})

authRouter.get('/google/callback', async (req, res) => {
  try {
    const code = req.query.code as string
    await exchangeGoogleCode(code)
    res.redirect(clientUrl)
  } catch {
    res.status(500).json({ error: 'Failed to connect Google Calendar', code: 500 })
  }
})

authRouter.get('/google/status', (_req, res) => {
  res.json({ connected: isGoogleAuthed() })
})

authRouter.get('/asana', (_req, res) => {
  res.redirect(getAsanaAuthUrl())
})

authRouter.get('/asana/callback', async (req, res) => {
  try {
    const code = req.query.code as string
    await exchangeAsanaCode(code)
    res.redirect(clientUrl)
  } catch {
    res.status(500).json({ error: 'Failed to connect Asana', code: 500 })
  }
})

authRouter.get('/asana/status', (_req, res) => {
  res.json({ connected: isAsanaAuthed() })
})
