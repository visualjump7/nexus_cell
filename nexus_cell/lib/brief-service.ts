import { createClient } from "@/utils/supabase/client";

// ============================================
// Types
// ============================================

export interface Brief {
  id: string;
  organization_id: string;
  title: string;
  brief_date: string;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  published_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  blocks?: BriefBlock[];
  cover_title?: string | null;
  cover_subtitle?: string | null;
  cover_logo_url?: string | null;
  cover_show_date?: boolean;
  cover_show_principal?: boolean;
  cover_accent_color?: string | null;
}

export interface BriefBlock {
  id: string;
  brief_id: string;
  type: "text" | "cashflow" | "bills" | "projects" | "decisions" | "document";
  position: number;
  content_html: string | null;
  config: Record<string, unknown>;
  commentary: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CashFlowBlockData {
  month: string;
  year: number;
  cashIn: number;
  cashOut: number;
  net: number;
  paidCount: number;
  pendingCount: number;
}

export interface BillBlockData {
  bills: {
    id: string;
    vendor: string;
    description: string | null;
    amount: number;
    due_date: string;
    category: string | null;
    status: string;
  }[];
  total: number;
  daysAhead: number;
}

export interface ProjectsBlockData {
  projects: {
    id: string;
    name: string;
    status: string;
    project_type: string | null;
    location: string | null;
  }[];
  activeCount: number;
  status: string | null;
}

export interface DecisionsBlockData {
  decisions: {
    id: string;
    title: string;
    priority: string;
    due_date: string | null;
    created_at: string;
  }[];
  count: number;
}

// ============================================
// Brief CRUD
// ============================================

export async function fetchBriefs(
  orgId: string,
  status?: string
): Promise<Brief[]> {
  const supabase = createClient();
  let query = supabase
    .from("briefs")
    .select("*, brief_blocks(id)")
    .eq("organization_id", orgId)
    .order("brief_date", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching briefs:", error);
    return [];
  }

  return (data || []).map((b) => ({
    ...b,
    blocks: undefined,
    _blockCount: b.brief_blocks?.length || 0,
  })) as Brief[];
}

export async function fetchBrief(briefId: string): Promise<Brief | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("briefs")
    .select("*, brief_blocks(*)")
    .eq("id", briefId)
    .single();

  if (error) {
    console.error("Error fetching brief:", error);
    return null;
  }
  if (!data) return null;

  const blocks = (data.brief_blocks || []).sort(
    (a: BriefBlock, b: BriefBlock) => a.position - b.position
  );
  return { ...data, blocks, brief_blocks: undefined } as Brief;
}

export async function fetchLatestPublishedBrief(
  orgId: string
): Promise<Brief | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("briefs")
    .select("*, brief_blocks(*)")
    .eq("organization_id", orgId)
    .eq("status", "published")
    .order("brief_date", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("Error fetching latest brief:", error);
    return null;
  }
  if (!data) return null;

  const blocks = (data.brief_blocks || []).sort(
    (a: BriefBlock, b: BriefBlock) => a.position - b.position
  );
  return { ...data, blocks, brief_blocks: undefined } as Brief;
}

export async function createBrief(
  orgId: string,
  title: string,
  briefDate: string
): Promise<Brief | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("briefs")
    .insert({
      organization_id: orgId,
      title,
      brief_date: briefDate,
      status: "draft",
      created_by: user?.id || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating brief:", error);
    return null;
  }
  return data as Brief;
}

export async function updateBrief(
  briefId: string,
  updates: Partial<
    Pick<
      Brief,
      | "title"
      | "brief_date"
      | "status"
      | "cover_title"
      | "cover_subtitle"
      | "cover_logo_url"
      | "cover_show_date"
      | "cover_show_principal"
      | "cover_accent_color"
    >
  >
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("briefs")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", briefId);

  if (error) {
    console.error("Error updating brief:", error);
    return false;
  }
  return true;
}

export async function publishBrief(
  briefId: string,
  userId: string
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("briefs")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      published_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", briefId);

  if (error) {
    console.error("Error publishing brief:", error);
    return false;
  }
  return true;
}

