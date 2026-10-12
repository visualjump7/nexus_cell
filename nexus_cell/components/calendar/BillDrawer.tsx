"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { updateBillStatus, type Bill } from "@/lib/bill-service";
import {
  RpList,
  RpRow,
  RpStatus,
  RpTag,
  RpButton,
  Check,
  RP_ICON,
  fmtMoney,
  fmtDate,
  dot,
  pushEscapeLayer,
} from "@/components/rp";

interface BillDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  date: string | null;
  bills: Bill[];
  total: number;
  onBillUpdated?: () => void;
}

function localTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * The day's bills. Right sheet at ≥1024px, bottom sheet below. Square, on the
 * page ground, no blur. Esc closes (layered), focus moves to Close and returns
 * to the day cell on close.
 */
export function BillDrawer({
  isOpen,
  onClose,
  date,
  bills,
  total,
  onBillUpdated,
}: BillDrawerProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();

  const open = isOpen && !!date;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => closeRef.current?.focus(), 0);
    const pop = pushEscapeLayer(() => onCloseRef.current());
    return () => {
      window.clearTimeout(t);
      pop();
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [open]);

  const handleMarkPaid = async (billId: string) => {
    setUpdatingId(billId);
    const success = await updateBillStatus(billId, "paid");
    if (success && onBillUpdated) {
      onBillUpdated();
    }
    setUpdatingId(null);
  };

  if (!mounted || !open || !date) return null;

  const pastDate = date < localTodayKey();
  const unpaid = bills.some((b) => b.status === "pending" || b.status === "approved" || b.status === "overdue");
  const isOverdue = pastDate && unpaid;
  const currencies = Array.from(new Set(bills.map((b) => b.currency || "USD")));
  const totalCurrency = currencies.length === 1 ? currencies[0] : "USD";

  return createPortal(
    <div className="fixed inset-0 z-[55]">
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(8,9,10,.85)] animate-overlay-fade-in"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col border-t border-rp-line2 bg-rp-bg text-rp-text animate-overlay-pop-in lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[min(420px,100vw)] lg:border-l lg:border-t-0 lg:animate-sheet-slide-in"
      >
        <header className="flex flex-col gap-3 border-b border-rp-line px-6 pb-5 pt-6">
          <div className="flex items-start justify-between gap-4">
            <h3 id={titleId} className="rp-eyebrow pt-2">
              {fmtDate(date, "weekday")}
            </h3>
            <button ref={closeRef} type="button" onClick={onClose} className="rp-btn-ghost shrink-0">
              Close
            </button>
          </div>
          <span className="font-display text-[32px] font-medium leading-none tracking-[.01em] tabular-nums">
            {fmtMoney(total, { currency: totalCurrency })}
          </span>
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-rp-muted">
            <span>{dot(`${bills.length} bill${bills.length !== 1 ? "s" : ""}`, fmtDate(date, "medium"))}</span>
            {isOverdue && <RpTag tone="alert">Past due</RpTag>}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          <RpList className="border-t-0">
            {bills.map((bill) => (
              <RpRow
                key={bill.id}
                title={bill.vendor}
                meta={
                  <span className="flex flex-col gap-2">
                    {(bill.category || bill.description) && (
                      <span>{dot(bill.category, bill.description)}</span>
                    )}
                    {bill.notes && <span className="text-xs text-rp-dim">{bill.notes}</span>}
                    <span className="flex flex-wrap items-center gap-2">
                      <RpStatus kind="bill" value={bill.status} />
                      <RpTag tone={bill.quickbooks_synced ? "green" : "dim"}>
                        {bill.quickbooks_synced ? "QuickBooks synced" : "Not synced"}
                      </RpTag>
                    </span>
                  </span>
                }
                aside={
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={
                        bill.status === "paid"
                          ? "font-display text-[15px] tracking-[.02em] tabular-nums text-rp-dim line-through"
                          : "font-display text-[15px] tracking-[.02em] tabular-nums text-rp-text"
                      }
                    >
                      {fmtMoney(bill.amount, { currency: bill.currency })}
                    </span>
                    {bill.status === "pending" && (
                      <RpButton
                        variant="text"
                        size="sm"
                        icon={<Check size={14} strokeWidth={RP_ICON.strokeWidth} aria-hidden />}
                        onClick={() => handleMarkPaid(bill.id)}
                        disabled={updatingId === bill.id}
                      >
                        {updatingId === bill.id ? "Saving" : "Mark paid"}
                      </RpButton>
                    )}
                  </div>
                }
              />
            ))}
          </RpList>
        </div>

        <footer className="flex items-center justify-between gap-4 border-t border-rp-line px-6 py-4">
          <span className="text-xs text-rp-dim">Due on this day</span>
          <Link href="/financial" className="rp-link font-display text-xs uppercase tracking-[.14em]">
            All payables <span aria-hidden>→</span>
          </Link>
        </footer>
      </aside>
    </div>,
    document.body
  );
}
