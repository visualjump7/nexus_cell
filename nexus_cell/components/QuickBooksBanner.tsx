'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useToast } from '@/components/shared/Toast'
import type { QuickBooksConnection } from '@/lib/types'
import { RpTag, RpButton, RpModal, timeAgo, dot } from '@/components/rp'

interface Props {
  connection: QuickBooksConnection | null
  canWrite: boolean
  isConfigured: boolean
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

  // ── State-specific copy and actions ──
  const connected = isConfigured && !!connection
  let statusText: string
  let actions: React.ReactNode = null

  if (!isConfigured) {
    statusText = 'Not connected · bills are entered here or imported from Excel'
    actions = (
      <RpButton
        variant="ghost"
        size="sm"
        disabled
        title="Set QUICKBOOKS_CLIENT_ID and QUICKBOOKS_CLIENT_SECRET"
      >
        Connect
      </RpButton>
    )
  } else if (!connection) {
    statusText = 'Not connected · bills are entered here or imported from Excel'
    actions = canWrite ? (
      // Full navigation: the OAuth hand-off is a server redirect, not a client route.
      <a href="/api/quickbooks/authorize" className="rp-btn-ghost rp-btn--sm">
        Connect <span aria-hidden>→</span>
      </a>
    ) : null
  } else {
    const envLabel = connection.environment === 'sandbox' ? 'Sandbox' : 'Production'
    statusText = dot('Connected', envLabel, `Realm ${connection.realm_id}`, `Last synced ${connection.last_synced_at ? timeAgo(connection.last_synced_at) : 'never'}`)
    actions = canWrite ? (
      <div className="flex items-center gap-2">
        <RpButton variant="ghost" size="sm" onClick={handleSync} disabled={syncing}>
          {syncing ? 'Syncing' : 'Sync now'}
        </RpButton>
        <RpButton variant="danger" size="sm" onClick={() => setShowConfirmDisconnect(true)}>
          Disconnect
        </RpButton>
      </div>
    ) : null
  }

  return (
    <>
      <div className="rp-box flex flex-wrap items-center gap-3 px-5 py-3.5">
        <RpTag tone={connected ? 'green' : 'neutral'}>QuickBooks</RpTag>
        <span
          aria-hidden
          className={`h-2 w-2 shrink-0 ${connected ? 'bg-rp-green' : 'bg-rp-dim'}`}
        />
        <p className="order-last min-w-0 basis-full text-sm text-rp-muted sm:order-none sm:basis-0 sm:flex-1" suppressHydrationWarning>
          <span className="sr-only">{connected ? 'QuickBooks connected. ' : 'QuickBooks not connected. '}</span>
          {statusText}
          {!isConfigured && <span className="text-rp-dim"> · API credentials not configured</span>}
        </p>
        {actions && <div className="ml-auto shrink-0">{actions}</div>}
      </div>

      <RpModal
        open={showConfirmDisconnect}
        onClose={() => setShowConfirmDisconnect(false)}
        eyebrow="QuickBooks"
        title="Disconnect QuickBooks?"
        size="sm"
        footer={
          <>
            <RpButton variant="ghost" onClick={() => setShowConfirmDisconnect(false)}>Cancel</RpButton>
            <RpButton variant="danger" onClick={handleDisconnect} disabled={disconnecting}>
              {disconnecting ? 'Disconnecting' : 'Disconnect'}
            </RpButton>
          </>
        }
      >
        <p className="text-[15px] leading-normal text-rp-muted">
          Bills stay as they are here. They stop syncing with QuickBooks until you connect again.
        </p>
      </RpModal>
    </>
  )
}
