"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildImportPreview,
  commitImport,
  listSheetsInFile,
  type ImportPreview,
} from "@/lib/budget-import";
import type { SheetInfo } from "@/lib/budget-parser";
import { validateBudgetFile } from "@/lib/budget-parser";
import { cn } from "@/lib/utils";
import {
  RpButton,
  RpKV,
  RpLoading,
  RpModal,
  RpTable,
  RpTag,
  fmtMoney,
  pad2,
} from "@/components/rp";

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  organizationId: string;
  onImported?: () => void;
}

type Stage = "pick" | "sheet" | "preview" | "submitting" | "done" | "error";

const DROPZONE_BG =
  "bg-[repeating-linear-gradient(135deg,transparent_0_14px,rgba(205,161,75,.05)_14px_28px)]";

export function ImportDialog({
  open,
  onClose,
  projectId,
  organizationId,
  onImported,
}: ImportDialogProps) {
  const [stage, setStage] = useState<Stage>("pick");
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<SheetInfo[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rowsInserted, setRowsInserted] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setStage("pick");
      setFile(null);
      setSheets([]);
      setSelectedSheet(null);
      setPreview(null);
      setError(null);
      setIsDragging(false);
      setRowsInserted(0);
    }
  }, [open]);

  // Esc is handled by RpModal (layered with any modal above it).

  const handleFile = useCallback(async (f: File) => {
    setError(null);

    const valid = validateBudgetFile(f);
    if (!valid.valid) {
      setError(valid.error || "Invalid file");
      setStage("error");
      return;
    }

    setFile(f);
    try {
      const sheetList = await listSheetsInFile(f);
      if (sheetList.length === 0) {
        setError("The workbook has no sheets.");
        setStage("error");
        return;
      }
      setSheets(sheetList);
      if (sheetList.length === 1) {
        setSelectedSheet(sheetList[0].name);
        const p = await buildImportPreview(f, sheetList[0].name);
        setPreview(p);
        setStage("preview");
      } else {
        setStage("sheet");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read file");
      setStage("error");
    }
  }, []);

  const handleSheetChoice = useCallback(
    async (name: string) => {
      if (!file) return;
      setError(null);
      setSelectedSheet(name);
      try {
        const p = await buildImportPreview(file, name);
        setPreview(p);
        setStage("preview");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to parse sheet"
        );
        setStage("error");
      }
    },
    [file]
  );

  const handleConfirm = useCallback(async () => {
    if (!file || !selectedSheet) return;
    setStage("submitting");
    const result = await commitImport(
      file,
      selectedSheet,
      projectId,
      organizationId
    );
    if (!result.success) {
      setError(result.error || "Import failed");
      setStage("error");
      return;
    }
    setRowsInserted(result.rowsInserted);
    setStage("done");
    if (onImported) onImported();
    setTimeout(onClose, 1500);
  }, [file, selectedSheet, projectId, organizationId, onImported, onClose]);

  const rowsLabel = (n: number) => `${n} row${n === 1 ? "" : "s"}`;

  const footer =
    stage === "preview" && preview ? (
      <>
        <RpButton variant="ghost" onClick={() => setStage("pick")}>
          Choose a different file
        </RpButton>
        <RpButton
          onClick={handleConfirm}
          disabled={preview.lineItemCount === 0}
        >
          Import {rowsLabel(preview.lineItemCount)}
        </RpButton>
      </>
    ) : stage === "error" ? (
      <>
        <RpButton variant="ghost" onClick={onClose}>
          Close
        </RpButton>
        <RpButton onClick={() => setStage("pick")}>Try again</RpButton>
      </>
    ) : stage === "pick" || stage === "sheet" ? (
      <RpButton variant="ghost" onClick={onClose}>
        Cancel
      </RpButton>
    ) : undefined;

  return (
    <RpModal
      open={open}
      onClose={onClose}
      size="lg"
      eyebrow="Import budget"
      title={file?.name || "Budget workbook"}
      footer={footer}
    >
      {stage === "pick" && (
        <>
          <p className="max-w-[60ch] text-[15px] leading-normal text-rp-muted">
            Upload an .xlsx or .csv file with monthly budget columns. Line
            items become categorised budget rows; the monthly breakdown is
            kept.
          </p>
          <label
            htmlFor="budget-import-file"
            className={cn(
              "rp-box relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 px-6 py-8 text-center transition-colors duration-200",
              DROPZONE_BG,
              isDragging
                ? "border-rp-gold bg-[rgba(205,161,75,.06)]"
                : "hover:border-rp-line3 has-[:focus-visible]:border-rp-blue"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) void handleFile(f);
            }}
          >
            <RpTag tone="gold">Drop the budget workbook</RpTag>
            <span className="text-[13px] text-rp-muted">
              .xlsx, .xls or .csv · up to 10 MB
            </span>
            <span className="rp-btn-ghost rp-btn--sm" aria-hidden>
              Choose file
            </span>
            <input
              ref={fileInputRef}
              id="budget-import-file"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
          </label>
        </>
      )}

      {stage === "sheet" && (
        <>
          <p className="text-[15px] leading-normal text-rp-muted">
            This workbook has {sheets.length} sheets. Choose the one to
            import.
          </p>
          <ul className="flex flex-col border-t border-rp-line">
            {sheets.map((s, i) => (
              <li key={s.name} className="border-b border-rp-line">
                <button
                  type="button"
                  onClick={() => handleSheetChoice(s.name)}
                  className="flex min-h-[48px] w-full items-center gap-4 border-l-2 border-transparent px-3 text-left transition-colors duration-200 hover:border-rp-gold hover:bg-rp-surface"
                >
                  <span className="rp-cap-num text-[13px]">{pad2(i + 1)}</span>
                  <span className="min-w-0 flex-1 truncate text-[15px] text-rp-text">
                    {s.name}
                  </span>
                  {s.year && <RpTag>{s.year}</RpTag>}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {stage === "preview" && preview && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <RpTag tone={preview.lineItemCount > 0 ? "green" : "neutral"}>
              {preview.lineItemCount > 0 ? "Ready" : "Nothing to import"}
            </RpTag>
            <span className="text-[15px] text-rp-text">
              {preview.lineItemCount} line item
              {preview.lineItemCount === 1 ? "" : "s"} across{" "}
              {preview.categoryCount} categor
              {preview.categoryCount === 1 ? "y" : "ies"}
            </span>
          </div>

          <RpKV
            cols={2}
            items={[
              { label: "Sheet", value: preview.sheetName },
              { label: "Year", value: preview.year ?? "—" },
              {
                label: "Total annual",
                value: (
                  <span className="font-display text-base font-medium tracking-[.02em]">
                    {fmtMoney(preview.totalAnnualBudget)}
                  </span>
                ),
                num: true,
              },
              { label: "Categories", value: preview.categoryCount, num: true },
            ]}
          />

          {preview.categories.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="rp-eyebrow--muted">Categories</span>
              <div className="flex flex-wrap gap-2">
                {preview.categories.slice(0, 12).map((c) => (
                  <RpTag key={c}>{c}</RpTag>
                ))}
                {preview.categories.length > 12 && (
                  <span className="self-center text-[13px] text-rp-dim">
                    and {preview.categories.length - 12} more
                  </span>
                )}
              </div>
            </div>
          )}

          {preview.sampleLineItems.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="rp-eyebrow--muted">Sample line items</span>
              <RpTable dense minWidth={420} caption="Sample line items">
                <thead>
                  <tr>
                    <th className="idx">#</th>
                    <th>Line</th>
                    <th className="num">Annual</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.sampleLineItems.map((li, i) => (
                    <tr key={i}>
                      <td className="idx">{pad2(i + 1)}</td>
                      <td className="break-words">{li.name}</td>
                      <td className="num">{fmtMoney(li.annual_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </RpTable>
            </div>
          )}

          {preview.errors.length > 0 && (
            <p className="text-[13px] text-rp-gold" role="status">
              {preview.errors.length} parser warning
              {preview.errors.length === 1 ? "" : "s"} · rows the parser
              could not read are skipped
            </p>
          )}

          {preview.lineItemCount === 0 && (
            <p className="text-[15px] text-rp-muted">
              Nothing to import. No line items were parsed from this sheet.
            </p>
          )}
        </>
      )}

      {stage === "submitting" && <RpLoading label="Importing" />}

      {stage === "done" && (
        <div className="flex flex-col items-start gap-3 py-6">
          <RpTag tone="green">Imported</RpTag>
          <p className="font-display text-2xl uppercase tracking-[.02em] text-rp-text">
            {rowsLabel(rowsInserted)} added to the budget
          </p>
        </div>
      )}

      {stage === "error" && (
        <div className="flex flex-col items-start gap-2">
          <span className="rp-eyebrow--muted">Import stopped</span>
          <p className="rp-error text-[15px]" role="alert">
            {error || "Something went wrong"}
          </p>
        </div>
      )}
    </RpModal>
  );
}
