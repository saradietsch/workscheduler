import { db } from '../db/client.js'
import { jobs } from '../db/schema.js'

const DEFAULT_JOBS = [
  { id: 'default-serving', name: 'Serving', color: 'mango', defaultSource: 'secondary' },
  { id: 'default-internship', name: 'Internship', color: 'lilac', defaultSource: 'primary' },
  { id: 'default-school', name: 'School', color: 'blush', defaultSource: 'outlook' },
]

export type EventSource = 'primary' | 'secondary' | 'outlook'

export async function getOrSeedJobs() {
  const rows = await db.select().from(jobs)
  if (rows.length > 0) return rows

  await db.insert(jobs).values(DEFAULT_JOBS).onConflictDoNothing()
  return db.select().from(jobs)
}

export function resolveJobForEvent(
  explicitJobId: string | undefined,
  source: EventSource,
  allJobs: { id: string; name: string; color: string; defaultSource: string | null }[],
) {
  if (explicitJobId) {
    const explicit = allJobs.find((j) => j.id === explicitJobId)
    if (explicit) return explicit
  }

  return allJobs.find((j) => j.defaultSource === source) ?? null
}
