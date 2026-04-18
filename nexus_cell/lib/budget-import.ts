/**
 * Budget import — Nexus-flavored.
 *
 * Takes a parsed budget spreadsheet and inserts rows into Nexus's flat
 * `budgets` table (one row per line item per import). The monthly
 * breakdown is preserved in budgets.metadata. A budget_versions record
 * is written for each import so EAs/CFOs can audit source + timestamp.
 *
 * Append-only: re-importing does NOT delete prior rows. Operators should
 * delete stale rows by hand or filter by budget_version_id in the UI if
 * they want to show "latest only."
 */

import { createClient } from "@/utils/supabase/client";
import {
  getSheetList,
  parseBudgetSheet,
  type SheetInfo,
  type ParsedLineItem,
  type ParseResult,
} from "./budget-parser";

export interface ImportPreview {
  sheetName: string;
  year: number | null;
  lineItemCount: number;
  categoryCount: number;
  categories: string[];
  totalAnnualBudget: number;
  sampleLineItems: ParsedLineItem[];
  errors: { row: number; message: string }[];
}

export async function readFileAsArrayBuffer(
  file: File
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (result instanceof ArrayBuffer) resolve(result);
      else reject(new Error("Unexpected FileReader result"));
    };
    reader.onerror = () => reject(reader.error || new Error("Read failed"));
    reader.readAsArrayBuffer(file);
  });
}

export async function listSheetsInFile(file: File): Promise<SheetInfo[]> {
  const buffer = await readFileAsArrayBuffer(file);
  return getSheetList(buffer);
}

/**
 * Parse the chosen sheet and return a preview. No DB writes.
 */
export async function buildImportPreview(
  file: File,
  sheetName: string
): Promise<ImportPreview> {
  const buffer = await readFileAsArrayBuffer(file);
  const parsed: ParseResult = parseBudgetSheet(buffer, sheetName);
  return {
    sheetName,
    year: parsed.year,
    lineItemCount: parsed.lineItems.length,
    categoryCount: parsed.categories.length,
    categories: parsed.categories,
    totalAnnualBudget: parsed.totalAnnualBudget,
    sampleLineItems: parsed.lineItems.slice(0, 8),
    errors: parsed.errors,
  };
}

/**
 * Commit the parsed spreadsheet to Supabase:
 *   1. Insert a budget_versions row (source='excel', filename, sheet, period).
 *   2. Insert one `budgets` row per parsed line item.
 *
 * Returns the version id and the number of budget rows created.
 */
export async function commitImport(
  file: File,
  sheetName: string,
  projectId: string,
  organizationId: string
): Promise<{
  success: boolean;
  versionId: string | null;
  rowsInserted: number;
  error: string | null;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      success: false,
      versionId: null,
      rowsInserted: 0,
      error: "Not authenticated",
    };
  }

  const buffer = await readFileAsArrayBuffer(file);
  const parsed = parseBudgetSheet(buffer, sheetName);
  if (parsed.lineItems.length === 0) {
    return {
      success: false,
      versionId: null,
      rowsInserted: 0,
      error: "No line items parsed — check the sheet structure.",
    };
  }

  const period = parsed.year ? String(parsed.year) : null;

  // 1. Create the version record first so we can tag rows if we ever
  //    add a foreign key for deterministic rollback.
  const { data: version, error: versionError } = await supabase
    .from("budget_versions")
    .insert({
      project_id: projectId,
      organization_id: organizationId,
      uploaded_by: user.id,
      source: "excel",
      filename: file.name,
      sheet_name: sheetName,
      period,
      summary: {
        lineItemCount: parsed.lineItems.length,
        categoryCount: parsed.categories.length,
        categories: parsed.categories,
        totalAnnualBudget: parsed.totalAnnualBudget,
        errors: parsed.errors,
      },
    })
    .select()
    .single();

  if (versionError || !version) {
    return {
      success: false,
      versionId: null,
      rowsInserted: 0,
      error: versionError?.message || "Failed to record import version",
    };
  }

  // 2. Insert one `budgets` row per parsed line item. Metadata preserves
  //    the monthly breakdown + line name + version id + is_fixed flag.
  const rowsToInsert = parsed.lineItems.map((item) => ({
    project_id: projectId,
    organization_id: organizationId,
    category: item.category,
    budgeted: item.annual_total,
    actual: 0,
    period,
    notes: item.name,
    metadata: {
      source: "excel",
      version_id: version.id,
      line_name: item.name,
      is_fixed: item.is_fixed,
      monthly: {
        jan: item.jan,
        feb: item.feb,
        mar: item.mar,
        apr: item.apr,
        may: item.may,
        jun: item.jun,
        jul: item.jul,
        aug: item.aug,
        sep: item.sep,
        oct: item.oct,
        nov: item.nov,
        dec: item.dec,
      },
    },
  }));

  const { error: insertError } = await supabase
    .from("budgets")
    .insert(rowsToInsert);

  if (insertError) {
    // Don't orphan the version — remove it so the UI doesn't show a
    // success stamp for a failed import.
    await supabase.from("budget_versions").delete().eq("id", version.id);
    return {
      success: false,
      versionId: null,
      rowsInserted: 0,
      error: insertError.message,
    };
  }

  return {
    success: true,
    versionId: version.id,
    rowsInserted: rowsToInsert.length,
    error: null,
  };
}
