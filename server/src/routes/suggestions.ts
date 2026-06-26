import { Router } from 'express'
import { and, eq, gte, lte, inArray, ne } from 'drizzle-orm'
import { fetchDefaultAsanaWorkspaceId } from '../auth/asana.js'
import {
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  GoogleAuthRequiredError,
} from '../auth/google.js'
import { AsanaAuthRequiredError } from '../auth/asana.js'
import { getAsanaTasksWithEstimates } from '../lib/tasksWithEstimates.js'
import { findFreeBlocks } from '../lib/freeBlocks.js'
import { suggestTaskBlocks } from '../lib/anthropic.js'
import { db } from '../db/client.js'
import { suggestedBlocks } from '../db/schema.js'

export const suggestionsRouter = Router()

function parseRange(req: { query: Record<string, unknown> }) {
  const { timeMin, timeMax } = req.query
  if (typeof timeMin !== 'string' || typeof timeMax !== 'string') return null
  return { timeMin, timeMax }
}

suggestionsRouter.get('/', async (req, res) => {
  const range = parseRange(req)
  if (!range) {
    res.status(400).json({ error: 'timeMin and timeMax are required', code: 400 })
    return
  }

  try {
    const rows = await db
      .select()
      .from(suggestedBlocks)
      .where(
        and(
          gte(suggestedBlocks.start, new Date(range.timeMin)),
          lte(suggestedBlocks.end, new Date(range.timeMax)),
          ne(suggestedBlocks.status, 'dismissed'),
        ),
      )

    res.json({
      suggestions: rows.map((row) => ({
        id: row.id,
        taskId: row.asanaTaskId,
        taskName: row.taskName,
        start: row.start.toISOString(),
        end: row.end.toISOString(),
        status: row.status,
      })),
    })
  } catch {
    res.status(500).json({ error: 'Failed to fetch suggestions', code: 500 })
  }
})

suggestionsRouter.post('/generate', async (req, res) => {
  const range = parseRange({ query: req.body })
  if (!range) {
    res.status(400).json({ error: 'timeMin and timeMax are required', code: 400 })
    return
  }

  try {
    const workspaceId = await fetchDefaultAsanaWorkspaceId()
    if (!workspaceId) {
      res.status(400).json({ error: 'No Asana workspace found', code: 400 })
      return
    }

    const [tasks, events] = await Promise.all([
      getAsanaTasksWithEstimates(workspaceId),
      fetchGoogleCalendarEvents(range.timeMin, range.timeMax),
    ])

    // Only suggest tasks that are due within this range (or have no due date) -- a task due
    // next week shouldn't get scheduled into this week's calendar.
    const rangeEnd = new Date(range.timeMax)
    const incompleteTasks = tasks.filter(
      (t) => !t.completed && (!t.dueDate || new Date(`${t.dueDate}T23:59:59`) <= rangeEnd),
    )

    const freeBlocks = findFreeBlocks(events, new Date(range.timeMin), new Date(range.timeMax))

    const assignments = await suggestTaskBlocks(
      incompleteTasks.map((t) => ({
        id: t.id,
        name: t.name,
        estimatedMinutes: t.estimatedMinutes,
        dueDate: t.dueDate,
      })),
      freeBlocks.map((b) => ({ start: b.start.toISOString(), end: b.end.toISOString() })),
    )

    const taskNameById = new Map(incompleteTasks.map((t) => [t.id, t.name]))
    const taskIds = incompleteTasks.map((t) => t.id)

    if (taskIds.length > 0) {
      await db
        .delete(suggestedBlocks)
        .where(
          and(eq(suggestedBlocks.status, 'suggested'), inArray(suggestedBlocks.asanaTaskId, taskIds)),
        )
    }

    const rowsToInsert = assignments
      .filter((a) => taskNameById.has(a.taskId))
      .map((a) => ({
        id: crypto.randomUUID(),
        asanaTaskId: a.taskId,
        taskName: taskNameById.get(a.taskId)!,
        start: new Date(a.start),
        end: new Date(a.end),
        status: 'suggested',
      }))

    if (rowsToInsert.length > 0) {
      await db.insert(suggestedBlocks).values(rowsToInsert)
    }

    res.json({
      suggestions: rowsToInsert.map((row) => ({
        id: row.id,
        taskId: row.asanaTaskId,
        taskName: row.taskName,
        start: row.start.toISOString(),
        end: row.end.toISOString(),
        status: row.status,
      })),
    })
  } catch (err) {
    if (err instanceof GoogleAuthRequiredError || err instanceof AsanaAuthRequiredError) {
      res.status(401).json({ error: err.message, code: 401 })
      return
    }
    res.status(500).json({ error: 'Failed to generate suggestions', code: 500 })
  }
})

