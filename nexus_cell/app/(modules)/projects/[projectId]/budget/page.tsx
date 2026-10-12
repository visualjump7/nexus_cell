"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { createClient } from "@/utils/supabase/client";
import { ImportDialog } from "@/components/budget/ImportDialog";
import { sectionEyebrow } from "@/lib/sections";
import { cn } from "@/lib/utils";
import {
  RpPage,
  RpPageHeader,
  RpStatStrip,
  RpStat,
  RpGroup,
  RpGroupHead,
  RpTable,
  RpTag,
  RpSubhead,
  RpEmpty,
  RpLoading,
  RpButton,
  RpChartFrame,
  RpBarList,
  RP_CHART,
  Upload,
  RP_ICON,
  dot,
  fmtDate,
  fmtMoney,
  fmtPct,
  fmtTime,
  pad2,
} from "@/components/rp";
import type { Budget, Project } from "@/lib/types";

interface BudgetVersion {
  id: string;
  source: string;
  filename: string | null;
  sheet_name: string | null;
  period: string | null;
  imported_at: string;
  summary: {
    lineItemCount?: number;
    totalAnnualBudget?: number;
    categories?: string[];
  };
}

type LineMeta = {
  source?: string;
  line_name?: string;
  is_fixed?: boolean;
  monthly?: Record<string, number>;
};

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

