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

  const systemPrompt = `You are Nexus, the AI assistant for ${orgName}. You have complete access to the platform data below. Answer questions conversationally, concisely, and specifically — always reference actual data points, names, amounts, and dates. Format currency as USD. Keep responses under 200 words unless the user asks for detail. Never say you don't have access to data. If asked about something not in the data, say it hasn't been added to the platform yet.

Today is ${today}.

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
