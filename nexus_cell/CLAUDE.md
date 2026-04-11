# Nexus Cell v1 — Claude Code Memory

## Project
Nexus Cell is a operations management platform for teams supporting high-net-worth individuals. It streamlines communication between EAs, CFOs, and principals — eliminating the back-and-forth that wastes everyone's time. Built by Nexus Cell LLC (Digital Moxi).

This is a 2-week demo build. Speed matters. Ship working features, not perfect code.

## Tech Stack
- Next.js 14 + TypeScript (App Router)
- Supabase (database + auth + storage + RLS)
- Tailwind CSS v3
- Anthropic API for AI search bar

## Database
Schema is already deployed in Supabase. Types are in `lib/types.ts`. Key tables:
- profiles, organizations, organization_members (auth/roles)
- bills (financial tracking, QuickBooks sync fields ready)
- trips, trip_segments, travel_docs, loyalty_programs (travel)
- alerts, alert_reads, approvals (communication + approval workflow)
- tasks, notes (task management)
- gifts, subscriptions, memberships (lifestyle)
- projects, project_files, budgets (project management)
- ai_conversations (AI chat persistence)
- audit_log (immutable, triggers prevent update/delete)

## Supabase Client Pattern
- Browser components: `import { createClient } from '@/utils/supabase/client'`
- Server components: `import { createClient } from '@/utils/supabase/server'`
- Middleware: `utils/supabase/middleware.ts` handles session refresh
- Auth redirects: middleware.ts redirects unauthenticated users to /login

## Three User Roles — Three Different Experiences

### Principal (the boss)
- Sees: clean dashboard, pending approvals (tap yes/no), upcoming travel, AI search bar
- Minimal UI, maximum information density
- This person taps, approves, asks questions, leaves
- The AI search bar is their primary interface

### EA (executive assistant — the power user)
- Sees: everything — bill entry, trip builder, alert composer, tasks, gifts, subscriptions, memberships, projects
- This is the workhorse view with full CRUD on all features
- Can create alerts that go to the principal for approval

### CFO (financial visibility)
- Sees: financial dashboard — bills pending, bills paid, budget vs actual, spending by category
- Read-heavy view, limited write access
- Eventually gets QuickBooks sync status

## Role-Based Routing
After login, detect the user's role from organization_members and route accordingly:
- Principal: `/dashboard` (approval-focused view)
- EA: `/dashboard` (full operations view)
- CFO: `/dashboard` (financial view)
Same route, different components rendered based on role. Use a shared layout with role-aware navigation.

## Getting the Current User's Role
```typescript
// Server component pattern
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
const { data: membership } = await supabase
  .from('organization_members')
  .select('*, organizations(*)')
  .eq('user_id', user.id)
  .eq('status', 'active')
  .single()
const role = membership?.role
const orgId = membership?.organization_id
```

## Key Features to Build (in priority order)

### 1. Auth + Dashboard Shell
- Login page (email/password)
- Role detection after login
- Sidebar navigation (role-aware — principal sees less)
- Dashboard with summary cards per role

### 2. Bills & Financial Tracking
- EA: create/edit bills with vendor, amount, due date, category
- EA: CSV upload for bulk bill entry
- EA: mark bills as paid
- CFO: view all bills, filter by status/date/category
- Principal: approve/reject bills via alerts
- Status flow: pending → approved → paid (or rejected)

### 3. Alerts & Approval Workflow
- EA creates alerts (info, action_required, approval, urgent, fyi)
- Alerts target a role or specific user
- Principal sees approval alerts as cards with approve/reject buttons
- One tap to approve, optional comment
- Approval creates a record in the approvals table
- Alert status updates to resolved after decision

### 4. Travel Itineraries
- EA builds trips with segments (flights, hotels, cars, etc.)
- Clean timeline view showing the full itinerary
- Attach travel docs (boarding passes, reservations, etc.)
- Principal sees upcoming travel on dashboard
- Loyalty program tracking (separate from trips)

### 5. Tasks
- EA creates and assigns tasks
- Status: todo → in_progress → waiting → done
- Due dates, priority levels
- Assigned user sees their tasks on dashboard

### 6. Gifts, Subscriptions, Memberships
- Simple CRUD lists for each
- Subscriptions show next renewal date and amount
- Memberships show expiry
- Gifts track status from idea → delivered

### 7. Projects
- Fusion Cell style project pages
- File uploads to Supabase Storage
- Budget tracking per project (budgeted vs actual)

### 8. AI Search Bar (the wow feature)
- Accessible from any page (⌘K or always-visible bar for principal)
- Queries all platform data via API route
- Natural language: "what's pending my approval", "when's my next flight", "how much did we spend on gifts this year"
- Uses Anthropic API with platform data as context
- Route: app/api/ai/chat/route.ts

## Design Principles
- Dark theme default, clean and premium
- Minimal UI for principal, full UI for EA
- No clutter — every element earns its space
- Cards for data display, modals for quick actions, full pages for detail views
- Mobile responsive — the principal will use this on their phone

## Navigation Structure
```
/ (dashboard — role-aware)
/bills
/travel
/travel/[tripId]
/alerts
/tasks
/gifts
/subscriptions
/memberships
/projects
/projects/[projectId]
/settings
/login
```

## Code Patterns
- Read existing files before modifying
- Use server components by default, client components only when needed (forms, interactivity)
- Supabase queries in server components, mutations via server actions or API routes
- Always scope queries by organization_id
- Always check user role before showing UI elements
- Use the audit_log table for important actions (bill paid, approval made, etc.)

## What NOT to Build
- No module system or configurator
- No QuickBooks API integration (just the data fields)
- No white-label system
- No marketing site
- No mobile app (responsive web only)
- No complex permissions beyond the 3 roles
- No real-time subscriptions (polling is fine for demo)

## Demo Data
Seed realistic data that mirrors a real HNW lifestyle:
- Bills: property management, aviation fuel, club dues, staff payroll
- Travel: private aviation routes (Teterboro → Miami, Aspen → LA)
- Gifts: client appreciation, birthday presents, holiday gifts
- Subscriptions: wine clubs, streaming, security monitoring
- Memberships: country clubs, airline programs, museum memberships
- Projects: property renovation, yacht maintenance, event planning
