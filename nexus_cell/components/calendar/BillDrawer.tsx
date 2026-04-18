"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { updateBillStatus, type Bill } from "@/lib/bill-service";

interface BillDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  date: string | null;
  bills: Bill[];
  total: number;
  onBillUpdated?: () => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getCategoryColor(category: string | null): string {
  if (!category) return "bg-muted text-muted-foreground border-border";
  const colors: Record<string, string> = {
    Mortgage: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Insurance: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    Fuel: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    Payroll: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    Maintenance: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    Taxes: "bg-red-500/20 text-red-400 border-red-500/30",
    Aviation: "bg-sky-500/20 text-sky-400 border-sky-500/30",
    Lease: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    Utilities: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "Credit Card": "bg-pink-500/20 text-pink-400 border-pink-500/30",
    Professional: "bg-teal-500/20 text-teal-400 border-teal-500/30",
    HOA: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    Moorage: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  return (
    colors[category] || "bg-muted text-muted-foreground border-border"
  );
}

export function BillDrawer({
  isOpen,
  onClose,
  date,
  bills,
  total,
  onBillUpdated,
}: BillDrawerProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleMarkPaid = async (billId: string) => {
    setUpdatingId(billId);
    const success = await updateBillStatus(billId, "paid");
    if (success && onBillUpdated) {
      onBillUpdated();
    }
    setUpdatingId(null);
  };

  const isOverdue = date
    ? date < new Date().toISOString().split("T")[0]
    : false;

  return (
    <AnimatePresence>
      {isOpen && date && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-hidden rounded-t-2xl border-t border-border bg-card shadow-2xl"
          >
            <div className="flex justify-center py-2">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="flex items-center justify-between border-b border-border px-6 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">
                    {formatDate(date)}
                  </h3>
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-2xl font-bold text-foreground tabular-nums">
                    {formatCurrency(total)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {bills.length} bill{bills.length !== 1 ? "s" : ""}
                  </span>
                  {isOverdue && (
                    <Badge
                      variant="outline"
                      className="border-red-500/50 text-red-400"
                    >
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Overdue
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
              <div className="space-y-3">
                {bills.map((bill) => (
                  <motion.div
                    key={bill.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-xl border border-border bg-background/50 p-4 transition-colors hover:bg-muted/20"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground">
                            {bill.vendor}
                          </h4>
                          {bill.status === "paid" && (
                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                          )}
                          {bill.quickbooks_synced && (
                            <Badge
                              variant="outline"
                              className="border-blue-500/50 text-blue-400 text-[10px]"
                            >
                              QB
                            </Badge>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {bill.category && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${getCategoryColor(bill.category)}`}
                            >
                              {bill.category}
                            </Badge>
                          )}
                          {bill.description && (
                            <span className="text-xs text-muted-foreground">
                              {bill.description}
                            </span>
                          )}
                        </div>

                        {bill.notes && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            {bill.notes}
                          </p>
                        )}
                      </div>

                      <div className="ml-4 text-right">
                        <p
                          className={`text-lg font-bold tabular-nums ${
                            bill.status === "paid"
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                          }`}
                        >
                          {formatCurrency(bill.amount)}
                        </p>

                        {bill.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1 text-xs text-emerald-400 hover:text-emerald-300"
                            onClick={() => handleMarkPaid(bill.id)}
                            disabled={updatingId === bill.id}
                          >
                            {updatingId === bill.id ? (
                              <Clock className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="mr-1 h-3 w-3" />
                            )}
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