suggestionsRouter.delete('/:id', async (req, res) => {
  try {
    const [row] = await db.select().from(suggestedBlocks).where(eq(suggestedBlocks.id, req.params.id))
    if (!row) {
      res.status(404).json({ error: 'Suggestion not found', code: 404 })
      return
    }

    if (row.status === 'accepted' && row.googleEventId) {
      await deleteGoogleCalendarEvent('primary', row.googleEventId)
    }

    await db
      .update(suggestedBlocks)
      .set({ status: 'dismissed', googleEventId: null })
      .where(eq(suggestedBlocks.id, req.params.id))
    res.json({ success: true })
  } catch (err) {
    if (err instanceof GoogleAuthRequiredError) {
      res.status(401).json({ error: err.message, code: 401 })
      return
    }
    res.status(500).json({ error: 'Failed to dismiss suggestion', code: 500 })
  }
})

suggestionsRouter.post('/:id/accept', async (req, res) => {
  try {
    const [row] = await db.select().from(suggestedBlocks).where(eq(suggestedBlocks.id, req.params.id))
    if (!row) {
      res.status(404).json({ error: 'Suggestion not found', code: 404 })
      return
    }

    if (row.status === 'accepted' && row.googleEventId) {
      res.json({ id: row.id, googleEventId: row.googleEventId, status: 'accepted' })
      return
    }

    const googleEventId = await createGoogleCalendarEvent(
      row.taskName,
      row.start.toISOString(),
      row.end.toISOString(),
    )

    await db
      .update(suggestedBlocks)
      .set({ status: 'accepted', googleEventId })
      .where(eq(suggestedBlocks.id, row.id))

    res.json({ id: row.id, googleEventId, status: 'accepted' })
  } catch (err) {
    if (err instanceof GoogleAuthRequiredError) {
      res.status(401).json({ error: err.message, code: 401 })
      return
    }
    res.status(500).json({ error: 'Failed to accept suggestion', code: 500 })
  }
})

suggestionsRouter.patch('/:id', async (req, res) => {
  const { start, end } = req.body as { start?: string; end?: string }

  if (typeof start !== 'string' || typeof end !== 'string') {
    res.status(400).json({ error: 'start and end are required', code: 400 })
    return
  }

  try {
    const [row] = await db.select().from(suggestedBlocks).where(eq(suggestedBlocks.id, req.params.id))
    if (!row) {
      res.status(404).json({ error: 'Suggestion not found', code: 404 })
      return
    }

    if (row.status === 'accepted' && row.googleEventId) {
      await updateGoogleCalendarEvent(row.googleEventId, start, end)
    }

    await db
      .update(suggestedBlocks)
      .set({ start: new Date(start), end: new Date(end) })
      .where(eq(suggestedBlocks.id, row.id))

    res.json({ id: row.id, start, end, status: row.status })
  } catch (err) {
    if (err instanceof GoogleAuthRequiredError) {
      res.status(401).json({ error: err.message, code: 401 })
      return
    }
    res.status(500).json({ error: 'Failed to reposition suggestion', code: 500 })
  }
})
