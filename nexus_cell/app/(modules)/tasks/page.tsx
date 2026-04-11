import { getAuthContext } from '@/lib/auth'
import TasksList from '@/app/(app)/tasks/TasksList'

export default async function TasksPage() {
  const { supabase, user, orgId, role } = await getAuthContext()

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  const { data: members } = await supabase
    .from('organization_members')
    .select('user_id, role, profiles(full_name, email)')
    .eq('organization_id', orgId)
    .eq('status', 'active')

  const memberOptions = (members || []).map(m => {
    const profile = m.profiles as unknown as { full_name: string; email: string } | null
    return { id: m.user_id, name: profile?.full_name || profile?.email || m.user_id, role: m.role }
  })

  return (
    <div>
      <TasksList tasks={tasks || []} role={role} userId={user.id} members={memberOptions} />
    </div>
  )
}