export default function ProjectBudgetPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [versions, setVersions] = useState<BudgetVersion[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: membership } = await supabase
      .from("organization_members")
      .select("role, organization_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .single();
    if (!membership) {
      setIsLoading(false);
      return;
    }
    setRole(membership.role);
    setOrgId(membership.organization_id);

    const [projectRes, budgetsRes, versionsRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase
        .from("budgets")
        .select("*")
        .eq("project_id", projectId)
        .order("category", { ascending: true })
        .order("notes", { ascending: true }),
      supabase
        .from("budget_versions")
        .select("*")
        .eq("project_id", projectId)
        .order("imported_at", { ascending: false })
        .limit(10),
    ]);

    if (projectRes.data) setProject(projectRes.data as Project);
    if (budgetsRes.data) setBudgets(budgetsRes.data as Budget[]);
    if (versionsRes.data) setVersions(versionsRes.data as BudgetVersion[]);
    setIsLoading(false);
  }, [projectId, router]);

  useEffect(() => {
    load();
  }, [load]);

  const isStaff = role === "ea" || role === "admin";
  const canReadImports =
    role === "ea" || role === "admin" || role === "cfo";

  // Group budgets by category for display.
  const grouped = budgets.reduce<Record<string, Budget[]>>((acc, b) => {
    const key = b.category || "Uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});
  const totalBudgeted = budgets.reduce(
    (s, b) => s + Number(b.budgeted || 0),
    0
  );
  const totalActual = budgets.reduce(
    (s, b) => s + Number(b.actual || 0),
    0
  );
  const variance = totalBudgeted - totalActual;
  const spentRatio = totalBudgeted > 0 ? totalActual / totalBudgeted : NaN;
  const categoryCount = Object.keys(grouped).length;

  // Planned spend by month, summed from the Excel monthly breakdown when present.
  const monthly = useMemo(() => {
    const totals = MONTHS.map(() => 0);
    let any = false;
    for (const b of budgets) {
      const m = ((b.metadata || {}) as LineMeta).monthly;
      if (!m) continue;
      MONTHS.forEach((key, i) => {
        const v = Number(m[key]);
        if (Number.isFinite(v)) {
          totals[i] += v;
          if (v) any = true;
        }
      });
    }
    return any
      ? MONTHS.map((key, i) => ({ m: key.charAt(0).toUpperCase() + key.slice(1), v: Math.round(totals[i]) }))
      : null;
  }, [budgets]);
  const period = budgets.find((b) => b.period)?.period;

  const byCategory = Object.entries(grouped)
    .map(([category, rows]) => ({
      label: category,
      value: rows.reduce((s, b) => s + Number(b.budgeted || 0), 0),
    }))
    .sort((a, b) => b.value - a.value);
  // Top five, then the rest folded into one row so shares still add up to the whole package.
  const TOP = 5;
  const categoryBars =
    byCategory.length > TOP + 1
      ? [
          ...byCategory.slice(0, TOP).map((c) => ({ ...c, href: `#cat-${slug(c.label)}` })),
          {
            label: `${byCategory.length - TOP} other categories`,
            value: byCategory.slice(TOP).reduce((s, c) => s + c.value, 0),
            tone: "neutral" as const,
          },
        ]
      : byCategory.map((c) => ({ ...c, href: `#cat-${slug(c.label)}` }));

  if (isLoading) {
    return (
      <RpPage>
        <RpPageHeader
          eyebrow={sectionEyebrow("projects", "Budget")}
          title="Budget"
          line="Loading the package budget."
          pines={false}
        />
        <RpLoading rows={6} label="Loading budget" />
      </RpPage>
    );
  }

  if (!project || !orgId) {
    return (
      <RpPage>
        <RpPageHeader
          back={{ href: "/projects", label: "Projects" }}
          eyebrow={sectionEyebrow("projects", "Budget")}
          title="Budget unavailable"
          pines={false}
        />
        <RpEmpty
          title="Nothing to show."
          line="Project not found or access denied."
          action={<RpButton variant="ghost" href="/projects">All projects</RpButton>}
        />
      </RpPage>
    );
  }

  const importButton = isStaff && (
    <RpButton
      variant="ghost"
      icon={<Upload {...RP_ICON} />}
      onClick={() => setImportOpen(true)}
    >
      Import Excel
    </RpButton>
  );

  return (
    <RpPage>
      <RpPageHeader
        back={{ href: `/projects/${projectId}`, label: shortLabel(project.name) }}
        eyebrow={sectionEyebrow("projects", "Budget")}
        title={project.name}
        line={
          budgets.length
            ? dot(
                `${budgets.length} line${budgets.length === 1 ? "" : "s"}`,
                `${categoryCount} categor${categoryCount === 1 ? "y" : "ies"}`,
                `${fmtMoney(totalBudgeted)} budgeted`
              )
            : "Budget by category. Monthly breakdown kept when imported from Excel."
        }
        spec={dot(project.project_type, project.location)}
        actions={importButton}
      />

      {budgets.length === 0 ? (
        <RpEmpty
          title="No budget yet."
          line="Import the Excel budget or add lines on the project page."
          action={
            <>
              {importButton}
              <RpButton variant="text" arrow href={`/projects/${projectId}`}>
                Open the project
              </RpButton>
            </>
          }
        />
      ) : (
        <>
          <RpStatStrip cols={4}>
            <RpStat
              label="Budgeted"
              value={fmtMoney(totalBudgeted, { compact: true })}
              sub={fmtMoney(totalBudgeted)}
            />
            <RpStat
              label="Actual"
              value={fmtMoney(totalActual, { compact: true })}
              sub={`${fmtPct(spentRatio)} of budget`}
              meter={{ value: Number.isFinite(spentRatio) ? spentRatio : 0 }}
            />
            <RpStat
              label="Variance"
              value={fmtMoney(variance, { compact: true, sign: true })}
              tone={variance > 0 ? "green" : variance < 0 ? "alert" : "default"}
              sub={variance > 0 ? "Under budget" : variance < 0 ? "Over budget" : "On budget"}
            />
            <RpStat
              label="Lines"
              value={budgets.length}
              sub={`${categoryCount} categor${categoryCount === 1 ? "y" : "ies"}`}
            />
          </RpStatStrip>

          {/* Restrained charts: planned spend by month (Excel monthly breakdown) and the category split. */}
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: monthly
                ? "repeat(auto-fit, minmax(min(100%, 420px), 1fr))"
                : "minmax(0, 1fr)",
            }}
          >
            {monthly && (
              <RpChartFrame
                eyebrow="Planned spend by month"
                value={fmtMoney(
                  monthly.reduce((s, r) => s + r.v, 0),
                  { compact: true }
                )}
                sub={dot(period && `Period ${period}`, "from the imported monthly columns")}
                height={260}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                    <CartesianGrid vertical={false} stroke={RP_CHART.grid} />
                    <XAxis
                      dataKey="m"
                      tick={RP_CHART.tick}
                      axisLine={{ stroke: RP_CHART.axis }}
                      tickLine={false}
                      interval={0}
                      tickFormatter={(m: string) => m.toUpperCase()}
                    />
                    <YAxis
                      tick={RP_CHART.tick}
                      tickFormatter={(n: number) => fmtMoney(n, { compact: true })}
                      axisLine={false}
                      tickLine={false}
                      width={52}
                    />
                    <Tooltip
                      {...RP_CHART.tooltip}
                      formatter={(v) => [fmtMoney(Number(v)), "Planned"]}
                    />
                    <Bar
                      dataKey="v"
                      name="Planned"
                      fill={RP_CHART.colors[0]}
                      radius={RP_CHART.bar.radius}
                      maxBarSize={RP_CHART.bar.maxBarSize}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </RpChartFrame>
            )}
            <RpChartFrame
              eyebrow="Where the budget goes"
              value={`${categoryCount} categor${categoryCount === 1 ? "y" : "ies"}`}
              sub="Budgeted by category · share of the package"
              height={0}
            >
              <RpBarList
                items={categoryBars}
                format={(n) => fmtMoney(n, { compact: true })}
              />
            </RpChartFrame>
          </div>

          {/* Per category: group head with Σ, then the lines. */}
          <section className="flex flex-col">
            {Object.entries(grouped).map(([category, rows], gi) => {
              const catTotal = rows.reduce(
                (s, b) => s + Number(b.budgeted || 0),
                0
              );
              const catActual = rows.reduce(
                (s, b) => s + Number(b.actual || 0),
                0
              );
              return (
                <RpGroup key={category} id={`cat-${slug(category)}`} className="pb-8 last:pb-0">
                  <RpGroupHead
                    num={gi + 1}
                    title={category}
                    line={dot(
                      `${rows.length} line${rows.length === 1 ? "" : "s"}`,
                      catTotal > 0 && `${fmtPct(catActual / catTotal)} spent`
                    )}
                    aside={
                      <span className="font-display text-base font-medium tracking-[.02em] tabular-nums text-rp-text">
                        {fmtMoney(catTotal)}
                      </span>
                    }
                  />
                  <RpTable dense minWidth={600} className="[&_table]:table-fixed">
                    <colgroup>
                      <col style={{ width: 48 }} />
                      <col />
                      <col style={{ width: 96 }} />
                      <col style={{ width: 148 }} />
                      <col style={{ width: 148 }} />
                    </colgroup>
                    {/* Columns align across categories, so only the first table shows its header; later ones keep it for screen readers at zero height. */}
                    <thead>
                      <tr className={gi > 0 ? "[&>th]:!p-0 [&>th]:!text-[0px] [&>th]:!leading-[0]" : undefined}>
                        <th className="idx">#</th>
                        <th>Line</th>
                        <th>Source</th>
                        <th className="num">Budgeted</th>
                        <th className="num">Actual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((b, i) => {
                        const meta = (b.metadata || {}) as LineMeta;
                        const actual = Number(b.actual || 0);
                        const budgeted = Number(b.budgeted || 0);
                        return (
                          <tr key={b.id}>
                            <td className="idx">{pad2(i + 1)}</td>
                            <td className="break-words">
                              {b.notes || meta.line_name || "—"}
                              {(b.period || meta.is_fixed) && (
                                <span className="sub">
                                  {dot(b.period, meta.is_fixed && "Fixed")}
                                </span>
                              )}
                            </td>
                            <td>
                              {meta.source === "excel" ? (
                                <RpTag tone="blue">Excel</RpTag>
                              ) : (
                                <span className="text-rp-dim">—</span>
                              )}
                            </td>
                            <td className="num">{fmtMoney(budgeted)}</td>
                            <td
                              className={cn(
                                "num",
                                actual === 0
                                  ? "text-rp-dim"
                                  : actual > budgeted && budgeted > 0
                                    ? "text-rp-alert"
                                    : ""
                              )}
                            >
                              {fmtMoney(actual)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </RpTable>
                </RpGroup>
              );
            })}
          </section>
        </>
      )}

      {canReadImports && versions.length > 0 && (
        <section className="flex flex-col gap-6">
          <RpSubhead
            title="Import history"
            spec={`Last ${versions.length} import${versions.length === 1 ? "" : "s"} · newest first`}
          />
          <RpTable minWidth={620} caption="Import history">
            <thead>
              <tr>
                <th className="idx">#</th>
                <th>Source</th>
                <th>File</th>
                <th className="num">Imported</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v, i) => (
                <tr key={v.id}>
                  <td className="idx">{pad2(i + 1)}</td>
                  <td>
                    <RpTag tone={v.source === "excel" ? "blue" : "neutral"}>{v.source}</RpTag>
                  </td>
                  <td className="break-words">
                    {v.filename || "(unnamed)"}
                    <span className="sub">
                      {dot(
                        v.sheet_name,
                        v.period && `Period ${v.period}`,
                        v.summary?.lineItemCount !== undefined &&
                          `${v.summary.lineItemCount} rows`
                      ) || "—"}
                    </span>
                  </td>
                  <td className="num text-rp-muted" suppressHydrationWarning>
                    {dot(fmtDate(v.imported_at), fmtTime(v.imported_at))}
                  </td>
                </tr>
              ))}
            </tbody>
          </RpTable>
        </section>
      )}

      {orgId && (
        <ImportDialog
          open={importOpen}
          onClose={() => setImportOpen(false)}
          projectId={projectId}
          organizationId={orgId}
          onImported={() => {
            load();
          }}
        />
      )}
    </RpPage>
  );
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "x";
}

/** Back-link label: the project name, cut at a word near 30 characters so it fits a phone row. */
function shortLabel(name: string, max = 30): string {
  if (name.length <= max) return name;
  const cut = name.slice(0, max);
  const at = cut.lastIndexOf(" ");
  return `${(at > 12 ? cut.slice(0, at) : cut).replace(/[\s:·,&-]+$/, "")}…`;
}
