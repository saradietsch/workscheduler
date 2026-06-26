import { inArray } from 'drizzle-orm'
import { fetchAsanaTasks } from '../auth/asana.js'
import { estimateTaskDurations } from './anthropic.js'
import { db } from '../db/client.js'
import { taskEstimates } from '../db/schema.js'

const DEFAULT_ESTIMATE_MINUTES = 30

export async function getAsanaTasksWithEstimates(workspaceId: string) {
  const tasks = await fetchAsanaTasks(workspaceId)

  const existing =
    tasks.length > 0
      ? await db
          .select()
          .from(taskEstimates)
          .where(inArray(taskEstimates.asanaTaskId, tasks.map((t) => t.id)))
      : []
  const estimateMap = new Map(existing.map((row) => [row.asanaTaskId, row]))

  const needsEstimate = tasks.filter((t) => !estimateMap.has(t.id))
  if (needsEstimate.length > 0) {
    const aiEstimates = await estimateTaskDurations(
      needsEstimate.map((t) => ({ id: t.id, name: t.name, notes: t.notes })),
    )

    const rowsToInsert = needsEstimate.map((t) => ({
      asanaTaskId: t.id,
      estimatedMinutes: aiEstimates[t.id] ?? DEFAULT_ESTIMATE_MINUTES,
      source: 'ai',
    }))

    if (rowsToInsert.length > 0) {
      await db.insert(taskEstimates).values(rowsToInsert).onConflictDoNothing()
    }

    for (const row of rowsToInsert) {
      estimateMap.set(row.asanaTaskId, { ...row, updatedAt: new Date() })
    }
  }

  return tasks.map((task) => {
    const estimate = estimateMap.get(task.id)
    return {
      id: task.id,
      name: task.name,
      dueDate: task.dueDate,
      completed: task.completed,
      projectName: task.projectName,
      permalink: task.permalink,
      estimatedMinutes: estimate?.estimatedMinutes ?? DEFAULT_ESTIMATE_MINUTES,
      estimateSource: (estimate?.source ?? 'ai') as 'ai' | 'manual',
    }
  })
}
