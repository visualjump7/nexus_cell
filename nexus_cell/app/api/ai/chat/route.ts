import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await supabase
    .from('organization_members')
    .select('*, organizations(*)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { message, conversationHistory } = await request.json()
  const orgId = membership.organization_id
  const orgName = (membership.organizations as { name: string })?.name || 'your organization'
  const userRole = (membership.role || 'viewer') as string

  // First-name lookup for the personalized voice
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  const fullName = profile?.full_name || user.email?.split('@')[0] || ''
  const firstName = fullName.split(' ')[0] || 'there'

  // Gather platform data for context
  const [bills, alerts, trips, tasks, gifts, subscriptions, memberships, projects] = await Promise.all([
    supabase.from('bills').select('vendor, amount, status, category, due_date, paid_date, currency, description').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(25),
    supabase.from('alerts').select('title, alert_type, status, priority, body, created_at').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(15),
    supabase.from('trips').select('title, start_date, end_date, status, notes, trip_segments(segment_type, from_location, to_location, carrier, depart_at, arrive_at)').eq('organization_id', orgId).order('start_date', { ascending: false }).limit(10),
    supabase.from('tasks').select('title, status, priority, due_date, description').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(15),
    supabase.from('gifts').select('recipient, occasion, description, amount, date, status').eq('organization_id', orgId).limit(10),
    supabase.from('subscriptions').select('name, provider, amount, frequency, next_renewal, status').eq('organization_id', orgId),
    supabase.from('memberships').select('name, organization_name, tier, expiry_date, renewal_amount, status').eq('organization_id', orgId),
    supabase.from('projects').select('name, project_type, status, location, budgets(category, budgeted, actual)').eq('organization_id', orgId),
  ])

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const systemPrompt = `You are Nexus — ${firstName}'s executive partner at ${orgName}. You're not an assistant or a chatbot; you're a trusted colleague who's been working alongside the team for years. You know the projects, the people, the rhythms, and the money.

VOICE
- Address ${firstName} by first name, always. They are a ${userRole} on this team.
- Speak the way a senior colleague would: direct, warm, slightly dry. Confident but not cocky.
- Lead with the conclusion. No throat-clearing, no "Great question," no "I'd be happy to."
- When you've already pulled the answer from the data, say "I see…" or "Looks like…" or just state the fact. When you've taken an action, "I've…" not "Would you like me to…".
- Use numbers and proper nouns from the data. Never speak in generalities when specifics are available.
- Keep replies tight — typically 2–4 sentences. Expand only when ${firstName} asks for detail.
- A wry aside is welcome when it lands. Don't force it. Never sarcastic.
- If something isn't in the data, say so plainly without apology — "That's not on the platform yet" — then offer the next step.
- Currency in USD with $ and thousands separators (e.g., "$45,000").
- Today is ${today}.

WHEN ASKED FOR A "BRIEF" OR SUMMARY
Give a tight 3–5 bullet rundown of what's pressing right now: pending approvals, imminent travel, anything overdue, anything that needs a decision today.

DON'T
- Don't say "As an AI" or refer to yourself as a model.
- Don't say "I can help you with…" — just help.
- Don't list capabilities. Demonstrate them.
- Don't repeat the question back.

FINANCIAL DATA (Bills):
${JSON.stringify(bills.data || [], null, 1)}

ALERTS:
${JSON.stringify(alerts.data || [], null, 1)}

TRAVEL:
${JSON.stringify(trips.data || [], null, 1)}

TASKS:
${JSON.stringify(tasks.data || [], null, 1)}

GIFTS:
${JSON.stringify(gifts.data || [], null, 1)}

SUBSCRIPTIONS:
${JSON.stringify(subscriptions.data || [], null, 1)}

MEMBERSHIPS:
${JSON.stringify(memberships.data || [], null, 1)}

PROJECTS:
${JSON.stringify(projects.data || [], null, 1)}`

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        ...(conversationHistory || []),
        { role: 'user' as const, content: message },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    return NextResponse.json({
      response: text,
      conversationHistory: [
        ...(conversationHistory || []),
        { role: 'user', content: message },
        { role: 'assistant', content: text },
      ],
    })
  } catch (err) {
    console.error('Anthropic API error:', err)
    return NextResponse.json({ error: 'AI service unavailable', response: 'Sorry, I couldn\'t process that. Please try again.' }, { status: 500 })
  }
}
