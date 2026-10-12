"use client";

import { useState, useEffect, useCallback, useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  Plus,
  MoreHorizontal,
  Send,
  ArchiveRestore,
  Trash2,
  Download,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { BriefReaderView } from "@/components/brief/BriefReaderView";
import {
  fetchBriefs,
  fetchLatestPublishedBrief,
  createBrief,
  publishBrief,
  unpublishBrief,
  deleteBrief,
  setBriefPrincipalVisible,
  fetchCashFlowData,
  fetchUpcomingBillsData,
  fetchProjectsSnapshot,
  fetchPendingDecisions,
  type Brief,
} from "@/lib/brief-service";
import {
  RpPage,
  RpPageHeader,
  RpTabs,
  RpList,
  RpRow,
  RpStatus,
  RpButton,
  RpCheck,
  RpEmpty,
  RpLoading,
  RpSubhead,
  RP_ICON,
  dot,
  fmtDate,
  pushEscapeLayer,
} from "@/components/rp";
import { sectionEyebrow } from "@/lib/sections";

/** Below 640px, wrap a row's status and actions onto their own line (kit rows cap the end at 50%). */
const ROW_STACK_SM = "max-sm:flex-wrap max-sm:[&>.rp-row-main]:basis-0 max-sm:[&>.rp-row-end]:max-w-none max-sm:[&>.rp-row-end]:basis-full max-sm:[&>.rp-row-end]:justify-start"

type FilterTab = "all" | "draft" | "published" | "archived";
type Counts = Record<FilterTab, number>;

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
  // Tab counts and the latest published date, taken from the last "All" load.
  const [counts, setCounts] = useState<Counts | null>(null);
  const [latestPublishedDate, setLatestPublishedDate] = useState<string | null>(null);

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
    if (filter === "all") {
      setCounts({
        all: data.length,
        draft: data.filter((b) => b.status === "draft").length,
        published: data.filter((b) => b.status === "published").length,
        archived: data.filter((b) => b.status === "archived").length,
      });
      const published = data
        .filter((b) => b.status === "published")
        .map((b) => b.brief_date)
        .sort();
      setLatestPublishedDate(published.length ? published[published.length - 1] : null);
    } else {
      setCounts((prev) => (prev ? { ...prev, [filter]: data.length } : prev));
    }
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

  const handleTogglePrincipalVisible = async (
    briefId: string,
    current: boolean,
  ) => {
    await setBriefPrincipalVisible(briefId, !current);
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
    { label: "Draft", value: "draft" },
    { label: "Published", value: "published" },
    { label: "Archived", value: "archived" },
  ];

  // Before the role is known: a neutral loading page.
  if (!role || (isLoading && !isStaff)) {
    return (
      <RpPage>
        <RpPageHeader
          eyebrow={sectionEyebrow("brief")}
          title="The owner's weekly brief"
          pines={false}
        />
        <RpLoading rows={6} label="Loading briefs" />
      </RpPage>
    );
  }

  if (isStaff) {
    const total = counts?.all ?? briefs.length;
    return (
      <RpPage>
        <RpPageHeader
          eyebrow={sectionEyebrow("brief")}
          title="The owner's weekly brief"
          line={dot(
            `${total} ${total === 1 ? "brief" : "briefs"}`,
            latestPublishedDate && `latest published ${fmtDate(latestPublishedDate, "medium")}`,
          )}
          actions={
            <RpButton
              icon={<Plus {...RP_ICON} />}
              onClick={handleNewBrief}
              disabled={creating}
            >
              {creating ? "Creating…" : "New brief"}
            </RpButton>
          }
        />

        <RpTabs
          ariaLabel="Brief status"
          value={filter}
          onChange={(id) => setFilter(id as FilterTab)}
          items={filterTabs.map((t) => ({
            id: t.value,
            label: t.label,
            count: t.value === filter && !isLoading ? briefs.length : counts?.[t.value],
          }))}
        />

        {isLoading ? (
          <RpLoading rows={6} label="Loading briefs" />
        ) : briefs.length === 0 ? (
          <RpEmpty
            title={filter === "all" ? "No briefs yet." : `No ${filter} briefs.`}
            line={
              filter === "all"
                ? "Compose the first owner's brief: the week in words, cash, bills, projects and decisions."
                : "Briefs with this status appear here."
            }
            action={
              filter === "all" ? (
                <RpButton variant="ghost" icon={<Plus {...RP_ICON} />} onClick={handleNewBrief} disabled={creating}>
                  New brief
                </RpButton>
              ) : undefined
            }
          />
        ) : (
          <RpList>
            {briefs.map((brief, i) => (
              <RpRow
                key={brief.id}
                className={ROW_STACK_SM}
                index={i + 1}
                href={`/brief/${brief.id}`}
                title={brief.title}
                titleStyle="display"
                meta={dot(
                  fmtDate(brief.brief_date, "medium"),
                  `${brief._blockCount || 0} blocks`,
                  brief.principal_visible ? "Visible to owner" : null,
                  downloading === brief.id && "Preparing PDF…",
                )}
                aside={<RpStatus kind="brief" value={brief.status} />}
                actions={
                  <BriefRowMenu
                    open={menuOpen === brief.id}
                    onToggle={() => setMenuOpen(menuOpen === brief.id ? null : brief.id)}
                    onClose={() => setMenuOpen(null)}
                  >
                    {brief.status === "draft" && (
                      <MenuItem icon={<Send {...RP_ICON} />} onClick={() => handlePublish(brief.id)}>
                        Publish
                      </MenuItem>
                    )}
                    {brief.status === "published" && (
                      <MenuItem icon={<ArchiveRestore {...RP_ICON} />} onClick={() => handleUnpublish(brief.id)}>
                        Unpublish
                      </MenuItem>
                    )}
                    <MenuItem
                      icon={<Download {...RP_ICON} />}
                      onClick={() => handleDownloadPDF(brief.id)}
                      disabled={downloading === brief.id}
                    >
                      {downloading === brief.id ? "Preparing PDF…" : "Download PDF"}
                    </MenuItem>
                    <div className="border-b border-rp-line px-4 py-3">
                      <RpCheck
                        checked={Boolean(brief.principal_visible)}
                        onChange={() =>
                          handleTogglePrincipalVisible(
                            brief.id,
                            Boolean(brief.principal_visible),
                          )
                        }
                        label="Visible to owner"
                      />
                    </div>
                    <MenuItem icon={<Trash2 {...RP_ICON} />} onClick={() => handleDelete(brief.id)} danger>
                      Delete
                    </MenuItem>
                  </BriefRowMenu>
                }
              />
            ))}
          </RpList>
        )}
      </RpPage>
    );
  }

  // Reader view (principal / cfo)
  return (
    <RpPage>
      {latestBrief ? (
        <BriefReaderView brief={latestBrief} liveData={liveData} />
      ) : (
        <>
          <RpPageHeader
            eyebrow={sectionEyebrow("brief")}
            title="The owner's weekly brief"
            line="The week on site, in one read."
          />
          <RpEmpty
            title="No brief yet."
            line="The owner's rep team has not published a brief yet."
          />
        </>
      )}

      {briefs.length > 0 && (
        <section className="flex max-w-[760px] flex-col gap-5">
          <RpSubhead
            size="md"
            title="Previous briefs"
            spec={`${briefs.length} ${briefs.length === 1 ? "brief" : "briefs"}`}
          />
          <RpList>
            {briefs.map((b, i) => (
              <RpRow
                key={b.id}
                index={i + 1}
                href={`/brief/${b.id}`}
                title={b.title}
                titleStyle="display"
                meta={dot(fmtDate(b.brief_date, "long"), b.cover_subtitle)}
              />
            ))}
          </RpList>
        </section>
      )}
    </RpPage>
  );
}

