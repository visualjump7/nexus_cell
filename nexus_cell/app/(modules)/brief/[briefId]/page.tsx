"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  Download,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  fetchBrief,
  updateBrief,
  publishBrief,
  addBlock,
  updateBlock,
  deleteBlock,
  reorderBlocks,
  fetchCashFlowData,
  fetchUpcomingBillsData,
  fetchProjectsSnapshot,
  fetchPendingDecisions,
  type Brief,
  type BriefBlock,
} from "@/lib/brief-service";
import { BriefBlockEditor } from "@/components/brief/BriefBlockEditor";
import { BriefPreview } from "@/components/brief/BriefPreview";
import { BriefReaderView } from "@/components/brief/BriefReaderView";
import { CoverPageSettings } from "@/components/brief/CoverPageSettings";
import {
  RpPage,
  RpPageHeader,
  RpBox,
  RpButton,
  RpCapNum,
  RpTag,
  RpStatus,
  RpField,
  RpInput,
  RpFormGrid,
  RpLoading,
  RP_ICON,
  dot,
  pad2,
  pushEscapeLayer,
} from "@/components/rp";
import { sectionEyebrow } from "@/lib/sections";

const BLOCK_LABEL: Record<BriefBlock["type"], string> = {
  text: "Text",
  cashflow: "Cash",
  bills: "Bills due",
  projects: "Projects",
  decisions: "Decisions",
  document: "Document",
};

