import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'

async function fetchStatus(provider: 'google' | 'asana' | 'microsoft') {
  const res = await fetch(`/api/auth/${provider}/status`)
  const data = (await res.json()) as { connected: boolean }
  return data.connected
}

function ConnectRow({
  label,
  provider,
}: {
  label: string
  provider: 'google' | 'asana' | 'microsoft'
}) {
  const { data: connected, isLoading } = useQuery({
    queryKey: ['auth', provider, 'status'],
    queryFn: () => fetchStatus(provider),
  })

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-body text-sm text-plum">{label}</span>
      {isLoading ? (
        <span className="font-body text-sm text-plum/60">…</span>
      ) : connected ? (
        <span className="font-handwrite text-sm text-rust">Connected</span>
      ) : (
        <Button asChild size="sm" className="font-handwrite">
          <a href={`/api/auth/${provider}`}>Connect</a>
        </Button>
      )}
    </div>
  )
}

export function ConnectAccounts() {
  return (
    <div className="flex flex-col gap-2 rounded-card bg-ivory p-4">
      <ConnectRow label="Google Calendar" provider="google" />
      <ConnectRow label="Asana" provider="asana" />
      <ConnectRow label="Microsoft 365" provider="microsoft" />
    </div>
  )
}
