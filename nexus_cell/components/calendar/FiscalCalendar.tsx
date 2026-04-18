"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BillDrawer } from "./BillDrawer";
import { fetchBillsForMonth, type Bill } from "@/lib/bill-service";
import { formatCurrency } from "@/lib/utils";

interface FiscalCalendarProps {
  initialBills: Bill[];
  categories: string[];
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function FiscalCalendar({
  initialBills,
  categories,
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

  // Always sync with the currently-viewed month when it changes.
  // (initialBills cover the page's first render; nav updates fetch fresh.)
  useEffect(() => {
    // Only refetch if the visible month differs from today's month that
    // initialBills populated. Cheap guard — we just always refetch on nav.
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

  const formatDateKey = (date: Date): string =>
    date.toISOString().split("T")[0];

  const isToday = (date: Date): boolean =>
    date.toDateString() === new Date().toDateString();

  const isOverdue = (dateStr: string): boolean => {
    const today = new Date().toISOString().split("T")[0];
    return dateStr < today;
  };

  const selectedDayBills = selectedDate
    ? billsByDate[selectedDate] || []
    : [];
  const selectedDayTotal = selectedDate
    ? dailyTotals[selectedDate] || 0
    : 0;

  const pendingCount = filteredBills.filter(
    (b) => b.status === "pending"
  ).length;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between rounded-xl border border-border bg-card/60 p-4"
      >
        <div>
          <p className="text-sm text-muted-foreground">
            {MONTH_NAMES[currentDate.getMonth()]} Cash Outflow
          </p>
          <p className="text-2xl font-bold text-foreground tabular-nums">
            {formatCurrency(monthlyTotal)}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Pending Bills</p>
            <p className="font-semibold text-foreground">{pendingCount}</p>
          </div>
          {selectedCategory && (
            <Badge
              variant="outline"
              className="flex items-center gap-1 border-primary/50 text-primary"
            >
              {selectedCategory}
              <button onClick={() => setSelectedCategory(null)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      </motion.div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousMonth}
            disabled={isLoading}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="min-w-[200px] text-center text-lg font-semibold text-foreground">
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            disabled={isLoading}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            disabled={isLoading}
            className="ml-2"
          >
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={selectedCategory || ""}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="overflow-hidden rounded-xl border border-border bg-card/60"
        >
          <div className="grid grid-cols-7 border-b border-border">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="px-2 py-3 text-center text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map(({ date, isCurrentMonth }, index) => {
              const dateKey = formatDateKey(date);
              const dayBills = billsByDate[dateKey] || [];
              const dayTotal = dailyTotals[dateKey] || 0;
              const intensity = getHeatmapIntensity(dayTotal);
              const today = isToday(date);
              const overdue =
                isCurrentMonth &&
                isOverdue(dateKey) &&
                dayBills.some((b) => b.status === "pending");

              return (
                <button
                  key={index}
                  onClick={() =>
                    dayBills.length > 0 && setSelectedDate(dateKey)
                  }
                  disabled={dayBills.length === 0}
                  style={{ minHeight: "100px" }}
                  className={`
                    relative border-b border-r border-border/50 p-2
                    text-left transition-colors
                    ${!isCurrentMonth ? "opacity-30" : ""}
                    ${
                      dayBills.length > 0
                        ? "cursor-pointer hover:bg-muted/30"
                        : "cursor-default"
                    }
                    ${
                      selectedDate === dateKey
                        ? "ring-2 ring-inset ring-primary"
                        : ""
                    }
                  `}
                >
                  <div
                    className={`
                    mb-1 text-sm font-medium
                    ${
                      !isCurrentMonth
                        ? "text-muted-foreground/50"
                        : "text-muted-foreground"
                    }
                    ${
                      today
                        ? "flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground"
                        : ""
                    }
                  `}
                  >
                    {date.getDate()}
                  </div>

                  {dayTotal > 0 && isCurrentMonth && (
                    <div
                      className={`
                      mt-1 rounded-lg p-1.5
                      ${intensity === 1 ? "bg-amber-500/10" : ""}
                      ${intensity === 2 ? "bg-orange-500/15" : ""}
                      ${intensity === 3 ? "bg-red-500/15" : ""}
                      ${intensity === 4 ? "bg-red-500/25" : ""}
                      ${overdue ? "ring-2 ring-red-500/50" : ""}
                    `}
                    >
                      <div className="mb-1 flex items-center gap-1">
                        {dayBills.some((b) => b.status === "pending") ? (
                          <AlertTriangle className="h-3 w-3 text-amber-400" />
                        ) : (
                          <CheckCircle className="h-3 w-3 text-emerald-400" />
                        )}
                        <div
                          className={`text-xs font-bold ${
                            dayBills.some((b) => b.status === "pending")
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {formatCurrency(dayTotal)}
                        </div>
                      </div>
                      <div
                        className={`text-xs ${
                          intensity <= 2
                            ? "text-amber-500/70"
                            : "text-red-500/70"
                        }`}
                      >
                        {dayBills.length} bill{dayBills.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-end gap-4 text-xs text-muted-foreground">
        <span>Cash Outflow:</span>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-amber-500/20" />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-orange-500/25" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-red-500/30" />
          <span>High</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-amber-400" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-emerald-400" />
          <span>Paid</span>
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
