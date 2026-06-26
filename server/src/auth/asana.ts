import { tokenStore } from './tokenStore.js'

const AUTHORIZE_URL = 'https://app.asana.com/-/oauth_authorize'
const TOKEN_URL = 'https://app.asana.com/-/oauth_token'
const API_BASE = 'https://app.asana.com/api/1.0'

export class AsanaAuthRequiredError extends Error {
  constructor() {
    super('Asana is not connected')
  }
}

export function getAsanaAuthUrl() {
  const params = new URLSearchParams({
    client_id: process.env.ASANA_CLIENT_ID!,
    redirect_uri: process.env.ASANA_REDIRECT_URI!,
    response_type: 'code',
  })
  return `${AUTHORIZE_URL}?${params.toString()}`
}

export async function exchangeAsanaCode(code: string) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.ASANA_CLIENT_ID!,
      client_secret: process.env.ASANA_CLIENT_SECRET!,
      redirect_uri: process.env.ASANA_REDIRECT_URI!,
      code,
    }),
  })

  if (!response.ok) throw new Error(`Asana token exchange failed: ${response.status}`)

  const data = (await response.json()) as {
    access_token: string
    refresh_token: string
    expires_in: number
  }

  await tokenStore.setAsanaTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  })
}

export async function isAsanaAuthed() {
  return (await tokenStore.getAsanaTokens()) !== null
}

async function getAccessToken() {
  const stored = await tokenStore.getAsanaTokens()
  if (!stored) throw new AsanaAuthRequiredError()
  return stored.accessToken
}

interface AsanaApiTask {
  gid: string
  name: string
  notes: string | null
  due_on: string | null
  completed: boolean
  permalink_url: string
  projects: { name: string }[]
}

export async function fetchDefaultAsanaWorkspaceId() {
  const accessToken = await getAccessToken()
  const response = await fetch(`${API_BASE}/workspaces`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) throw new Error(`Asana workspaces fetch failed: ${response.status}`)

  const { data } = (await response.json()) as { data: { gid: string }[] }
  return data[0]?.gid ?? null
}

export async function fetchAsanaTasks(workspaceId: string) {
  const accessToken = await getAccessToken()
  const params = new URLSearchParams({
    workspace: workspaceId,
    assignee: 'me',
    completed_since: 'now',
    opt_fields: 'name,notes,due_on,completed,permalink_url,projects.name',
  })

  const response = await fetch(`${API_BASE}/tasks?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) throw new Error(`Asana tasks fetch failed: ${response.status}`)

  const { data } = (await response.json()) as { data: AsanaApiTask[] }

  return data.map((task) => ({
    id: task.gid,
    name: task.name,
    notes: task.notes ?? undefined,
    dueDate: task.due_on,
    completed: task.completed,
    projectName: task.projects[0]?.name ?? null,
    permalink: task.permalink_url,
  }))
}

export async function setAsanaTaskCompleted(taskId: string, completed: boolean) {
  const accessToken = await getAccessToken()
  const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: { completed } }),
  })

  if (!response.ok) throw new Error(`Asana task update failed: ${response.status}`)
}