export default function BriefDetailPage() {
  const params = useParams();
  const briefId = params.briefId as string;
  const router = useRouter();

  const [brief, setBrief] = useState<Brief | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [principalName, setPrincipalName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [liveData, setLiveData] = useState<Record<string, unknown>>({});
  const [isDownloading, setIsDownloading] = useState(false);

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
      setUserId(user.id);
      const { data: membership } = await supabase
        .from("organization_members")
        .select("role, organization_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .single();
      if (membership) {
        setRole(membership.role);
        setOrgId(membership.organization_id);

        // Find the principal in this org for the cover-page display name.
        const { data: principalMembership } = await supabase
          .from("organization_members")
          .select("user_id, profiles:user_id(full_name)")
          .eq("organization_id", membership.organization_id)
          .eq("role", "principal")
          .eq("status", "active")
          .limit(1)
          .single();
        const profile = principalMembership?.profiles as
          | { full_name?: string }
          | { full_name?: string }[]
          | null;
        const name = Array.isArray(profile)
          ? profile[0]?.full_name
          : profile?.full_name;
        if (name) setPrincipalName(name);
      }
    }
    bootstrap();
  }, [router]);

  const isStaff = role === "ea" || role === "admin";

  const loadBrief = useCallback(async () => {
    const data = await fetchBrief(briefId);
    setBrief(data);
    setIsLoading(false);
  }, [briefId]);

  const loadLiveData = useCallback(async () => {
    if (!orgId) return;
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
  }, [orgId]);

  useEffect(() => {
    loadBrief();
  }, [loadBrief]);

  useEffect(() => {
    if (orgId) loadLiveData();
  }, [orgId, loadLiveData]);

  const handleTitleChange = async (title: string) => {
    if (!brief) return;
    setBrief({ ...brief, title });
    await updateBrief(briefId, { title });
  };

  const handleDateChange = async (briefDate: string) => {
    if (!brief) return;
    setBrief({ ...brief, brief_date: briefDate });
    await updateBrief(briefId, { brief_date: briefDate });
  };

  const handleAddBlock = async (type: BriefBlock["type"]) => {
    if (!brief) return;
    const position = brief.blocks?.length || 0;
    const defaultConfig: Record<string, unknown> = {};
    if (type === "bills") defaultConfig.days_ahead = 7;
    if (type === "projects") defaultConfig.status = "all";

    const block = await addBlock(briefId, type, position, defaultConfig);
    if (block) {
      setBrief({
        ...brief,
        blocks: [...(brief.blocks || []), block],
      });
    }
    setShowBlockPicker(false);
  };

  const handleUpdateBlock = async (
    blockId: string,
    updates: Partial<Pick<BriefBlock, "content_html" | "config" | "commentary">>
  ) => {
    await updateBlock(blockId, updates);
    if (brief?.blocks) {
      setBrief({
        ...brief,
        blocks: brief.blocks.map((b) =>
          b.id === blockId ? { ...b, ...updates } : b
        ),
      });
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    await deleteBlock(blockId);
    if (brief?.blocks) {
      setBrief({
        ...brief,
        blocks: brief.blocks.filter((b) => b.id !== blockId),
      });
    }
  };

  const handleMoveBlock = async (blockId: string, direction: "up" | "down") => {
    if (!brief?.blocks) return;
    const blocks = [...brief.blocks];
    const idx = blocks.findIndex((b) => b.id === blockId);
    if (idx < 0) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= blocks.length) return;

    [blocks[idx], blocks[newIdx]] = [blocks[newIdx], blocks[idx]];
    const reordered = blocks.map((b, i) => ({ ...b, position: i }));
    setBrief({ ...brief, blocks: reordered });
    await reorderBlocks(
      briefId,
      reordered.map((b) => b.id)
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateBrief(briefId, { status: "draft" });
    setIsSaving(false);
  };

  const handlePublish = async () => {
    if (!userId) return;
    setIsSaving(true);
    const ok = await publishBrief(briefId, userId);
    if (ok && brief) {
      setBrief({
        ...brief,
        status: "published",
        published_at: new Date().toISOString(),
      });
    }
    setIsSaving(false);
  };

  const handleCoverUpdate = async (updates: Partial<Brief>) => {
    if (!brief) return;
    setBrief({ ...brief, ...updates });
    await updateBrief(
      briefId,
      updates as Parameters<typeof updateBrief>[1]
    );
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
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
      const coverTitle = brief?.cover_title || brief?.title || "Daily-Brief";
      const safeTitle = coverTitle
        .replace(/[^a-zA-Z0-9-_ ]/g, "")
        .replace(/\s+/g, "-");
      a.href = url;
      a.download = `${safeTitle}-${brief?.brief_date || "brief"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
    setIsDownloading(false);
  };

  const blockTypes: { type: BriefBlock["type"]; label: string; desc: string }[] = [
    { type: "text", label: "Text", desc: "The week in words" },
    { type: "cashflow", label: "Cash", desc: "This month, paid and pending" },
    { type: "bills", label: "Bills due", desc: "Payables in a 7, 14 or 30-day window" },
    { type: "projects", label: "Projects", desc: "Package status snapshot" },
    { type: "decisions", label: "Decisions", desc: "Sign-offs waiting on the owner" },
    { type: "document", label: "Document", desc: "Upload a .docx" },
  ];

  // Esc closes the add-block menu.
  useEffect(() => {
    if (!showBlockPicker) return;
    return pushEscapeLayer(() => setShowBlockPicker(false));
  }, [showBlockPicker]);

  if (isLoading || !brief) {
    return (
      <RpPage>
        <RpPageHeader
          back={{ href: "/brief", label: "Briefs" }}
          eyebrow={sectionEyebrow("brief")}
          title="The owner's brief"
          pines={false}
        />
        <RpLoading rows={6} label="Loading brief" />
      </RpPage>
    );
  }

  // Reader view for principal / cfo
  if (!isStaff) {
    return (
      <RpPage>
        <BriefReaderView
          brief={brief}
          liveData={liveData}
          principalName={principalName || undefined}
          back={{ href: "/brief", label: "Briefs" }}
        />
      </RpPage>
    );
  }

  const blocks = brief.blocks || [];

  // Composer for ea / admin
  return (
    <RpPage>
      <RpPageHeader
        back={{ href: "/brief", label: "Briefs" }}
        eyebrow={sectionEyebrow("brief", "Editor")}
        tags={<RpStatus kind="brief" value={brief.status} />}
        title={brief.title || "Untitled brief"}
        spec={dot(
          `${blocks.length} ${blocks.length === 1 ? "block" : "blocks"}`,
          brief.principal_visible ? "Visible to owner" : "Hidden from owner",
        )}
        pines={false}
        actions={
          <>
            <RpButton
              variant="ghost"
              icon={<Download {...RP_ICON} />}
              onClick={handleDownloadPDF}
              disabled={isDownloading}
            >
              {isDownloading ? "Preparing PDF…" : "Download PDF"}
            </RpButton>
            <RpButton variant="ghost" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save draft"}
            </RpButton>
            <RpButton onClick={handlePublish} disabled={isSaving}>
              Publish
            </RpButton>
          </>
        }
      />

      <div className="grid items-start gap-8 lg:grid-cols-[3fr_2fr]">
        {/* Composer */}
        <div className="flex min-w-0 flex-col gap-5">
          <RpBox pad="lg" as="section" className="flex flex-col gap-5">
            <span className="rp-eyebrow--muted">Brief</span>
            <RpFormGrid>
              <RpField label="Title" htmlFor="brief-title" className="sm:col-span-2">
                <RpInput
                  id="brief-title"
                  type="text"
                  value={brief.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Owner Brief No. 36 — 29 Sep 2026"
                />
              </RpField>
              <RpField label="Brief date" htmlFor="brief-date">
                <RpInput
                  id="brief-date"
                  type="date"
                  value={brief.brief_date}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </RpField>
            </RpFormGrid>
          </RpBox>

          {orgId && (
            <CoverPageSettings
              brief={brief}
              orgId={orgId}
              principalName={principalName}
              onUpdate={handleCoverUpdate}
            />
          )}

          {blocks.map((block, index) => (
            <RpBox key={block.id} as="section">
              <div className="flex items-center gap-3 border-b border-rp-line px-5 py-3">
                <RpCapNum n={index + 1} className="text-[13px]" />
                <RpTag tone={block.type === "text" || block.type === "document" ? "neutral" : "blue"}>
                  {BLOCK_LABEL[block.type] ?? block.type}
                </RpTag>
                <div className="ml-auto flex items-center gap-1.5">
                  <RpButton
                    variant="icon"
                    size="sm"
                    aria-label="Move block up"
                    onClick={() => handleMoveBlock(block.id, "up")}
                    disabled={index === 0}
                  >
                    <ArrowUp {...RP_ICON} />
                  </RpButton>
                  <RpButton
                    variant="icon"
                    size="sm"
                    aria-label="Move block down"
                    onClick={() => handleMoveBlock(block.id, "down")}
                    disabled={index === blocks.length - 1}
                  >
                    <ArrowDown {...RP_ICON} />
                  </RpButton>
                  <RpButton
                    variant="icon"
                    size="sm"
                    aria-label="Remove block"
                    onClick={() => handleDeleteBlock(block.id)}
                  >
                    <X {...RP_ICON} />
                  </RpButton>
                </div>
              </div>

              <div className="p-5">
                {orgId && (
                  <BriefBlockEditor
                    block={block}
                    liveData={liveData}
                    orgId={orgId}
                    onUpdate={(updates) =>
                      handleUpdateBlock(block.id, updates)
                    }
                  />
                )}
              </div>
            </RpBox>
          ))}

          <div className="relative">
            <RpButton
              variant="ghost"
              icon={<Plus {...RP_ICON} />}
              aria-expanded={showBlockPicker}
              aria-haspopup="menu"
              onClick={() => setShowBlockPicker(!showBlockPicker)}
            >
              Add block
            </RpButton>

            {showBlockPicker && (
              <div
                role="menu"
                aria-label="Block type"
                className="absolute left-0 top-full z-20 mt-2 w-full max-w-[420px] border border-rp-line2 bg-rp-bg"
              >
                {blockTypes.map((bt, i) => (
                  <button
                    key={bt.type}
                    type="button"
                    role="menuitem"
                    onClick={() => handleAddBlock(bt.type)}
                    className="flex w-full items-baseline gap-4 border-b border-rp-line px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-rp-surface focus-visible:bg-rp-surface"
                  >
                    <RpCapNum n={pad2(i + 1)} className="text-[13px]" />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="font-display text-[15px] uppercase tracking-[.06em] text-rp-text">{bt.label}</span>
                      <span className="text-[13px] text-rp-muted">{bt.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live preview */}
        <aside className="min-w-0 lg:sticky lg:top-6">
          <RpBox>
            <div className="flex items-center justify-between gap-3 border-b border-rp-line px-5 py-3">
              <span className="rp-eyebrow--muted">Live preview</span>
              <span className="text-[12px] text-rp-dim">As the owner reads it</span>
            </div>
            <div className="max-h-[calc(100vh-160px)] overflow-y-auto p-5">
              <BriefPreview
                brief={brief}
                liveData={liveData}
                principalName={principalName || undefined}
                compact
              />
            </div>
          </RpBox>
        </aside>
      </div>
    </RpPage>
  );
}
