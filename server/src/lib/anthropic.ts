import Anthropic from '@anthropic-ai/sdk'

let client: Anthropic | null = null

function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return client
}

interface TaskInput {
  id: string
  name: string
  notes?: string
}

export async function estimateTaskDurations(tasks: TaskInput[]): Promise<Record<string, number>> {
  if (tasks.length === 0) return {}

  const response = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    tools: [
      {
        name: 'estimate_durations',
        description: 'Record an estimated duration in minutes for each task.',
        input_schema: {
          type: 'object',
          properties: {
            estimates: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  estimatedMinutes: { type: 'integer' },
                },
                required: ['id', 'estimatedMinutes'],
              },
            },
          },
          required: ['estimates'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'estimate_durations' },
    messages: [
      {
        role: 'user',
        content: `Estimate how long each task will take to complete, in minutes. If the task text gives an explicit time reference (e.g. "5 hours of learning X"), use that. Otherwise estimate based on the task's apparent complexity -- default to short estimates (around 30 minutes) for vague or simple-sounding tasks.

Tasks:
${tasks.map((t) => `- id: ${t.id}\n  name: ${t.name}${t.notes ? `\n  notes: ${t.notes}` : ''}`).join('\n')}`,
      },
    ],
  })

  const toolUse = response.content.find((block) => block.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') return {}

  const input = toolUse.input as { estimates: { id: string; estimatedMinutes: number }[] }
  const result: Record<string, number> = {}
  for (const { id, estimatedMinutes } of input.estimates) {
    result[id] = estimatedMinutes
  }
  return result
}

interface SchedulableTask {
  id: string
  name: string
  estimatedMinutes: number
  dueDate: string | null
}

interface FreeWindow {
  start: string
  end: string
}

export interface SuggestedAssignment {
  taskId: string
  start: string
  end: string
}

export async function suggestTaskBlocks(
  tasks: SchedulableTask[],
  freeBlocks: FreeWindow[],
): Promise<SuggestedAssignment[]> {
  if (tasks.length === 0 || freeBlocks.length === 0) return []

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    tools: [
      {
        name: 'suggest_blocks',
        description: 'Propose a specific time block for each task that should be scheduled.',
        input_schema: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  taskId: { type: 'string' },
                  start: { type: 'string', description: 'ISO 8601 datetime' },
                  end: { type: 'string', description: 'ISO 8601 datetime' },
                },
                required: ['taskId', 'start', 'end'],
              },
            },
          },
          required: ['suggestions'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'suggest_blocks' },
    messages: [
      {
        role: 'user',
        content: `Schedule these tasks into the given free time blocks on the user's calendar.

Rules:
- A suggested block's start/end must fall entirely within one free block (don't span across a busy period).
- A suggested block's duration should match the task's estimatedMinutes as closely as possible, never exceeding the free block it's placed in.
- Prioritize tasks with sooner due dates -- schedule those earlier than tasks without a due date or with later due dates.
- Not every task needs a suggestion if there isn't reasonable free time left -- it's fine to omit a task rather than force a bad fit.
- Don't suggest more than one block per task.
- Don't double-book a free block -- once part of a free block is used by one suggestion, treat the remainder as the new available space for the next suggestion.

Tasks:
${tasks.map((t) => `- id: ${t.id}, estimatedMinutes: ${t.estimatedMinutes}, dueDate: ${t.dueDate ?? 'none'}, name: ${t.name}`).join('\n')}

Free blocks:
${freeBlocks.map((b) => `- ${b.start} to ${b.end}`).join('\n')}`,
      },
    ],
  })

  const toolUse = response.content.find((block) => block.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') return []

  const input = toolUse.input as { suggestions: SuggestedAssignment[] }
  return input.suggestions
}