// ── Row menu: a square popover, portalled so it never sits under the next row ──

function BriefRowMenu({
  open,
  onToggle,
  onClose,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const place = () => {
      const r = btnRef.current!.getBoundingClientRect();
      setPos({ top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right) });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const pop = pushEscapeLayer(() => {
      onCloseRef.current();
      btnRef.current?.focus();
    });
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      onCloseRef.current();
    };
    document.addEventListener("mousedown", onDown);
    return () => {
      pop();
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  return (
    <>
      <RpButton
        ref={btnRef}
        variant="ghost"
        size="sm"
        icon={<MoreHorizontal {...RP_ICON} />}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={onToggle}
      >
        More
      </RpButton>
      {open && pos && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-[55] min-w-[220px] border border-rp-line2 bg-rp-bg"
            style={{ top: pos.top, right: pos.right }}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}

function MenuItem({
  icon,
  onClick,
  disabled,
  danger,
  children,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-3 border-b border-rp-line px-4 py-3 text-left text-[14px] transition-colors last:border-b-0 hover:bg-rp-surface focus-visible:bg-rp-surface disabled:opacity-50 ${
        danger ? "text-rp-alert" : "text-rp-text"
      }`}
    >
      <span className={danger ? "text-rp-alert" : "text-rp-muted"}>{icon}</span>
      {children}
    </button>
  );
}
