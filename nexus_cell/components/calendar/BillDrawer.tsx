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
  const gold = "bg-[#CDA14B]/15 text-[#E0BF7B] border-[#CDA14B]/30";
  const blue = "bg-[#3989CB]/15 text-[#7FB3DE] border-[#3989CB]/30";
  const green = "bg-[#A4CC5C]/15 text-[#A4CC5C] border-[#A4CC5C]/30";
  const steel = "bg-[#9AA0A4]/10 text-[#9AA0A4] border-[#9AA0A4]/25";
  const colors: Record<string, string> = {
    "Site Work": gold,
    "Track & Paddock": gold,
    Garages: gold,
    Clubhouse: blue,
    Homes: blue,
    "Design & Engineering": blue,
    Permits: green,
    Insurance: green,
    Legal: green,
    Utilities: steel,
    Marketing: steel,
    Merchandise: steel,
    Travel: steel,
    Membership: steel,
    Taxes: "bg-red-500/15 text-red-400 border-red-500/30",
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
            className="fixed inset-0 z-40 bg-[rgba(8,9,10,.85)] backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-hidden rounded-t-sm border-t border-[#26292C] bg-[#0E0F11] shadow-2xl"
          >
            <div className="flex justify-center py-2">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="flex items-center justify-between border-b border-border px-6 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="rp-eyebrow">
                    {formatDate(date)}
                  </h3>
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <span className="rp-stat-value">
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
                    className="rounded-sm border border-[#1F1F1F] bg-[#141618] p-4 transition-colors hover:border-[#26292C]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground">
                            {bill.vendor}
                          </h4>
                          {bill.status === "paid" && (
                            <CheckCircle className="h-4 w-4 text-[#A4CC5C]" />
                          )}
                          {bill.quickbooks_synced && (
                            <Badge
                              variant="outline"
                              className="border-[#3989CB]/50 text-[#3989CB] text-[10px]"
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
