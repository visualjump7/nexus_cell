import { NextResponse } from "next/server";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { BriefPDF } from "@/components/brief/BriefPDF";
import type {
  Brief,
  BriefBlock,
  CashFlowBlockData,
  BillBlockData,
  ProjectsBlockData,
  DecisionsBlockData,
} from "@/lib/brief-service";

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role, organization_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .single();

  const role = membership?.role;
  if (!role || !["ea", "admin", "principal", "cfo"].includes(role)) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  const { briefId } = (await request.json()) as { briefId?: string };
  if (!briefId) {
    return NextResponse.json({ error: "Missing briefId" }, { status: 400 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const db = serviceKey
    ? createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey
      )
    : supabase;

  const { data: briefData, error: briefError } = await db
    .from("briefs")
    .select("*, brief_blocks(*)")
    .eq("id", briefId)
    .single();

  if (briefError || !briefData) {
    return NextResponse.json({ error: "Brief not found" }, { status: 404 });
  }

  const blocks = (briefData.brief_blocks || []).sort(
    (a: BriefBlock, b: BriefBlock) => a.position - b.position
  );
  const brief: Brief = { ...briefData, blocks, brief_blocks: undefined };

  // Principal name: first principal in this org.
  const { data: principalMembership } = await db
    .from("organization_members")
    .select("profiles:user_id(full_name)")
    .eq("organization_id", brief.organization_id)
    .eq("role", "principal")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  const profile = principalMembership?.profiles as
    | { full_name?: string }
    | { full_name?: string }[]
    | null;
  const principalName = Array.isArray(profile)
    ? profile[0]?.full_name
    : profile?.full_name;

  const orgId = brief.organization_id;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = new Date(year, month, 0).toISOString().split("T")[0];
  const monthName = now.toLocaleString("default", { month: "long" });
  const today = now.toISOString().split("T")[0];

  // Cash flow — Nexus uses bills.amount (decimal), not amount_cents.
  const { data: monthBills } = await db
    .from("bills")
    .select("amount, status")
    .eq("organization_id", orgId)
    .gte("due_date", monthStart)
    .lte("due_date", monthEnd);

  const allMonthBills = monthBills || [];
  const paid = allMonthBills.filter((b) => b.status === "paid");
  const pending = allMonthBills.filter((b) => b.status === "pending");
  const cashOut = paid.reduce((s, b) => s + Number(b.amount || 0), 0);
  const pendingTotal = pending.reduce(
    (s, b) => s + Number(b.amount || 0),
    0
  );

  const cashflow: CashFlowBlockData = {
    month: monthName,
    year,
    cashIn: 0,
    cashOut,
    net: -(cashOut + pendingTotal),
    paidCount: paid.length,
    pendingCount: pending.length,
  };

  async function fetchBillsForDays(days: number): Promise<BillBlockData> {
    const future = new Date();
    future.setDate(future.getDate() + days);
    const endDate = future.toISOString().split("T")[0];
    const { data } = await db
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
    return {
      bills,
      total: bills.reduce((s, b) => s + b.amount, 0),
      daysAhead: days,
    };
  }

  const [bills7, bills14, bills30] = await Promise.all([
    fetchBillsForDays(7),
    fetchBillsForDays(14),
    fetchBillsForDays(30),
  ]);

  // Projects — Nexus queries the `projects` table.
  const { data: projectsData } = await db
    .from("projects")
    .select("id, name, status, project_type, location")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  const projectsList = (projectsData || []).map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    project_type: p.project_type,
    location: p.location,
  }));
  const projects: ProjectsBlockData = {
    projects: projectsList,
    activeCount: projectsList.filter((p) => p.status === "active").length,
    status: null,
  };

  // Decisions — Nexus maps to alerts that need approval and have no
  // approval row yet.
  const { data: alerts } = await db
    .from("alerts")
    .select("id, title, priority, expires_at, created_at")
    .eq("organization_id", orgId)
    .in("alert_type", ["approval", "action_required"])
    .in("status", ["open", "acknowledged"])
    .order("created_at", { ascending: false });

  const allAlerts = alerts || [];
  let pendingAlerts = allAlerts;
  if (allAlerts.length > 0) {
    const { data: approvals } = await db
      .from("approvals")
      .select("alert_id")
      .in(
        "alert_id",
        allAlerts.map((a) => a.id)
      );
    const decidedIds = new Set(
      (approvals || []).map((r) => r.alert_id)
    );
    pendingAlerts = allAlerts.filter((a) => !decidedIds.has(a.id));
  }

  const decisions: DecisionsBlockData = {
    decisions: pendingAlerts.map((a) => ({
      id: a.id,
      title: a.title,
      priority: a.priority,
      due_date: a.expires_at,
      created_at: a.created_at,
    })),
    count: pendingAlerts.length,
  };

  const liveData: Record<string, unknown> = {
    cashflow,
    bills_7: bills7,
    bills_14: bills14,
    bills_30: bills30,
    projects,
    decisions,
  };

  const pdfElement = React.createElement(BriefPDF, {
    brief,
    liveData,
    principalName,
  });
  const pdfBuffer = await renderToBuffer(
    pdfElement as React.ReactElement
  );

  const coverTitle = brief.cover_title || brief.title || "Daily-Brief";
  const safeTitle = coverTitle
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .replace(/\s+/g, "-");
  const filename = `${safeTitle}-${brief.brief_date}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
