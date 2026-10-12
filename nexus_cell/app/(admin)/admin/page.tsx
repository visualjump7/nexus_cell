import Link from 'next/link'
import { getAuthContext } from '@/lib/auth'
import type { PendingInvitation } from '@/lib/types'
import {
  RpPage,
  RpPageHeader,
  RpStatStrip,
  RpStat,
  RpSubhead,
  RpTable,
  RpStatus,
  RpButton,
  RpEmpty,
  fmtDate,
  pad2,
} from '@/components/rp'

export const metadata = { title: 'Administrator' }

export default async function AdminOverviewPage() {
  const { supabase, orgId } = await getAuthContext()

  const [membersRes, principalsRes, pendingInvitesRes, recentInvitesRes] = await Promise.all([
    supabase.from('organization_members').select('user_id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'active'),
    supabase.from('organization_members').select('user_id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'active').eq('role', 'principal'),
    supabase.from('pending_invitations').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'pending'),
    supabase.from('pending_invitations').select('*').eq('organization_id', orgId).eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
  ])

  const members = membersRes.count ?? 0
  const owners = principalsRes.count ?? 0
  const pendingCount = pendingInvitesRes.count ?? 0
  const pending = (recentInvitesRes.data || []) as PendingInvitation[]

  return (
    <RpPage>
      <RpPageHeader
        eyebrow="01 · Administrator"
        title="Members, owners and access"
        line="Who can see the build, and what the owner sees."
      />

      <RpStatStrip cols={3}>
        <RpStat label="Active members" value={members} sub="Accounts with access to the portal" href="/admin/users" />
        <RpStat label="Owners" value={owners} sub="Each with a curated home view" href="/admin/principals" />
        <RpStat
          label="Pending invitations"
          value={pendingCount}
          sub={pendingCount > 0 ? 'Waiting for your approval' : 'Nothing waiting'}
          href="/admin/users"
        />
      </RpStatStrip>

      <section className="flex flex-col gap-5">
        <RpSubhead
          title="Pending invitations"
          spec="Proposed by the owner's rep · approve or decline under Members"
          aside={<RpButton variant="text" arrow href="/admin/users">Review all</RpButton>}
        />
        {pending.length === 0 ? (
          <RpEmpty compact title="Nothing waiting." line="New accounts proposed by the owner's rep appear here for approval." />
        ) : (
          <RpTable minWidth={720} caption="Pending invitations">
            <thead>
              <tr>
                <th className="idx">#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Proposed</th>
                <th className="num relative"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {pending.map((inv, i) => (
                <tr key={inv.id}>
                  <td className="idx">{pad2(i + 1)}</td>
                  <td><Link href="/admin/users">{inv.full_name}</Link></td>
                  <td className="text-rp-muted">{inv.email}</td>
                  <td><RpStatus kind="role" value={inv.role} /></td>
                  <td className="whitespace-nowrap text-rp-muted">{fmtDate(inv.created_at)}</td>
                  <td className="num"><RpButton variant="ghost" size="sm" href="/admin/users">Review</RpButton></td>
                </tr>
              ))}
            </tbody>
          </RpTable>
        )}
      </section>
    </RpPage>
  )
}
