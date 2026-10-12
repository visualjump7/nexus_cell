"use client";

import type { Brief } from "@/lib/brief-service";
import { BriefCover, BriefBody, BriefColophon, splitBriefTitle } from "./BriefReaderView";
import { RpStatus, dot, fmtDate } from "@/components/rp";

interface BriefPreviewProps {
  brief: Brief;
  liveData: Record<string, unknown>;
  compact?: boolean;
  /** Owner's name for the cover meta, when known. */
  principalName?: string;
}

/**
 * Live preview of the owner's brief, rendered with the reader's pieces so
 * the editor shows exactly what the owner will read.
 */
export function BriefPreview({ brief, liveData, compact, principalName }: BriefPreviewProps) {
  const { issue, rest } = splitBriefTitle(brief.title);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <RpStatus kind="brief" value={brief.status} />
          <span className="text-[12px] text-rp-dim">
            {dot(rest || fmtDate(brief.brief_date, "medium"), `${brief.blocks?.length || 0} blocks`)}
          </span>
        </div>
        <h2
          className={
            compact
              ? "font-display text-2xl font-medium uppercase leading-[1.05] tracking-[.01em] text-rp-text"
              : "font-display text-[clamp(26px,3vw,40px)] font-medium uppercase leading-[1.05] text-rp-text"
          }
        >
          {issue}
        </h2>
        {brief.cover_subtitle && (
          <p className="text-[15px] leading-snug text-rp-muted">{brief.cover_subtitle}</p>
        )}
      </div>

      <BriefCover brief={brief} principalName={principalName} compact={compact} />

      {!brief.blocks || brief.blocks.length === 0 ? (
        <p className="text-[15px] text-rp-muted">No blocks yet. Add one on the left.</p>
      ) : (
        <BriefBody brief={brief} liveData={liveData} compact={compact} />
      )}

      <BriefColophon brief={brief} />
    </div>
  );
}
