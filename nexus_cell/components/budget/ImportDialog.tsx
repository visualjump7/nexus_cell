"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  Loader2,
  AlertTriangle,
  Check,
} from "lucide-react";
import {
  buildImportPreview,
  commitImport,
  listSheetsInFile,
  type ImportPreview,
} from "@/lib/budget-import";
import type { SheetInfo } from "@/lib/budget-parser";
import { validateBudgetFile } from "@/lib/budget-parser";
import { formatCurrency } from "@/lib/utils";

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  organizationId: string;
  onImported?: () => void;
}

type Stage = "pick" | "sheet" | "preview" | "submitting" | "done" | "error";

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

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[min(560px,calc(100vw-2rem))] max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Import Budget Spreadsheet
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {stage === "pick" && (
            <>
              <p className="mb-4 text-xs text-muted-foreground">
                Upload an .xlsx or .csv file with monthly budget columns.
                Line items parse into categorized budget rows; monthly
                breakdown is preserved.
              </p>
              <label
                htmlFor="budget-import-file"
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background/50 hover:border-primary/60"
                }`}
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
                <FileSpreadsheet className="h-7 w-7 text-muted-foreground/50" />
                <p className="text-sm font-medium text-foreground">
                  Drop a file here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  .xlsx, .xls, or .csv · up to 10 MB
                </p>
                <input
                  ref={fileInputRef}
                  id="budget-import-file"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
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
              <p className="mb-4 text-xs text-muted-foreground">
                This workbook has multiple sheets. Choose the one to import.
              </p>
              <ul className="space-y-1.5">
                {sheets.map((s) => (
                  <li key={s.name}>
                    <button
                      type="button"
                      onClick={() => handleSheetChoice(s.name)}
                      className="flex w-full items-center justify-between rounded-lg border border-border bg-background/50 px-3 py-2.5 text-left text-sm text-foreground hover:border-primary transition-colors"
                    >
                      <span className="font-medium">{s.name}</span>
                      {s.year && (
                        <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {s.year}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {stage === "preview" && preview && (
            <>
              <p className="mb-4 text-xs text-muted-foreground">
                Review before importing. Sheet:{" "}
                <span className="text-foreground">{preview.sheetName}</span>
                {preview.year && (
                  <>
                    {" "}
                    · Year:{" "}
                    <span className="text-foreground">{preview.year}</span>
                  </>
                )}
              </p>

              <div className="space-y-2">
                <PreviewStat
                  icon={<Check className="h-3.5 w-3.5 text-emerald-400" />}
                  label={`${preview.lineItemCount} line item${
                    preview.lineItemCount === 1 ? "" : "s"
                  } across ${preview.categoryCount} categor${
                    preview.categoryCount === 1 ? "y" : "ies"
                  }`}
                  subLabel={`Total annual: ${formatCurrency(preview.totalAnnualBudget)}`}
                  tone="ok"
                />
                {preview.categories.length > 0 && (
                  <div className="rounded-lg border border-border bg-background/40 px-3 py-2.5">
                    <p className="text-xs text-muted-foreground">
                      Categories
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {preview.categories.slice(0, 8).map((c) => (
                        <li
                          key={c}
                          className="truncate text-xs text-foreground/80"
                        >
                          · {c}
                        </li>
                      ))}
                      {preview.categories.length > 8 && (
                        <li className="text-xs text-muted-foreground">
                          · …and {preview.categories.length - 8} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}
                {preview.sampleLineItems.length > 0 && (
                  <div className="rounded-lg border border-border bg-background/40 px-3 py-2.5">
                    <p className="text-xs text-muted-foreground">
                      Sample line items
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {preview.sampleLineItems.map((li, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between text-xs text-foreground/80"
                        >
                          <span className="truncate pr-2">{li.name}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {formatCurrency(li.annual_total)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {preview.errors.length > 0 && (
                  <PreviewStat
                    icon={<AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
                    label={`${preview.errors.length} parser warning${
                      preview.errors.length === 1 ? "" : "s"
                    }`}
                    tone="warn"
                  />
                )}
              </div>

              {preview.lineItemCount === 0 && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Nothing to import — no line items were parsed from this
                  sheet.
                </p>
              )}

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStage("pick")}
                  className="rounded-lg border border-border bg-transparent px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
                >
                  Choose a different file
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={preview.lineItemCount === 0}
                  className={`rounded-lg px-5 py-1.5 text-xs font-semibold transition-all ${
                    preview.lineItemCount === 0
                      ? "border border-border bg-transparent text-muted-foreground cursor-not-allowed"
                      : "bg-primary text-primary-foreground hover:brightness-110"
                  }`}
                >
                  Import {preview.lineItemCount} row
                  {preview.lineItemCount === 1 ? "" : "s"}
                </button>
              </div>
            </>
          )}

          {stage === "submitting" && (
            <div className="flex flex-col items-center gap-3 py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Importing…</p>
            </div>
          )}

          {stage === "done" && (
            <div className="flex flex-col items-center gap-3 py-10">
              <Check className="h-6 w-6 text-emerald-400" />
              <p className="text-sm text-foreground">
                Imported {rowsInserted} row{rowsInserted === 1 ? "" : "s"}
              </p>
            </div>
          )}

          {stage === "error" && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-300">
              {error || "Something went wrong"}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setStage("pick")}
                  className="rounded-lg border border-border bg-transparent px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
                >
                  Try again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewStat({
  icon,
  label,
  subLabel,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  subLabel?: string;
  tone: "ok" | "warn";
}) {
  const borderClass =
    tone === "ok"
      ? "border-emerald-500/30 bg-emerald-500/5"
      : "border-amber-500/30 bg-amber-500/5";
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${borderClass}`}>
      <div className="flex items-start gap-2">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-foreground/90">{label}</p>
          {subLabel && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subLabel}</p>
          )}
        </div>
      </div>
    </div>
  );
}
