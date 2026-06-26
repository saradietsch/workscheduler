import { Router } from 'express'
import { getGoogleAuthUrl, exchangeGoogleCode, isGoogleAuthed } from '../auth/google.js'
import { getAsanaAuthUrl, exchangeAsanaCode, isAsanaAuthed } from '../auth/asana.js'
import {
  getMicrosoftAuthUrl,
  exchangeMicrosoftCode,
  isMicrosoftAuthed,
} from '../auth/microsoft.js'

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

authRouter.get('/google/status', async (_req, res) => {
  res.json({ connected: await isGoogleAuthed() })
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

authRouter.get('/asana/status', async (_req, res) => {
  res.json({ connected: await isAsanaAuthed() })
})

authRouter.get('/microsoft', (_req, res) => {
  res.redirect(getMicrosoftAuthUrl())
})

authRouter.get('/microsoft/callback', async (req, res) => {
  try {
    const code = req.query.code as string
    await exchangeMicrosoftCode(code)
    res.redirect(clientUrl)
  } catch {
    res.status(500).json({ error: 'Failed to connect Microsoft 365', code: 500 })
  }
})

authRouter.get('/microsoft/status', async (_req, res) => {
  res.json({ connected: await isMicrosoftAuthed() })
})