export async function unpublishBrief(briefId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("briefs")
    .update({
      status: "draft",
      published_at: null,
      published_by: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", briefId);

  if (error) {
    console.error("Error unpublishing brief:", error);
    return false;
  }
  return true;
}

export async function deleteBrief(briefId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("briefs").delete().eq("id", briefId);

  if (error) {
    console.error("Error deleting brief:", error);
    return false;
  }
  return true;
}

// ============================================
// Block Operations
// ============================================

export async function addBlock(
  briefId: string,
  type: BriefBlock["type"],
  position: number,
  config?: Record<string, unknown>
): Promise<BriefBlock | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("brief_blocks")
    .insert({
      brief_id: briefId,
      type,
      position,
      config: config || {},
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding block:", error);
    return null;
  }
  return data as BriefBlock;
}

export async function updateBlock(
  blockId: string,
  updates: Partial<Pick<BriefBlock, "content_html" | "config" | "commentary">>
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("brief_blocks")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", blockId);

  if (error) {
    console.error("Error updating block:", error);
    return false;
  }
  return true;
}

export async function deleteBlock(blockId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("brief_blocks")
    .delete()
    .eq("id", blockId);

  if (error) {
    console.error("Error deleting block:", error);
    return false;
  }
  return true;
}

export async function reorderBlocks(
  briefId: string,
  blockIds: string[]
): Promise<boolean> {
  const supabase = createClient();
  const updates = blockIds.map((id, index) =>
    supabase
      .from("brief_blocks")
      .update({ position: index, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("brief_id", briefId)
  );

  const results = await Promise.all(updates);
  const hasError = results.some((r) => r.error);

  if (hasError) {
    console.error("Error reordering blocks");
    return false;
  }
  return true;
}

// ============================================
// Live Data Fetchers (Nexus-adapted)
// ============================================
// Nexus bills: `amount` (decimal, dollars), `vendor`, `description`, `category`.
// Nexus has no `assets` table — projects replace that slot.
// Nexus has no `messages`/`message_responses` — alerts + approvals replace that.

export async function fetchCashFlowData(
  orgId: string
): Promise<CashFlowBlockData> {
  const supabase = createClient();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = new Date(year, month, 0).toISOString().split("T")[0];
  const monthName = now.toLocaleString("default", { month: "long" });

  const { data: bills } = await supabase
    .from("bills")
    .select("amount, status")
    .eq("organization_id", orgId)
    .gte("due_date", monthStart)
    .lte("due_date", monthEnd);

  const allBills = bills || [];
  const paid = allBills.filter((b) => b.status === "paid");
  const pending = allBills.filter((b) => b.status === "pending");

  const cashOut = paid.reduce((s, b) => s + Number(b.amount || 0), 0);
  const pendingTotal = pending.reduce(
    (s, b) => s + Number(b.amount || 0),
    0
  );

  return {
    month: monthName,
    year,
    cashIn: 0,
    cashOut,
    net: -(cashOut + pendingTotal),
    paidCount: paid.length,
    pendingCount: pending.length,
  };
}

export async function fetchUpcomingBillsData(
  orgId: string,
  daysAhead: number
): Promise<BillBlockData> {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];
  const future = new Date();
  future.setDate(future.getDate() + daysAhead);
  const endDate = future.toISOString().split("T")[0];

  const { data } = await supabase
    .from("bills")
    .select("id, vendor, description, amount, due_date, category, status")
    .eq("organization_id", orgId)
    .eq("status", "pending")
    .gte("due_date", today)
    .lte("due_date", endDate)
    .order("due_date", { ascending: true });

  const bills = (data || []).map((b) => ({
    id: b.id,
    vendor: b.vendor,
    description: b.description,
    amount: Number(b.amount || 0),
    due_date: b.due_date,
    category: b.category,
    status: b.status,
  }));

  const total = bills.reduce((s, b) => s + b.amount, 0);
  return { bills, total, daysAhead };
}

export async function fetchProjectsSnapshot(
  orgId: string,
  status?: string
): Promise<ProjectsBlockData> {
  const supabase = createClient();
  let query = supabase
    .from("projects")
    .select("id, name, status, project_type, location")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data } = await query;
  const projects = (data || []).map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    project_type: p.project_type,
    location: p.location,
  }));

  const activeCount = projects.filter((p) => p.status === "active").length;
  return { projects, activeCount, status: status || null };
}

export async function fetchPendingDecisions(
  orgId: string
): Promise<DecisionsBlockData> {
  const supabase = createClient();

  // Nexus "decisions" = alerts that need an approve/reject decision
  // (alert_type in approval/action_required) and are still open/acknowledged.
  const { data: alerts } = await supabase
    .from("alerts")
    .select("id, title, priority, expires_at, created_at, alert_type, status")
    .eq("organization_id", orgId)
    .in("alert_type", ["approval", "action_required"])
    .in("status", ["open", "acknowledged"])
    .order("created_at", { ascending: false });

  const allAlerts = alerts || [];

  // Filter out alerts that already have an approval row.
  const alertIds = allAlerts.map((a) => a.id);
  let pending = allAlerts;

  if (alertIds.length > 0) {
    const { data: approvals } = await supabase
      .from("approvals")
      .select("alert_id")
      .in("alert_id", alertIds);

    const decidedIds = new Set((approvals || []).map((r) => r.alert_id));
    pending = allAlerts.filter((a) => !decidedIds.has(a.id));
  }

  return {
    decisions: pending.map((a) => ({
      id: a.id,
      title: a.title,
      priority: a.priority,
      due_date: a.expires_at,
      created_at: a.created_at,
    })),
    count: pending.length,
  };
}
