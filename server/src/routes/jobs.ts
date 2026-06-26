import { Router } from 'express'
import { db } from '../db/client.js'
import { jobs } from '../db/schema.js'
import { getOrSeedJobs } from '../lib/jobs.js'

export const jobsRouter = Router()

jobsRouter.get('/', async (_req, res) => {
  try {
    const rows = await getOrSeedJobs()
    res.json({ jobs: rows })
  } catch {
    res.status(500).json({ error: 'Failed to fetch jobs', code: 500 })
  }
})

jobsRouter.post('/', async (req, res) => {
  const { name, color } = req.body as { name?: string; color?: string }

  const validColors = ['mango', 'blush', 'sunflower', 'lilac', 'rose']
  if (typeof name !== 'string' || !name.trim() || !validColors.includes(color ?? '')) {
    res.status(400).json({ error: 'name and a valid color are required', code: 400 })
    return
  }

  try {
    const [created] = await db
      .insert(jobs)
      .values({ id: crypto.randomUUID(), name: name.trim(), color: color!, defaultSource: null })
      .returning()
    res.json({ job: created })
  } catch {
    res.status(500).json({ error: 'Failed to create job', code: 500 })
  }
})
