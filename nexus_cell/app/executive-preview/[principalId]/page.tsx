/* eslint-disable @next/next/no-img-element */
import { getAuthContext } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import ExecutiveView from '@/app/(home)/executive/ExecutiveView'
import { RpTag } from '@/components/rp'
import { BRAND } from '@/lib/brand'

// Renders the saved ExecutiveView for a given principal as the EA would see it.
// Used by the Preview-as-principal modal in the config UI. EA/admin only.
// Lives outside (modules) so the owner's view renders without the app shell
// (no sidebar, no top bar, no FloatingAdd): only a brand line above it.
export default async function ExecutiveViewPreviewPage({
  params,
}: {
  params: { principalId: string }
}) {
  const { supabase, orgId, role } = await getAuthContext()
  if (!['ea', 'admin'].includes(role)) redirect('/')

  // Confirm the target user is actually a principal in this org
  const { data: target } = await supabase
    .from('organization_members')
    .select('user_id, role, profiles(full_name, email)')
    .eq('organization_id', orgId)
    .eq('user_id', params.principalId)
    .eq('status', 'active')
    .single()

  if (!target || target.role !== 'principal') notFound()

  const profile = target.profiles as unknown as { full_name: string | null; email: string } | null
  const fullName = profile?.full_name || profile?.email || 'Owner'
  const firstName = fullName.split(' ')[0]

  return (
    <div className="min-h-screen bg-rp-bg">
      <div className="flex h-14 items-center gap-3 border-b border-rp-line px-[var(--rp-gutter)]">
        <img src={BRAND.badgeAlt} alt="" aria-hidden className="h-auto w-8 shrink-0" />
        <span className="flex min-w-0 flex-col leading-none">
          <span className="truncate font-display text-sm font-medium uppercase tracking-[.12em] text-rp-text">{BRAND.name}</span>
          <span className="mt-1 text-[10px] uppercase tracking-[.18em] text-rp-muted">{BRAND.subName}</span>
        </span>
        <RpTag tone="blue" className="ml-auto shrink-0">Preview<span className="max-sm:hidden"> · {fullName}</span></RpTag>
      </div>
      <div className="rp-main-inner">
        <ExecutiveView firstName={firstName} orgId={orgId} principalId={params.principalId} />
      </div>
    </div>
  )
}
