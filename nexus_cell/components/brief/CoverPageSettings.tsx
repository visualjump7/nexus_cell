"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, ChevronDown, ChevronRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { Brief } from "@/lib/brief-service";
import { BRAND } from "@/lib/brand";
import {
  RpBox,
  RpField,
  RpInput,
  RpCheck,
  RpButton,
  RpFormGrid,
  RP_ICON,
  fmtDate,
} from "@/components/rp";

interface CoverPageSettingsProps {
  brief: Brief;
  orgId: string;
  principalName: string;
  onUpdate: (updates: Partial<Brief>) => void;
}

const DEFAULT_ACCENT = "#CDA14B";

/** The PDF renderer prints raster logos from absolute URLs only (matches BriefPDF). */
function isPrintableLogo(url: string | null | undefined): boolean {
  if (!url) return false;
  if (!/^https?:\/\//i.test(url) && !url.startsWith("data:image/")) return false;
  return !/\.svg(\?|#|$)/i.test(url) && !url.startsWith("data:image/svg");
}

const presetColors = [
  { label: "Gold", value: "#CDA14B" },
  { label: "Blue", value: "#3989CB" },
  { label: "Green", value: "#A4CC5C" },
  { label: "Steel", value: "#9AA0A4" },
  { label: "White", value: "#ffffff" },
];

export function CoverPageSettings({
  brief,
  orgId,
  principalName,
  onUpdate,
}: CoverPageSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const accent = brief.cover_accent_color || DEFAULT_ACCENT;
  const printableLogo = isPrintableLogo(brief.cover_logo_url);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const fileName = `logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("brief-logos")
        .upload(`${orgId}/${fileName}`, file, { upsert: true });

      if (error) {
        console.error("Logo upload error:", error);
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("brief-logos")
        .getPublicUrl(`${orgId}/${fileName}`);

      onUpdate({ cover_logo_url: urlData.publicUrl });
    } catch (err) {
      console.error("Upload failed:", err);
    }
    setUploading(false);
  };

  const handleRemoveLogo = () => {
    onUpdate({ cover_logo_url: null });
  };

  return (
    <RpBox as="section">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left transition-colors hover:bg-rp-surface"
      >
        <span className="flex items-baseline gap-3">
          <span className="rp-eyebrow--muted">Cover</span>
          <span className="text-[13px] text-rp-dim">
            {brief.cover_title || "Weekly Owner Brief"}
          </span>
        </span>
        <span className="text-rp-muted" aria-hidden>
          {isOpen ? <ChevronDown {...RP_ICON} /> : <ChevronRight {...RP_ICON} />}
        </span>
      </button>

      {isOpen && (
        <div className="grid gap-6 border-t border-rp-line px-6 py-6 md:grid-cols-[1fr_220px]">
          <div className="flex min-w-0 flex-col gap-5">
            <RpFormGrid>
              <RpField label="Cover title" htmlFor={`cover-title-${brief.id}`}>
                <RpInput
                  id={`cover-title-${brief.id}`}
                  type="text"
                  value={brief.cover_title || ""}
                  onChange={(e) => onUpdate({ cover_title: e.target.value })}
                  placeholder="Weekly Owner Brief"
                />
              </RpField>
              <RpField label="Subtitle" htmlFor={`cover-sub-${brief.id}`} hint="Optional · the week in a line">
                <RpInput
                  id={`cover-sub-${brief.id}`}
                  type="text"
                  value={brief.cover_subtitle || ""}
                  onChange={(e) => onUpdate({ cover_subtitle: e.target.value })}
                  placeholder={`Prepared for ${principalName || "the owner"}`}
                />
              </RpField>
            </RpFormGrid>

            <RpField
              label="Logo"
              hint={
                brief.cover_logo_url && !printableLogo
                  ? "SVG and site-relative logos print as the Roaring Pines wordmark"
                  : "PNG or JPG prints on the PDF cover"
              }
            >
              <div className="flex flex-wrap items-center gap-3">
                {brief.cover_logo_url ? (
                  <>
                    <Image
                      src={brief.cover_logo_url}
                      alt="Cover logo"
                      width={120}
                      height={40}
                      className="h-10 max-w-[120px] border border-rp-line bg-rp-bg object-contain p-1"
                      unoptimized
                    />
                    <RpButton
                      variant="icon"
                      size="sm"
                      aria-label="Remove logo"
                      onClick={handleRemoveLogo}
                    >
                      <X {...RP_ICON} />
                    </RpButton>
                  </>
                ) : (
                  <>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <RpButton
                      variant="ghost"
                      size="sm"
                      icon={<Upload {...RP_ICON} />}
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? "Uploading…" : "Upload logo"}
                    </RpButton>
                  </>
                )}
              </div>
            </RpField>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <RpCheck
                checked={brief.cover_show_date !== false}
                onChange={(v) => onUpdate({ cover_show_date: v })}
                label="Show date"
              />
              <RpCheck
                checked={brief.cover_show_principal !== false}
                onChange={(v) => onUpdate({ cover_show_principal: v })}
                label="Show owner name"
              />
            </div>

            <RpField label="Accent colour" hint="The PDF cover rule">
              <div className="flex items-center gap-2" role="group" aria-label="Accent colour">
                {presetColors.map((c) => {
                  const active = accent.toLowerCase() === c.value.toLowerCase();
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => onUpdate({ cover_accent_color: c.value })}
                      title={c.label}
                      aria-label={c.label}
                      aria-pressed={active}
                      className={`h-7 w-7 border transition-colors ${
                        active ? "border-rp-text outline outline-1 outline-offset-2 outline-rp-text" : "border-rp-line2 hover:border-rp-muted"
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  );
                })}
                <input
                  type="color"
                  value={accent}
                  onChange={(e) =>
                    onUpdate({ cover_accent_color: e.target.value })
                  }
                  className="h-7 w-7 cursor-pointer border border-rp-line2 bg-transparent p-0"
                  title="Custom colour"
                  aria-label="Custom colour"
                />
              </div>
            </RpField>
          </div>

          {/* PDF cover proof */}
          <div className="flex flex-col gap-2">
            <span className="rp-label">PDF cover</span>
            <div className="flex aspect-[17/22] flex-col justify-between border border-rp-line2 bg-rp-bg p-5">
              <div className="flex flex-col gap-3">
                {printableLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brief.cover_logo_url as string}
                    alt=""
                    className="h-8 w-auto self-start object-contain"
                  />
                ) : (
                  <span className="flex flex-col font-display text-[11px] font-medium uppercase leading-[1.05] tracking-[.16em] text-rp-text">
                    <span>Roaring</span>
                    <span>Pines</span>
                    <span className="mt-0.5 text-[6px] font-normal tracking-[.2em] text-rp-muted">Motor Club</span>
                  </span>
                )}
                <p className="font-display text-[8px] uppercase tracking-[.22em] text-rp-gold">
                  {BRAND.fullName}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="font-display text-[17px] uppercase leading-[1.05] tracking-[.02em] text-rp-text">
                  {brief.cover_title || "Weekly Owner Brief"}
                </p>
                {brief.cover_subtitle && (
                  <p className="text-[10px] leading-snug text-rp-muted">{brief.cover_subtitle}</p>
                )}
                <span className="h-0.5 w-8" style={{ backgroundColor: accent }} />
                <div className="flex flex-col gap-0.5 text-[9px] uppercase tracking-[.14em] text-rp-muted">
                  {brief.cover_show_date !== false && (
                    <span>{fmtDate(brief.brief_date, "long")}</span>
                  )}
                  {brief.cover_show_principal !== false && principalName && (
                    <span>Prepared for {principalName}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </RpBox>
  );
}
