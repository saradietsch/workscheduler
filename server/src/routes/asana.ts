import { Router } from 'express'
import { fetchAsanaTasks, AsanaAuthRequiredError } from '../auth/asana.js'

export const asanaRouter = Router()

asanaRouter.get('/tasks', async (req, res) => {
  const { workspaceId } = req.query

  if (typeof workspaceId !== 'string') {
    res.status(400).json({ error: 'workspaceId is required', code: 400 })
    return
  }

  try {
    const tasks = await fetchAsanaTasks(workspaceId)
    res.json({ tasks })
  } catch (err) {
    if (err instanceof AsanaAuthRequiredError) {
      res.status(401).json({ error: err.message, code: 401 })
      return
    }
    res.status(500).json({ error: 'Failed to fetch Asana tasks', code: 500 })
  }
})
