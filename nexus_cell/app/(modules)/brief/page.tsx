"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  Loader2,
  FileText,
  MoreVertical,
  Send,
  ArchiveRestore,
  Trash2,
  Calendar,
  Download,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BriefReaderView } from "@/components/brief/BriefReaderView";
import {
  fetchBriefs,
  fetchLatestPublishedBrief,
  createBrief,
  publishBrief,
  unpublishBrief,
  deleteBrief,
  fetchCashFlowData,
  fetchUpcomingBillsData,
  fetchProjectsSnapshot,
  fetchPendingDecisions,
  type Brief,
} from "@/lib/brief-service";

type FilterTab = "all" | "draft" | "published" | "archived";

const statusColors: Record<string, string> = {
  draft: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
  published: "bg-emerald-600/20 text-emerald-400 border-emerald-600/30",
  archived: "bg-zinc-600/20 text-zinc-400 border-zinc-600/30",
};

export default function BriefPage() {
  const router = useRouter();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [briefs, setBriefs] = useState<(Brief & { _blockCount?: number })[]>([]);
  const [latestBrief, setLatestBrief] = useState<Brief | null>(null);
  const [liveData, setLiveData] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    async function bootstrap() {
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
      setUserId(user.id);
      setRole(membership?.role || null);
      setOrgId(membership?.organization_id || null);
    }
    bootstrap();
  }, [router]);

  const isStaff = role === "ea" || role === "admin";

  const loadStaffList = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    const data = await fetchBriefs(
      orgId,
      filter === "all" ? undefined : filter
    );
    setBriefs(data as (Brief & { _blockCount?: number })[]);
    setIsLoading(false);
  }, [orgId, filter]);

  const loadReaderView = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    const [latest, published] = await Promise.all([
      fetchLatestPublishedBrief(orgId),
      fetchBriefs(orgId, "published"),
    ]);
    setLatestBrief(latest);
    setBriefs(latest ? published.filter((b) => b.id !== latest.id) : published);

    if (latest) {
      const [cashflow, bills7, bills14, bills30, projects, decisions] =
        await Promise.all([
          fetchCashFlowData(orgId),
          fetchUpcomingBillsData(orgId, 7),
          fetchUpcomingBillsData(orgId, 14),
          fetchUpcomingBillsData(orgId, 30),
          fetchProjectsSnapshot(orgId),
          fetchPendingDecisions(orgId),
        ]);
      setLiveData({
        cashflow,
        bills_7: bills7,
        bills_14: bills14,
        bills_30: bills30,
        projects,
        decisions,
      });
    }
    setIsLoading(false);
  }, [orgId]);

  useEffect(() => {
    if (!orgId || !role) return;
    if (isStaff) {
      loadStaffList();
    } else {
      loadReaderView();
    }
  }, [orgId, role, isStaff, loadStaffList, loadReaderView]);

  const handleNewBrief = async () => {
    if (!orgId) return;
    setCreating(true);
    const today = new Date().toISOString().split("T")[0];
    const brief = await createBrief(orgId, "Daily Brief", today);
    if (brief) {
      router.push(`/brief/${brief.id}`);
    } else {
      alert(
        "Failed to create brief. Make sure sql/006_briefs.sql has been applied to Supabase."
      );
    }
    setCreating(false);
  };

  const handlePublish = async (briefId: string) => {
    if (!userId) return;
    await publishBrief(briefId, userId);
    setMenuOpen(null);
    loadStaffList();
  };

  const handleUnpublish = async (briefId: string) => {
    await unpublishBrief(briefId);
    setMenuOpen(null);
    loadStaffList();
  };

  const handleDelete = async (briefId: string) => {
    await deleteBrief(briefId);
    setMenuOpen(null);
    loadStaffList();
  };

  const handleDownloadPDF = async (briefId: string) => {
    setDownloading(briefId);
    setMenuOpen(null);
    try {
      const res = await fetch("/api/brief/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefId }),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const disposition = res.headers.get("Content-Disposition");
      const filename =
        disposition?.match(/filename="(.+)"/)?.[1] || "brief.pdf";
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
    setDownloading(null);
  };

  const filterTabs: { label: string; value: FilterTab }[] = [
    { label: "All", value: "all" },
    { label: "Drafts", value: "draft" },
    { label: "Published", value: "published" },
    { label: "Archived", value: "archived" },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isStaff) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Daily Briefs</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Compose and publish briefs for your principal
            </p>
          </div>
          <Button onClick={handleNewBrief} disabled={creating}>
            {creating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            New Brief
          </Button>
        </div>

        <div className="flex gap-1 rounded-lg border border-border bg-card/50 p-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === tab.value
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {briefs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-sm text-muted-foreground">
                {filter === "all"
                  ? "No briefs yet. Create your first brief to get started."
                  : `No ${filter} briefs found.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {briefs.map((brief) => (
              <Card
                key={brief.id}
                className="group cursor-pointer transition-colors hover:bg-muted/20"
                onClick={() => router.push(`/brief/${brief.id}`)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {brief.title}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(
                            brief.brief_date + "T00:00:00"
                          ).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span>{brief._blockCount || 0} blocks</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={statusColors[brief.status] || ""}
                    >
                      {brief.status}
                    </Badge>

                    <div
                      className="relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() =>
                          setMenuOpen(menuOpen === brief.id ? null : brief.id)
                        }
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {menuOpen === brief.id && (
                        <div className="absolute right-0 top-full z-10 mt-1 min-w-[160px] rounded-lg border border-border bg-card py-1 shadow-lg">
                          {brief.status === "draft" && (
                            <button
                              onClick={() => handlePublish(brief.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
                            >
                              <Send className="h-3.5 w-3.5" />
                              Publish
                            </button>
                          )}
                          {brief.status === "published" && (
                            <button
                              onClick={() => handleUnpublish(brief.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
                            >
                              <ArchiveRestore className="h-3.5 w-3.5" />
                              Unpublish
                            </button>
                          )}
                          <button
                            onClick={() => handleDownloadPDF(brief.id)}
                            disabled={downloading === brief.id}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-50"
                          >
                            {downloading === brief.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                            Download PDF
                          </button>
                          <button
                            onClick={() => handleDelete(brief.id)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-muted"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}
      </div>
    );
  }

  // Reader view (principal / cfo)
  return (
    <motion.main
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-[680px] px-4 py-10 sm:px-6"
    >
      {latestBrief ? (
        <BriefReaderView brief={latestBrief} liveData={liveData} />
      ) : (
        <div className="py-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-lg text-muted-foreground">
            No brief available
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Your team has not published a brief yet.
          </p>
        </div>
      )}

      {briefs.length > 0 && (
        <section className="mt-12 border-t border-border pt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Previous briefs
            </h2>
            <span className="text-xs text-muted-foreground">
              {briefs.length} {briefs.length === 1 ? "brief" : "briefs"}
            </span>
          </div>
          <div className="space-y-2">
            {briefs.map((b) => (
              <Link key={b.id} href={`/brief/${b.id}`}>
                <Card className="group cursor-pointer transition-colors hover:bg-muted/20">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {b.title}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Calendar className="h-3 w-3 shrink-0" />
                        {new Date(
                          b.brief_date + "T00:00:00"
                        ).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </motion.main>
  );
}
