import { Router } from 'express'
import {
  fetchDefaultAsanaWorkspaceId,
  setAsanaTaskCompleted,
  AsanaAuthRequiredError,
} from '../auth/asana.js'
import { getAsanaTasksWithEstimates } from '../lib/tasksWithEstimates.js'
import { db } from '../db/client.js'
import { taskEstimates } from '../db/schema.js'

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

    const tasks = await getAsanaTasksWithEstimates(workspaceId)
    res.json({ tasks })
  } catch (err) {
    if (err instanceof AsanaAuthRequiredError) {
      res.status(401).json({ error: err.message, code: 401 })
      return
    }
    res.status(500).json({ error: 'Failed to fetch Asana tasks', code: 500 })
  }
})

asanaRouter.patch('/tasks/:id/estimate', async (req, res) => {
  const { id } = req.params
  const { estimatedMinutes } = req.body as { estimatedMinutes?: number }

  if (typeof estimatedMinutes !== 'number' || estimatedMinutes <= 0) {
    res.status(400).json({ error: 'estimatedMinutes must be a positive number', code: 400 })
    return
  }

  try {
    await db
      .insert(taskEstimates)
      .values({ asanaTaskId: id, estimatedMinutes, source: 'manual' })
      .onConflictDoUpdate({
        target: taskEstimates.asanaTaskId,
        set: { estimatedMinutes, source: 'manual', updatedAt: new Date() },
      })
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to update estimate', code: 500 })
  }
})

asanaRouter.patch('/tasks/:id/complete', async (req, res) => {
  const { id } = req.params
  const { completed } = req.body as { completed?: boolean }

  if (typeof completed !== 'boolean') {
    res.status(400).json({ error: 'completed must be a boolean', code: 400 })
    return
  }

  try {
    await setAsanaTaskCompleted(id, completed)
    res.json({ success: true })
  } catch (err) {
    if (err instanceof AsanaAuthRequiredError) {
      res.status(401).json({ error: err.message, code: 401 })
      return
    }
    res.status(500).json({ error: 'Failed to update task', code: 500 })
  }
})
