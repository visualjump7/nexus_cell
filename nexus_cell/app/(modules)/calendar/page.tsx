"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { FiscalCalendar } from "@/components/calendar/FiscalCalendar";
import {
  fetchBillsForMonth,
  fetchBillCategories,
  type Bill,
} from "@/lib/bill-service";

export default function CalendarPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const now = new Date();
      const [initialBills, cats] = await Promise.all([
        fetchBillsForMonth(now.getFullYear(), now.getMonth() + 1),
        fetchBillCategories(),
      ]);
      setBills(initialBills);
      setCategories(cats);
      setIsLoading(false);
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bill Calendar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monthly view of bills by due date. Tap a day to see detail.
        </p>
      </div>
      <FiscalCalendar initialBills={bills} categories={categories} />
    </div>
  );
}
