"use client";

import { useState, useMemo, useCallback } from "react";
import { BillDrawer } from "./BillDrawer";
import { fetchBillsForMonth, type Bill } from "@/lib/bill-service";
import { cn } from "@/lib/utils";
import {
  RpButton,
  RpSelect,
  RpLoading,
  ChevronLeft,
  ChevronRight,
  RP_ICON,
  fmtMoney,
  fmtDate,
  dot,
} from "@/components/rp";

interface FiscalCalendarProps {
  initialBills: Bill[];
  categories: string[];
  /** "Cash outflow" eyebrow over the month figure; off when a section head already says it. */
  eyebrow?: boolean;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Gold wash by the day's share of the busiest day (replaces the amber/orange/red ramp). */
const HEAT = ["", "rgba(205,161,75,.05)", "rgba(205,161,75,.10)", "rgba(205,161,75,.16)", "rgba(205,161,75,.24)"];
const GOLD = "#CDA14B";
const LINE3 = "#3A3E42";

const UNPAID = new Set<Bill["status"]>(["pending", "approved", "overdue"]);

/** Local calendar date → YYYY-MM-DD (matches the bills' date-only due_date). */
function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function FiscalCalendar({
  initialBills,
  categories,
  eyebrow = true,
}: FiscalCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [bills, setBills] = useState<Bill[]>(initialBills);
  const [isLoading, setIsLoading] = useState(false);

  const filteredBills = useMemo(() => {
    if (!selectedCategory) return bills;
    return bills.filter((b) => b.category === selectedCategory);
  }, [bills, selectedCategory]);

  const billsByDate = useMemo(() => {
    const grouped: Record<string, Bill[]> = {};
    filteredBills.forEach((bill) => {
      if (!bill.due_date) return;
      if (!grouped[bill.due_date]) grouped[bill.due_date] = [];
      grouped[bill.due_date].push(bill);
    });
    return grouped;
  }, [filteredBills]);

  const dailyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    Object.entries(billsByDate).forEach(([date, dateBills]) => {
      totals[date] = dateBills.reduce(
        (sum, b) => sum + Number(b.amount || 0),
        0
      );
    });
    return totals;
  }, [billsByDate]);

  const maxDailyTotal = useMemo(() => {
    const values = Object.values(dailyTotals);
    return values.length > 0 ? Math.max(...values) : 0;
  }, [dailyTotals]);

  const monthlyTotal = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return filteredBills
      .filter((b) => {
        if (!b.due_date) return false;
        const d = new Date(b.due_date + "T00:00:00");
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, b) => sum + Number(b.amount || 0), 0);
  }, [filteredBills, currentDate]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i), isCurrentMonth: false });
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const endPadding = 6 - lastDay.getDay();
    for (let i = 1; i <= endPadding; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
    return days;
  }, [currentDate]);

  const loadBills = useCallback(async (date: Date) => {
    setIsLoading(true);
    try {
      const data = await fetchBillsForMonth(
        date.getFullYear(),
        date.getMonth() + 1
      );
      setBills(data);
    } catch (error) {
      console.error("Failed to fetch bills:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const goToPreviousMonth = async () => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    setCurrentDate(newDate);
    await loadBills(newDate);
  };

  const goToNextMonth = async () => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1
    );
    setCurrentDate(newDate);
    await loadBills(newDate);
  };

  const goToToday = async () => {
    const today = new Date();
    setCurrentDate(today);
    await loadBills(today);
  };

  const getHeatmapIntensity = (total: number): number => {
    if (total === 0 || maxDailyTotal === 0) return 0;
    const ratio = total / maxDailyTotal;
    if (ratio < 0.25) return 1;
    if (ratio < 0.5) return 2;
    if (ratio < 0.75) return 3;
    return 4;
  };

  const todayKey = formatDateKey(new Date());

  const selectedDayBills = selectedDate
    ? billsByDate[selectedDate] || []
    : [];
  const selectedDayTotal = selectedDate
    ? dailyTotals[selectedDate] || 0
    : 0;

  const pendingCount = filteredBills.filter(
    (b) => b.status === "pending"
  ).length;
  const paidCount = filteredBills.filter(
    (b) => b.status === "paid"
  ).length;

  const monthName = MONTH_NAMES[currentDate.getMonth()];

  return (
    <div className="flex flex-col gap-5">
      {/* Header: the month's outflow, month navigation, category filter */}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div className="flex min-w-0 flex-col gap-2">
          {eyebrow && <span className="rp-eyebrow--muted">Cash outflow</span>}
          <span className="font-display text-[32px] font-medium uppercase leading-none tracking-[.01em] tabular-nums text-rp-text">
            {monthName} · {fmtMoney(monthlyTotal, { compact: true })}
          </span>
          <span className="text-[13px] text-rp-muted">
            {dot(`${pendingCount} pending`, `${paidCount} paid`, selectedCategory)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="flex items-center gap-2">
            <RpButton
              variant="icon"
              aria-label="Previous month"
              onClick={goToPreviousMonth}
              disabled={isLoading}
            >
              <ChevronLeft size={RP_ICON.size} strokeWidth={RP_ICON.strokeWidth} aria-hidden />
            </RpButton>
            <h3
              className="min-w-[150px] text-center font-display text-lg font-normal uppercase tracking-[.06em] text-rp-text"
              aria-live="polite"
            >
              {monthName} {currentDate.getFullYear()}
            </h3>
            <RpButton
              variant="icon"
              aria-label="Next month"
              onClick={goToNextMonth}
              disabled={isLoading}
            >
              <ChevronRight size={RP_ICON.size} strokeWidth={RP_ICON.strokeWidth} aria-hidden />
            </RpButton>
            <RpButton
              variant="ghost"
              size="sm"
              onClick={goToToday}
              disabled={isLoading}
              className="ml-1"
            >
              Today
            </RpButton>
          </div>

          <RpSelect
            aria-label="Filter by category"
            value={selectedCategory || ""}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="w-[220px] max-w-full"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </RpSelect>
        </div>
      </div>

      {isLoading ? (
        <RpLoading label={`Loading ${monthName}`} className="h-[320px]" />
      ) : (
        <div className="rp-ruled grid-cols-7" role="group" aria-label={`${monthName} ${currentDate.getFullYear()} bills by due date`}>
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              aria-hidden
              className="px-1.5 py-2.5 font-display text-[11px] uppercase tracking-[.16em] text-rp-dim sm:px-2.5"
            >
              <span className="sm:hidden">{day.slice(0, 1)}</span>
              <span className="hidden sm:inline">{day}</span>
            </div>
          ))}

          {calendarDays.map(({ date, isCurrentMonth }, index) => {
            const dateKey = formatDateKey(date);
            const dayBills = billsByDate[dateKey] || [];
            const dayTotal = dailyTotals[dateKey] || 0;
            const intensity = isCurrentMonth ? getHeatmapIntensity(dayTotal) : 0;
            const today = dateKey === todayKey;
            const selected = selectedDate === dateKey;
            const has = dayBills.length > 0;
            const show = has && isCurrentMonth;
            const hasPending = dayBills.some((b) => b.status === "pending");
            const unpaid = dayBills.some((b) => UNPAID.has(b.status));
            const paidOnly = has && dayBills.every((b) => b.status === "paid" || b.status === "rejected");
            const pastDue = isCurrentMonth && dateKey < todayKey && unpaid;

            // One square per cell; the colour carries the state on phones where the text is hidden.
            const square = pastDue ? "bg-rp-alert" : hasPending ? "bg-rp-gold" : paidOnly ? "bg-rp-green" : unpaid ? "bg-rp-gold" : "";

            const edges = [
              today ? `inset 0 2px 0 ${GOLD}` : "",
              selected ? `inset 0 0 0 1px ${LINE3}` : "",
            ].filter(Boolean).join(", ");

            return (
              <button
                key={index}
                type="button"
                onClick={() => has && setSelectedDate(dateKey)}
                disabled={!has}
                aria-label={
                  has
                    ? `${fmtDate(dateKey, "weekday")} · ${dayBills.length} bill${dayBills.length !== 1 ? "s" : ""} · ${fmtMoney(dayTotal)}`
                    : fmtDate(dateKey, "weekday")
                }
                aria-current={today ? "date" : undefined}
                style={{
                  backgroundImage: intensity ? `linear-gradient(${HEAT[intensity]}, ${HEAT[intensity]})` : undefined,
                  boxShadow: edges || undefined,
                }}
                className={cn(
                  "relative flex min-h-[56px] flex-col gap-1 p-1.5 text-left transition-colors duration-200 sm:min-h-[88px] sm:p-2.5",
                  has ? "cursor-pointer hover:!bg-rp-surface" : "cursor-default",
                  selected && "!bg-rp-surface",
                  !isCurrentMonth && "opacity-40"
                )}
              >
                <span className="flex items-center justify-between gap-1">
                  <span
                    className={cn(
                      "font-display text-xs tabular-nums tracking-[.06em]",
                      today ? "text-rp-gold" : "text-rp-dim"
                    )}
                  >
                    {date.getDate()}
                  </span>
                  {show && square && (
                    <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0", square, !hasPending && "sm:hidden")} />
                  )}
                </span>

                {show && dayTotal > 0 && (
                  <>
                    <span className="hidden font-display text-[13px] tracking-[.02em] tabular-nums text-rp-text sm:block">
                      {fmtMoney(dayTotal, { compact: true })}
                    </span>
                    <span
                      className={cn(
                        "hidden font-display text-[10px] uppercase tracking-[.14em] sm:block",
                        pastDue ? "text-rp-alert" : paidOnly ? "text-rp-green" : "text-rp-dim"
                      )}
                    >
                      {pastDue ? "Due" : paidOnly ? "Paid" : `${dayBills.length} bill${dayBills.length !== 1 ? "s" : ""}`}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Key */}
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-rp-line pt-4 text-xs text-rp-muted">
        <div className="flex items-center gap-3">
          <span className="rp-eyebrow--muted">Daily outflow</span>
          <span className="text-rp-dim">Less</span>
          <span className="flex" aria-hidden>
            {HEAT.slice(1).map((c) => (
              <span
                key={c}
                className="-ml-px h-3 w-5 border border-rp-line first:ml-0"
                style={{ backgroundImage: `linear-gradient(${c}, ${c})` }}
              />
            ))}
          </span>
          <span className="text-rp-dim">More</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-display text-[11px] uppercase tracking-[.14em]">
          <span className="flex items-center gap-2">
            <span aria-hidden className="h-1.5 w-1.5 bg-rp-gold" />
            Pending
          </span>
          <span className="text-rp-dim" aria-hidden>·</span>
          <span className="flex items-center gap-2 text-rp-green">
            <span aria-hidden className="h-1.5 w-1.5 bg-rp-green sm:hidden" />
            Paid
          </span>
          <span className="text-rp-dim" aria-hidden>·</span>
          <span className="flex items-center gap-2 text-rp-alert">
            <span aria-hidden className="h-1.5 w-1.5 bg-rp-alert sm:hidden" />
            Past due
          </span>
        </div>
      </div>

      <BillDrawer
        isOpen={selectedDate !== null}
        onClose={() => setSelectedDate(null)}
        date={selectedDate}
        bills={selectedDayBills}
        total={selectedDayTotal}
        onBillUpdated={() => loadBills(currentDate)}
      />
    </div>
  );
}
