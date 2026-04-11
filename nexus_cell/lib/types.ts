export type UserRole = 'principal' | 'ea' | 'cfo' | 'admin' | 'viewer'

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: UserRole
  status: 'active' | 'inactive' | 'invited'
  created_at: string
}

export interface Bill {
  id: string
  organization_id: string
  created_by: string | null
  vendor: string
  description: string | null
  amount: number
  currency: string
  status: 'pending' | 'approved' | 'paid' | 'rejected' | 'overdue'
  category: string | null
  due_date: string | null
  paid_date: string | null
  paid_by: string | null
  payment_method: string | null
  receipt_url: string | null
  notes: string | null
  quickbooks_synced: boolean
  quickbooks_id: string | null
  created_at: string
  updated_at: string
}

export interface Trip {
  id: string
  organization_id: string
  created_by: string | null
  title: string
  start_date: string | null
  end_date: string | null
  status: 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface TripSegment {
  id: string
  trip_id: string
  segment_type: 'flight' | 'hotel' | 'car' | 'train' | 'ground_transport' | 'other'
  from_location: string | null
  to_location: string | null
  depart_at: string | null
  arrive_at: string | null
  check_in: string | null
  check_out: string | null
  carrier: string | null
  confirmation_code: string | null
  booking_reference: string | null
  seat_info: string | null
  notes: string | null
  sort_order: number
  created_at: string
}

export interface TravelDoc {
  id: string
  trip_id: string | null
  organization_id: string
  doc_type: 'boarding_pass' | 'reservation' | 'passport' | 'visa' | 'insurance' | 'itinerary' | 'other'
  label: string
  file_url: string | null
  expiry_date: string | null
  document_number: string | null
  notes: string | null
  created_at: string
}

export interface LoyaltyProgram {
  id: string
  organization_id: string
  program_name: string
  provider: string | null
  member_number: string | null
  tier_status: string | null
  points_balance: string | null
  notes: string | null
  created_at: string
}

export interface Alert {
  id: string
  organization_id: string
  created_by: string | null
  alert_type: 'info' | 'action_required' | 'approval' | 'urgent' | 'fyi'
  title: string
  body: string | null
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'open' | 'acknowledged' | 'resolved' | 'expired'
  target_role: UserRole | 'all' | null
  target_user_id: string | null
  related_type: string | null
  related_id: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface Approval {
  id: string
  alert_id: string
  decided_by: string
  decision: 'approved' | 'rejected'
  comment: string | null
  decided_at: string
}

export interface Task {
  id: string
  organization_id: string
  created_by: string | null
  assigned_to: string | null
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'waiting' | 'done' | 'cancelled'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  organization_id: string
  created_by: string | null
  title: string | null
  body: string
  pinned: boolean
  created_at: string
  updated_at: string
}

export interface Gift {
  id: string
  organization_id: string
  created_by: string | null
  recipient: string
  occasion: string | null
  description: string | null
  amount: number | null
  date: string | null
  status: 'idea' | 'purchased' | 'shipped' | 'delivered' | 'thanked'
  notes: string | null
  created_at: string
}

export interface Subscription {
  id: string
  organization_id: string
  name: string
  provider: string | null
  amount: number | null
  currency: string
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'annual'
  next_renewal: string | null
  category: string | null
  auto_renew: boolean
  status: 'active' | 'paused' | 'cancelled'
  login_url: string | null
  notes: string | null
  created_at: string
}

export interface Membership {
  id: string
  organization_id: string
  name: string
  organization_name: string | null
  member_id: string | null
  tier: string | null
  expiry_date: string | null
  renewal_amount: number | null
  category: string | null
  status: 'active' | 'expired' | 'cancelled'
  notes: string | null
  created_at: string
}

export interface Project {
  id: string
  organization_id: string
  created_by: string | null
  name: string
  project_type: string | null
  status: 'active' | 'on_hold' | 'completed' | 'archived'
  location: string | null
  description: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ProjectFile {
  id: string
  project_id: string
  uploaded_by: string | null
  file_url: string
  file_name: string
  file_type: string | null
  file_size: number | null
  label: string | null
  created_at: string
}

export interface Budget {
  id: string
  project_id: string
  category: string
  budgeted: number
  actual: number
  period: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// Project Directory — Block System
export type ProjectBlockType = 'gallery' | 'personnel' | 'subcontractor' | 'notes'

export interface ProjectBlock {
  id: string
  project_id: string
  organization_id: string
  type: ProjectBlockType
  title: string | null
  position: number
  config: Record<string, unknown>
  created_by: string | null
  created_at: string
  updated_at: string
  // Nested relations (populated by select joins)
  project_contacts?: ProjectContact[]
  project_images?: ProjectImage[]
}

export type ContactStatus = 'active' | 'on-leave' | 'completed' | 'terminated'

export interface ProjectContact {
  id: string
  block_id: string
  organization_id: string
  contact_type: 'personnel' | 'subcontractor'
  name: string
  email: string | null
  phone: string | null
  avatar_url: string | null
  status: ContactStatus
  notes: string | null
  position: number
  // Personnel-specific
  role: string | null
  company: string | null
  department: string | null
  // Subcontractor-specific
  company_name: string | null
  trade: string | null
  contract_value_cents: number | null
  contract_start: string | null
  contract_end: string | null
  license_number: string | null
  insurance_on_file: boolean
  insurance_expiry: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ProjectImage {
  id: string
  block_id: string
  organization_id: string
  url: string
  thumbnail_url: string | null
  caption: string | null
  taken_at: string | null
  file_name: string | null
  file_size: number | null
  width: number | null
  height: number | null
  position: number
  uploaded_by: string | null
  created_at: string
}

export interface AuditLogEntry {
  id: string
  organization_id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  metadata: Record<string, unknown>
  ip_address: string | null
  created_at: string
}
