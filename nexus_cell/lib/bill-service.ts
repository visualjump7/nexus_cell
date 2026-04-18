import { createClient } from "@/utils/supabase/client";
import type { Bill } from "@/lib/types";

export type { Bill };

/**
 * Fetch bills due within a specific calendar month (UTC).
 * Scoped to the caller's active organization via RLS.
 */
export async function fetchBillsForMonth(
  year: number,
  month: number
): Promise<Bill[]> {
  const supabase = createClient();
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = new Date(year, month, 0).toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .gte("due_date", monthStart)
    .lte("due_date", monthEnd)
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Error fetching bills for month:", error);
    return [];
  }
  return (data || []) as Bill[];
}

/**
 * Fetch bills due within an arbitrary inclusive date range (ISO YYYY-MM-DD).
 */
export async function fetchBillsForRange(
  startDate: string,
  endDate: string
): Promise<Bill[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .gte("due_date", startDate)
    .lte("due_date", endDate)
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Error fetching bills for range:", error);
    return [];
  }
  return (data || []) as Bill[];
}

/**
 * Update the status of a bill. Returns true on success.
 *
 * When marking a bill paid, also stamps paid_date to today if not already
 * set. The caller should supply paid_by via a follow-up update if that
 * detail is needed (current RLS policies require organization membership,
 * so only EAs/admins can flip paid status anyway).
 */
export async function updateBillStatus(
  billId: string,
  status: Bill["status"]
): Promise<boolean> {
  const supabase = createClient();
  const patch: Partial<Bill> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "paid") {
    patch.paid_date = new Date().toISOString().split("T")[0];
  }

  const { error } = await supabase
    .from("bills")
    .update(patch)
    .eq("id", billId);

  if (error) {
    console.error("Error updating bill status:", error);
    return false;
  }
  return true;
}

/**
 * Unique categories used by bills in the caller's org. Empty strings
 * and null categories are filtered out. Sorted alphabetically.
 */
export async function fetchBillCategories(): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bills")
    .select("category")
    .not("category", "is", null);

  if (error) {
    console.error("Error fetching bill categories:", error);
    return [];
  }

  const set = new Set<string>();
  for (const row of data || []) {
    const c = (row.category || "").trim();
    if (c) set.add(c);
  }
  return [...set].sort();
}
