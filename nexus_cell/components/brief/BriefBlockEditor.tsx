"use client";

import { useState, useRef } from "react";
import { FileUp } from "lucide-react";
import { TipTapEditor } from "./TipTapEditor";
import type {
  BriefBlock,
  CashFlowBlockData,
  BillBlockData,
  ProjectsBlockData,
  DecisionsBlockData,
} from "@/lib/brief-service";
import {
  RpField,
  RpSelect,
  RpTextarea,
  RpButton,
  RpLoading,
  RpStatus,
  RP_ICON,
  fmtMoney,
  dot,
} from "@/components/rp";

interface BriefBlockEditorProps {
  block: BriefBlock;
  liveData: Record<string, unknown>;
  orgId: string;
  onUpdate: (
    updates: Partial<Pick<BriefBlock, "content_html" | "config" | "commentary">>
  ) => void;
}

/** Inset summary of the live data a block will show. */
function DataInset({ title, children }: { title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="rp-inset flex flex-col gap-3 p-4">
      <p className="font-display text-[13px] uppercase tracking-[.14em] text-rp-text">{title}</p>
      {children}
    </div>
  );
}

function MiniRows({ rows, more }: { rows: { key: string; left: React.ReactNode; right: React.ReactNode }[]; more?: number }) {
  if (rows.length === 0) return null;
  return (
    <ul className="m-0 flex list-none flex-col border-t border-rp-line p-0">
      {rows.map((r) => (
        <li key={r.key} className="flex items-center justify-between gap-3 border-b border-rp-line py-2 text-[13px]">
          <span className="min-w-0 truncate text-rp-muted">{r.left}</span>
          <span className="shrink-0 tabular-nums text-rp-text">{r.right}</span>
        </li>
      ))}
      {more != null && more > 0 && (
        <li className="pt-2 text-[12px] text-rp-dim">{`+ ${more} more`}</li>
      )}
    </ul>
  );
}

function CommentaryField({ block, onUpdate }: { block: BriefBlock; onUpdate: BriefBlockEditorProps["onUpdate"] }) {
  const id = `commentary-${block.id}`;
  return (
    <RpField label="Commentary" htmlFor={id} hint="Optional · printed under the data">
      <RpTextarea
        id={id}
        value={block.commentary || ""}
        onChange={(e) => onUpdate({ commentary: e.target.value })}
        placeholder="What it means and what you recommend"
        rows={3}
      />
    </RpField>
  );
}

export function BriefBlockEditor({
  block,
  liveData,
  onUpdate,
}: BriefBlockEditorProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDocxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const mammoth = await import("mammoth");
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      onUpdate({ content_html: result.value });
    } catch (err) {
      console.error("Error converting docx:", err);
    }
    setUploading(false);
  };

  if (block.type === "text" || block.type === "document") {
    return (
      <div className="flex flex-col gap-3">
        <TipTapEditor
          content={block.content_html || ""}
          onChange={(html) => onUpdate({ content_html: html })}
          placeholder={
            block.type === "document"
              ? "Upload a .docx or type the document"
              : "Write the update. Start with a heading to title the section."
          }
        />
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".docx"
            className="hidden"
            onChange={handleDocxUpload}
          />
          <RpButton
            variant="ghost"
            size="sm"
            icon={<FileUp {...RP_ICON} />}
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Converting…" : "Upload .docx"}
          </RpButton>
        </div>
      </div>
    );
  }

  if (block.type === "cashflow") {
    const data = liveData.cashflow as CashFlowBlockData | undefined;
    return (
      <div className="flex flex-col gap-4">
        {data ? (
          <DataInset title={`Cash · ${data.month} ${data.year}`}>
            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="Paid out" value={fmtMoney(data.cashOut, { compact: true })} />
              <MiniStat label="Pending" value={`${data.pendingCount}`} />
              <MiniStat label="Net" value={fmtMoney(data.net, { compact: true })} tone={data.net < 0 ? "text-rp-alert" : undefined} />
            </div>
          </DataInset>
        ) : (
          <RpLoading label="Loading cash" className="h-24" />
        )}
        <CommentaryField block={block} onUpdate={onUpdate} />
      </div>
    );
  }

  if (block.type === "bills") {
    const daysAhead =
      (block.config?.days_ahead as number | undefined) ?? 7;
    const dataKey = `bills_${daysAhead}`;
    const data = liveData[dataKey] as BillBlockData | undefined;
    const selectId = `days-${block.id}`;

    return (
      <div className="flex flex-col gap-4">
        <RpField label="Window" htmlFor={selectId}>
          <RpSelect
            id={selectId}
            className="max-w-[220px]"
            value={daysAhead}
            onChange={(e) =>
              onUpdate({
                config: { ...block.config, days_ahead: Number(e.target.value) },
              })
            }
          >
            <option value={7}>Next 7 days</option>
            <option value={14}>Next 14 days</option>
            <option value={30}>Next 30 days</option>
          </RpSelect>
        </RpField>
        {data ? (
          <DataInset title={dot(`${data.bills.length} ${data.bills.length === 1 ? "bill" : "bills"} due`, fmtMoney(data.total, { compact: true }))}>
            <MiniRows
              rows={data.bills.slice(0, 5).map((bill) => ({ key: bill.id, left: bill.vendor, right: fmtMoney(bill.amount) }))}
              more={data.bills.length - 5}
            />
          </DataInset>
        ) : (
          <RpLoading label="Loading bills" className="h-24" />
        )}
        <CommentaryField block={block} onUpdate={onUpdate} />
      </div>
    );
  }

  if (block.type === "projects") {
    const status =
      (block.config?.status as string | undefined) ?? "all";
    const data = liveData.projects as ProjectsBlockData | undefined;
    const selectId = `status-${block.id}`;

    return (
      <div className="flex flex-col gap-4">
        <RpField label="Status" htmlFor={selectId}>
          <RpSelect
            id={selectId}
            className="max-w-[220px]"
            value={status}
            onChange={(e) =>
              onUpdate({
                config: { ...block.config, status: e.target.value },
              })
            }
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="on_hold">On hold</option>
            <option value="completed">Complete</option>
            <option value="archived">Archived</option>
          </RpSelect>
        </RpField>
        {data ? (
          <DataInset title={dot(`${data.projects.length} ${data.projects.length === 1 ? "package" : "packages"}`, `${data.activeCount} active`)}>
            <MiniRows
              rows={data.projects.slice(0, 5).map((p) => ({ key: p.id, left: p.name, right: <RpStatus kind="project" value={p.status} /> }))}
            />
          </DataInset>
        ) : (
          <RpLoading label="Loading projects" className="h-24" />
        )}
        <CommentaryField block={block} onUpdate={onUpdate} />
      </div>
    );
  }

  if (block.type === "decisions") {
    const data = liveData.decisions as DecisionsBlockData | undefined;

    return (
      <div className="flex flex-col gap-4">
        {data ? (
          <DataInset title={`${data.count} ${data.count === 1 ? "decision" : "decisions"} waiting`}>
            <MiniRows
              rows={data.decisions.slice(0, 5).map((d) => ({ key: d.id, left: d.title, right: <RpStatus kind="priority" value={d.priority} /> }))}
            />
          </DataInset>
        ) : (
          <RpLoading label="Loading decisions" className="h-24" />
        )}
        <CommentaryField block={block} onUpdate={onUpdate} />
      </div>
    );
  }

  return null;
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="font-display text-[11px] uppercase tracking-[.16em] text-rp-muted">{label}</span>
      <span className={`font-display text-xl font-medium tabular-nums ${tone ?? "text-rp-text"}`}>{value}</span>
    </div>
  );
}
