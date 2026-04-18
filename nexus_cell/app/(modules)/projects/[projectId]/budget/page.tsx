"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Upload, FileSpreadsheet } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { ImportDialog } from "@/components/budget/ImportDialog";
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

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project || !orgId) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <p className="text-sm text-muted-foreground">
          Project not found or access denied.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => router.push(`/projects/${projectId}`)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {project.name}
        </button>
        {isStaff && (
          <Button onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import Excel
          </Button>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {project.name} · Budget
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Budget by category. Monthly breakdown preserved when imported from
          Excel with monthly columns.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Budgeted</p>
            <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">
              {formatCurrency(totalBudgeted)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Actual</p>
            <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">
              {formatCurrency(totalActual)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Variance</p>
            <p
              className={`mt-1 text-2xl font-bold tabular-nums ${
                totalActual <= totalBudgeted
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {formatCurrency(totalBudgeted - totalActual)}
            </p>
          </CardContent>
        </Card>
      </div>

      {budgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No budget data yet.
            </p>
            {isStaff && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportOpen(true)}
              >
                <Upload className="mr-2 h-3.5 w-3.5" />
                Import from Excel
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, rows]) => {
            const catTotal = rows.reduce(
              (s, b) => s + Number(b.budgeted || 0),
              0
            );
            return (
              <Card key={category}>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {category}
                    </h2>
                    <p className="text-sm font-semibold text-foreground tabular-nums">
                      {formatCurrency(catTotal)}
                    </p>
                  </div>
                  <div className="divide-y divide-border">
                    {rows.map((b) => {
                      const meta = (b.metadata || {}) as {
                        source?: string;
                        line_name?: string;
                        is_fixed?: boolean;
                        monthly?: Record<string, number>;
                      };
                      return (
                        <div
                          key={b.id}
                          className="flex items-center justify-between py-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-foreground">
                              {b.notes || meta.line_name || "—"}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                              {b.period && <span>{b.period}</span>}
                              {meta.is_fixed && <span>· Fixed</span>}
                              {meta.source === "excel" && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-blue-500/40 text-blue-400"
                                >
                                  Excel
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="ml-4 text-right">
                            <p className="text-sm font-semibold text-foreground tabular-nums">
                              {formatCurrency(Number(b.budgeted || 0))}
                            </p>
                            {Number(b.actual || 0) > 0 && (
                              <p className="text-xs text-muted-foreground tabular-nums">
                                {formatCurrency(Number(b.actual))} actual
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {canReadImports && versions.length > 0 && (
        <section className="border-t border-border pt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Import history
          </h2>
          <div className="space-y-2">
            {versions.map((v) => (
              <Card key={v.id}>
                <CardContent className="flex items-center justify-between p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">
                      {v.filename || "(unnamed)"}
                      {v.sheet_name && (
                        <span className="text-muted-foreground">
                          {" "}
                          · {v.sheet_name}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(v.imported_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {v.period && ` · period ${v.period}`}
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <Badge
                      variant="outline"
                      className="text-[10px] capitalize"
                    >
                      {v.source}
                    </Badge>
                    {v.summary.lineItemCount !== undefined && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {v.summary.lineItemCount} rows
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
    </div>
  );
}
