'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useToast } from '@/components/shared/Toast'
import type { QuickBooksConnection } from '@/lib/types'

interface Props {
  connection: QuickBooksConnection | null
  canWrite: boolean
  isConfigured: boolean
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

export default function QuickBooksBanner({ connection, canWrite, isConfigured }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [disconnecting, setDisconnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false)

  // Handle URL flash-message params
  useEffect(() => {
    const qb = searchParams.get('qb')
    if (!qb) return

    const reason = searchParams.get('reason')

    switch (qb) {
      case 'connected':
        toast('Connected to QuickBooks', 'success')
        break
      case 'not_configured':
        toast('QuickBooks credentials are not configured', 'error')
        break
      case 'forbidden':
        toast('Only EAs and admins can connect QuickBooks', 'error')
        break
      case 'error':
        toast(reason ? `QuickBooks error: ${reason.replace(/_/g, ' ')}` : 'QuickBooks connection failed', 'error')
        break
    }

    // Strip query params so toast doesn't re-fire
    router.replace(pathname)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch('/api/quickbooks/sync', { method: 'POST' })
      const data = await res.json()
      toast(data.message || data.error || 'Sync requested', res.ok ? 'success' : 'error')
    } catch {
      toast('Sync request failed', 'error')
    }
    setSyncing(false)
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      const res = await fetch('/api/quickbooks/disconnect', { method: 'POST' })
      if (res.ok) {
        toast('QuickBooks disconnected', 'success')
        router.refresh()
      } else {
        const data = await res.json()
        toast(data.error || 'Disconnect failed', 'error')
      }
    } catch {
      toast('Disconnect failed', 'error')
    }
    setDisconnecting(false)
    setShowConfirmDisconnect(false)
  }

  // ── Logo/icon for QB (simple) ──
  const qbIcon = (
    <div className="w-4 h-4 rounded-sm bg-[#2ca01c] flex items-center justify-center shrink-0" title="QuickBooks">
      <span className="text-[9px] font-bold text-white">qb</span>
    </div>
  )

  // ── State-specific render ──
  let dotColor: string
  let statusText: string
  let subText: string | null = null
  let actions: React.ReactNode = null

  if (!isConfigured) {
    dotColor = 'bg-gray-500'
    statusText = 'QuickBooks Online — Not Configured'
    subText = 'Add API credentials to enable'
    actions = (
      <button
        disabled
        title="Set QUICKBOOKS_CLIENT_ID and QUICKBOOKS_CLIENT_SECRET"
        className="px-3 py-1.5 text-xs text-gray-600 bg-white/5 rounded-lg cursor-not-allowed"
      >
        Connect
      </button>
    )
  } else if (!connection) {
    dotColor = 'bg-amber-400'
    statusText = 'QuickBooks Online — Not Connected'
    actions = canWrite ? (
      <a
        href="/api/quickbooks/authorize"
        className="px-3 py-1.5 text-xs text-white bg-[#2ca01c] hover:brightness-110 rounded-lg transition-all font-medium"
      >
        Connect →
      </a>
    ) : null
  } else {
    dotColor = 'bg-emerald-400'
    statusText = `QuickBooks Online — Connected`
    const envLabel = connection.environment === 'sandbox' ? 'Sandbox' : 'Production'
    subText = `${envLabel} · Realm ${connection.realm_id} · Last synced ${timeAgo(connection.last_synced_at)}`
    actions = canWrite ? (
      <div className="flex items-center gap-2">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-3 py-1.5 text-xs text-gray-300 bg-white/5 hover:bg-white/10 rounded-lg transition-all disabled:opacity-50"
        >
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
        <button
          onClick={() => setShowConfirmDisconnect(true)}
          className="px-3 py-1.5 text-xs text-gray-400 hover:text-red-400 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
        >
          Disconnect
        </button>
      </div>
    ) : null
  }

  return (
    <>
      <div className="bg-card rounded-lg px-4 py-2.5 mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {qbIcon}
          <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white truncate">{statusText}</p>
            {subText && <p className="text-[11px] text-gray-500 truncate">{subText}</p>}
          </div>
        </div>
        <div className="shrink-0">{actions}</div>
      </div>

      {/* Disconnect confirmation modal */}
      {showConfirmDisconnect && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowConfirmDisconnect(false)}>
          <div className="bg-main rounded-xl shadow-2xl shadow-black/40 w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-2">Disconnect QuickBooks?</h3>
            <p className="text-sm text-gray-400 mb-6">
              Your Nexus Cell data will remain intact, but bills will no longer sync with QuickBooks. You can reconnect anytime.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDisconnect(false)}
                className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/15 text-gray-300 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors"
              >
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
