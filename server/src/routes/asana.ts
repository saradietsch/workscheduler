import { Router } from 'express'
import {
  fetchAsanaTasks,
  fetchDefaultAsanaWorkspaceId,
  AsanaAuthRequiredError,
} from '../auth/asana.js'

export const asanaRouter = Router()

asanaRouter.get('/tasks', async (req, res) => {
  const queryWorkspaceId = req.query.workspaceId

  try {
    const workspaceId =
      typeof queryWorkspaceId === 'string' ? queryWorkspaceId : await fetchDefaultAsanaWorkspaceId()

    if (!workspaceId) {
      res.status(400).json({ error: 'No Asana workspace found', code: 400 })
      return
    }

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
