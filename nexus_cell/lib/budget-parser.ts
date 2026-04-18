import * as XLSX from "xlsx";

// ─── Types ───

export interface ParsedLineItem {
  name: string;
  category: string;
  jan: number;
  feb: number;
  mar: number;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sep: number;
  oct: number;
  nov: number;
  dec: number;
  annual_total: number;
  is_fixed: boolean;
}

export interface SheetInfo {
  name: string;
  year: number | null;
  isScenario: boolean;
}

export interface ParseResult {
  lineItems: ParsedLineItem[];
  categories: string[];
  sheetName: string;
  year: number | null;
  totalAnnualBudget: number;
  errors: { row: number; message: string }[];
}

// ─── Helpers ───

function parseValue(cell: unknown): number {
  if (cell === null || cell === undefined || cell === "") return 0;
  if (typeof cell === "number") return cell;
  if (typeof cell === "string") {
    const trimmed = cell.trim();
    if (trimmed === "" || trimmed.toUpperCase() === "TBD" || trimmed === "-")
      return 0;
    const cleaned = trimmed
      .replace(/[$,]/g, "")
      .replace(/^\((.+)\)$/, "-$1");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

function isFixedCost(months: number[]): boolean {
  const nonZero = months.filter((v) => v > 0);
  if (nonZero.length < 2) return false;
  const avg = nonZero.reduce((a, b) => a + b, 0) / nonZero.length;
  if (avg === 0) return false;
  return nonZero.every((v) => Math.abs(v - avg) / avg < 0.05);
}

function extractYear(name: string): number | null {
  const match = name.match(/\b(20\d{2})\b/);
  return match ? parseInt(match[1]) : null;
}

const SKIP_NAMES = new Set([
  "account description",
  "total",
  "net aircraft revenue",
  "net variable charter expenses",
  "net charter margin",
  "charter margin per hour",
  "fixed expenses",
  "variable expenses",
  "grand total",
  "total fixed expenses",
  "total variable expenses",
]);

function shouldSkipRow(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (SKIP_NAMES.has(lower)) return true;
  if (lower.startsWith("total")) return true;
  if (lower.startsWith("net ")) return true;
  return false;
}

function cellText(row: unknown[], colIndex: number): string {
  const val = row[colIndex];
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

function hasNumericData(
  row: unknown[],
  startCol: number,
  endCol: number
): boolean {
  for (let i = startCol; i <= endCol; i++) {
    const val = row[i];
    if (typeof val === "number" && val !== 0) return true;
    if (typeof val === "string") {
      const num = parseValue(val);
      if (num !== 0) return true;
    }
  }
  return false;
}

// ─── Exported Functions ───

export function getSheetList(buffer: ArrayBuffer): SheetInfo[] {
  const wb = XLSX.read(buffer, { type: "array" });
  return wb.SheetNames.map((name) => {
    const year = extractYear(name);
    const isBudgetYear = /^\d{4}\s+budget$/i.test(name.trim());
    return { name, year, isScenario: !isBudgetYear };
  });
}

export function parseBudgetSheet(
  buffer: ArrayBuffer,
  sheetName: string
): ParseResult {
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[sheetName];
  if (!ws) {
    return {
      lineItems: [],
      categories: [],
      sheetName,
      year: null,
      totalAnnualBudget: 0,
      errors: [{ row: 0, message: `Sheet "${sheetName}" not found` }],
    };
  }

  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: "",
  });

  if (rows.length === 0) {
    return {
      lineItems: [],
      categories: [],
      sheetName,
      year: null,
      totalAnnualBudget: 0,
      errors: [{ row: 0, message: "Sheet is empty" }],
    };
  }

  const year = extractYear(sheetName);
  const lineItems: ParsedLineItem[] = [];
  const categoriesOrdered: string[] = [];
  const errors: { row: number; message: string }[] = [];
  let currentCategory = "General";

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const colA = cellText(row, 0);
    const colC = cellText(row, 2);

    if (colA && !colC) {
      const lower = colA.toLowerCase();
      if (lower.includes("variable expenses")) {
        currentCategory = "Variable Expenses";
        if (!categoriesOrdered.includes(currentCategory))
          categoriesOrdered.push(currentCategory);
      }
      continue;
    }

    if (!colC) continue;

    if (shouldSkipRow(colC)) continue;

    const monthsHaveData = hasNumericData(row, 4, 15);
    const totalVal = parseValue(row[16]);
    const totalHasData = totalVal !== 0;

    if (!monthsHaveData && !totalHasData) {
      // Category header row
      currentCategory = colC;
      if (!categoriesOrdered.includes(currentCategory))
        categoriesOrdered.push(currentCategory);
      continue;
    }

    const monthValues = [
      parseValue(row[4]),
      parseValue(row[5]),
      parseValue(row[6]),
      parseValue(row[7]),
      parseValue(row[8]),
      parseValue(row[9]),
      parseValue(row[10]),
      parseValue(row[11]),
      parseValue(row[12]),
      parseValue(row[13]),
      parseValue(row[14]),
      parseValue(row[15]),
    ];

    const computedSum = monthValues.reduce((a, b) => a + b, 0);
    const totalCol = parseValue(row[16]);
    const annualTotal = totalCol !== 0 ? totalCol : computedSum;

    if (computedSum === 0 && totalCol === 0) continue;

    lineItems.push({
      name: colC,
      category: currentCategory,
      jan: monthValues[0],
      feb: monthValues[1],
      mar: monthValues[2],
      apr: monthValues[3],
      may: monthValues[4],
      jun: monthValues[5],
      jul: monthValues[6],
      aug: monthValues[7],
      sep: monthValues[8],
      oct: monthValues[9],
      nov: monthValues[10],
      dec: monthValues[11],
      annual_total: annualTotal,
      is_fixed: isFixedCost(monthValues),
    });
  }

  const totalAnnualBudget = lineItems.reduce(
    (s, li) => s + li.annual_total,
    0
  );

  return {
    lineItems,
    categories: categoriesOrdered,
    sheetName,
    year,
    totalAnnualBudget,
    errors,
  };
}

export function validateBudgetFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const validExtensions = [".xlsx", ".xls", ".csv"];
  const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
  if (!validExtensions.includes(ext)) {
    return {
      valid: false,
      error: "Please upload a valid Excel file (.xlsx, .xls) or CSV file",
    };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: "File size must be less than 10MB" };
  }
  return { valid: true };
}
