// Jarvis-mode helpers.
//
// Generates the personalized hero copy, live context strip, opening AI
// message, and dynamic suggestion chips from real data. All server-side and
// pure — no fetches, no React.
//
// Pass live numbers in via JarvisContext; helpers stay deterministic so the
// EA landing and the principal widget can share the same logic.

export interface JarvisContext {
  firstName: string
  // Time-of-day computed from a Date — pass `new Date()` from caller.
  hour: number
  // Live counts. 0/null where unknown.
  approvalsCount: number
  tasksDueCount: number
  billsDueTodayCount: number
  billsOverdueCount: number
  // Next upcoming trip if any
  nextTrip: { city: string; daysUntil: number; vendor?: string | null } | null
  // High-value approval (over a threshold) if any — drives a specific chip
  topApproval: { vendor: string; amount: number } | null
  // Most-recent published brief title if any
  recentBriefTitle: string | null
}

// ── Greeting word ──
// Time-of-day greeting that always lands warm — never accusatory. After 9pm
// and in the wee hours we lean on "Welcome back" / "Good evening" rather
// than calling out the time.
function greetingWord(hour: number): string {
  if (hour < 5) return 'Welcome back'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

// ── State-aware hero greeting ──
// Picks the most-pressing piece of context to lead with so the headline
// always says something useful. Phrasing favors short, neutral statements
// over reminders of obligation ("X past due" not "X are overdue").
export function buildHeroGreeting(ctx: JarvisContext): { line1: string; line2: string } {
  const greet = greetingWord(ctx.hour)
  const line1 = `${greet}, ${ctx.firstName}.`

  // Priority order: overdue > approvals > imminent trip > bills today > brief > all-clear
  if (ctx.billsOverdueCount > 0) {
    const n = ctx.billsOverdueCount
    return { line1, line2: `${n} bill${n === 1 ? '' : 's'} past due.` }
  }
  if (ctx.approvalsCount >= 3) {
    return { line1, line2: `${ctx.approvalsCount} approvals waiting.` }
  }
  if (ctx.nextTrip && ctx.nextTrip.daysUntil >= 0 && ctx.nextTrip.daysUntil <= 3) {
    const d = ctx.nextTrip.daysUntil
    const when = d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`
    return { line1, line2: `${ctx.nextTrip.city} ${when}.` }
  }
  if (ctx.approvalsCount > 0) {
    return { line1, line2: `${ctx.approvalsCount} approval${ctx.approvalsCount === 1 ? '' : 's'} waiting.` }
  }
  if (ctx.billsDueTodayCount > 0) {
    return { line1, line2: `${ctx.billsDueTodayCount} bill${ctx.billsDueTodayCount === 1 ? '' : 's'} due today.` }
  }
  if (ctx.nextTrip && ctx.nextTrip.daysUntil > 3 && ctx.nextTrip.daysUntil <= 14) {
    return { line1, line2: `${ctx.nextTrip.city} in ${ctx.nextTrip.daysUntil} days.` }
  }
  if (ctx.recentBriefTitle) {
    return { line1, line2: `Today's brief is ready.` }
  }
  return { line1, line2: 'All clear today.' }
}

// ── Live context strip (pill-style status items) ──
export interface ContextItem {
  label: string
  tone: 'normal' | 'warn' | 'alert' | 'good'
}

export function buildContextStrip(ctx: JarvisContext): ContextItem[] {
  const items: ContextItem[] = []
  if (ctx.billsOverdueCount > 0) {
    items.push({ label: `${ctx.billsOverdueCount} overdue`, tone: 'alert' })
  }
  if (ctx.approvalsCount > 0) {
    items.push({ label: `${ctx.approvalsCount} approval${ctx.approvalsCount === 1 ? '' : 's'}`, tone: ctx.approvalsCount >= 3 ? 'warn' : 'normal' })
  }
  if (ctx.nextTrip && ctx.nextTrip.daysUntil >= 0 && ctx.nextTrip.daysUntil <= 14) {
    const d = ctx.nextTrip.daysUntil
    const suffix = d === 0 ? 'today' : d === 1 ? '1d' : `${d}d`
    items.push({ label: `${ctx.nextTrip.city} ${suffix}`, tone: d <= 2 ? 'warn' : 'normal' })
  }
  if (ctx.tasksDueCount > 0) {
    items.push({ label: `${ctx.tasksDueCount} task${ctx.tasksDueCount === 1 ? '' : 's'} open`, tone: 'normal' })
  }
  if (items.length === 0) {
    items.push({ label: 'All clear', tone: 'good' })
  }
  return items
}

// ── Proactive opening message ──
// Shown as the first assistant message when chat opens. Brief, knowing,
// uses first name. Falls back to a calm catch-all when nothing's pressing.
export function buildOpeningMessage(ctx: JarvisContext): string {
  const greet = greetingWord(ctx.hour)
  const fragments: string[] = []

  if (ctx.topApproval) {
    fragments.push(`${ctx.topApproval.vendor} ($${ctx.topApproval.amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}) is waiting on your sign-off`)
  } else if (ctx.approvalsCount > 0) {
    fragments.push(`${ctx.approvalsCount} approval${ctx.approvalsCount === 1 ? '' : 's'} ${ctx.approvalsCount === 1 ? 'is' : 'are'} waiting`)
  }

  if (ctx.nextTrip && ctx.nextTrip.daysUntil >= 0 && ctx.nextTrip.daysUntil <= 7) {
    const d = ctx.nextTrip.daysUntil
    const when = d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`
    fragments.push(`${ctx.nextTrip.city} is ${when}`)
  }

  if (ctx.billsOverdueCount > 0) {
    fragments.push(`${ctx.billsOverdueCount} bill${ctx.billsOverdueCount === 1 ? '' : 's'} overdue`)
  }

  if (fragments.length === 0) {
    return `${greet}, ${ctx.firstName}. Nothing urgent today. What's on your mind?`
  }

  // Join: "A, B and C"
  let joined: string
  if (fragments.length === 1) joined = fragments[0]
  else if (fragments.length === 2) joined = `${fragments[0]} and ${fragments[1]}`
  else joined = `${fragments.slice(0, -1).join(', ')}, and ${fragments[fragments.length - 1]}`

  // Capitalize first letter
  joined = joined.charAt(0).toUpperCase() + joined.slice(1)

  const closer = ctx.approvalsCount > 0 || ctx.billsOverdueCount > 0
    ? "What's first?"
    : 'What do you want to focus on?'

  return `${greet}, ${ctx.firstName}. ${joined}. ${closer}`
}

// ── Dynamic suggestion chips ──
// Up to 4 short prompts. One always-on, the rest derived from real state.
export function buildDynamicSuggestions(ctx: JarvisContext): string[] {
  const out: string[] = []

  if (ctx.topApproval) {
    out.push(`Why does ${ctx.topApproval.vendor} need approval?`)
  } else if (ctx.approvalsCount > 0) {
    out.push("What's pending my approval?")
  }

  if (ctx.nextTrip && ctx.nextTrip.daysUntil >= 0 && ctx.nextTrip.daysUntil <= 14) {
    out.push(`Brief me on the ${ctx.nextTrip.city} trip`)
  }

  if (ctx.billsOverdueCount > 0) {
    out.push("Show me what's overdue")
  } else if (ctx.billsDueTodayCount > 0) {
    out.push("What bills come due today?")
  }

  // Always-on closing prompt
  out.push('Brief me on today')

  return out.slice(0, 4)
}

// Principal-flavored variants. Same data but framed for someone consuming,
// not configuring.
export function buildPrincipalSuggestions(ctx: JarvisContext): string[] {
  const out: string[] = []
  if (ctx.approvalsCount > 0) out.push('What needs my approval?')
  if (ctx.nextTrip && ctx.nextTrip.daysUntil >= 0 && ctx.nextTrip.daysUntil <= 14) {
    out.push(`When do we leave for ${ctx.nextTrip.city}?`)
  }
  if (ctx.recentBriefTitle) out.push("Read me today's brief")
  out.push('Anything urgent?')
  return out.slice(0, 4)
}
