"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type {
  Brief,
  BriefBlock,
  CashFlowBlockData,
  BillBlockData,
  ProjectsBlockData,
  DecisionsBlockData,
} from "@/lib/brief-service";

interface BriefReaderViewProps {
  brief: Brief;
  liveData: Record<string, unknown>;
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-600 text-white",
  on_hold: "bg-amber-600 text-white",
  completed: "bg-blue-600 text-white",
  archived: "bg-zinc-600 text-white",
};

const priorityColors: Record<string, string> = {
  urgent: "bg-red-600 text-white border-red-600",
  high: "bg-amber-600 text-white border-amber-600",
  normal: "bg-blue-600 text-white border-blue-600",
  low: "border-border text-muted-foreground",
};

export function BriefReaderView({ brief, liveData }: BriefReaderViewProps) {
  const dateFormatted = new Date(
    brief.brief_date + "T00:00:00"
  ).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <article className="space-y-8">
      <header>
        <h1 className="font-serif text-3xl font-bold leading-tight text-foreground sm:text-4xl">
          {brief.title}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {dateFormatted} · Prepared by your team
        </p>
      </header>

      <hr className="border-border" />

      {brief.blocks?.map((block) => (
        <ReaderBlock key={block.id} block={block} liveData={liveData} />
      ))}
    </article>
  );
}

function ReaderBlock({
  block,
  liveData,
}: {
  block: BriefBlock;
  liveData: Record<string, unknown>;
}) {
  if (block.type === "text" || block.type === "document") {
    if (!block.content_html) return null;
    return (
      <section
        className="leading-relaxed text-foreground"
        dangerouslySetInnerHTML={{ __html: block.content_html }}
      />
    );
  }

  if (block.type === "cashflow") {
    const data = liveData.cashflow as CashFlowBlockData | undefined;
    if (!data) return null;
    return (
      <section className="rounded-xl border border-border bg-card/40 p-6">
        <h2 className="font-serif text-lg font-semibold text-foreground">
          Cash Flow — {data.month} {data.year}
        </h2>
        <div className="mt-4 grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Paid Out
            </p>
            <p className="mt-1 text-2xl font-bold text-red-400">
              {formatCurrency(data.cashOut)}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.paidCount} bills
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Pending
            </p>
            <p className="mt-1 text-2xl font-bold text-yellow-400">
              {data.pendingCount}
            </p>
            <p className="text-xs text-muted-foreground">bills remaining</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Net
            </p>
            <p
              className={`mt-1 text-2xl font-bold ${
                data.net < 0 ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {formatCurrency(data.net)}
            </p>
          </div>
        </div>
        {block.commentary && (
          <p className="mt-4 border-t border-border pt-4 text-[15px] leading-relaxed text-muted-foreground italic">
            {block.commentary}
          </p>
        )}
      </section>
    );
  }

  if (block.type === "bills") {
    const daysAhead = (block.config?.days_ahead as number | undefined) ?? 7;
    const dataKey = `bills_${daysAhead}`;
    const data = liveData[dataKey] as BillBlockData | undefined;
    if (!data) return null;
    return (
      <section className="rounded-xl border border-border bg-card/40 p-6">
        <h2 className="font-serif text-lg font-semibold text-foreground">
          Bills Due — Next {daysAhead} Days
        </h2>
        {data.bills.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No bills due in this period.
          </p>
        ) : (
          <>
            <div className="mt-4 divide-y divide-border">
              {data.bills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-[15px] font-medium text-foreground">
                      {bill.vendor}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(
                        bill.due_date + "T00:00:00"
                      ).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                      {bill.category && ` · ${bill.category}`}
                    </p>
                  </div>
                  <p className="text-[15px] font-semibold text-foreground tabular-nums">
                    {formatCurrency(bill.amount)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-border pt-3 text-right">
              <p className="text-sm font-semibold text-foreground">
                Total: {formatCurrency(data.total)}
              </p>
            </div>
          </>
        )}
        {block.commentary && (
          <p className="mt-4 border-t border-border pt-4 text-[15px] leading-relaxed text-muted-foreground italic">
            {block.commentary}
          </p>
        )}
      </section>
    );
  }

  if (block.type === "projects") {
    const data = liveData.projects as ProjectsBlockData | undefined;
    if (!data) return null;

    const filteredProjects =
      block.config?.status && block.config.status !== "all"
        ? data.projects.filter((p) => p.status === block.config.status)
        : data.projects;

    return (
      <section className="rounded-xl border border-border bg-card/40 p-6">
        <h2 className="font-serif text-lg font-semibold text-foreground">
          Projects Snapshot
        </h2>
        {filteredProjects.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No projects to display.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    className={`text-[10px] ${statusColors[p.status] || ""}`}
                  >
                    {p.status.replace("_", " ")}
                  </Badge>
                  <span className="text-[15px] text-foreground">
                    {p.name}
                  </span>
                </div>
                {p.project_type && (
                  <span className="text-sm text-muted-foreground capitalize">
                    {p.project_type}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        {block.commentary && (
          <p className="mt-4 border-t border-border pt-4 text-[15px] leading-relaxed text-muted-foreground italic">
            {block.commentary}
          </p>
        )}
      </section>
    );
  }

  if (block.type === "decisions") {
    const data = liveData.decisions as DecisionsBlockData | undefined;
    if (!data) return null;

    return (
      <section className="rounded-xl border border-border bg-card/40 p-6">
        <h2 className="font-serif text-lg font-semibold text-foreground">
          Pending Decisions ({data.count})
        </h2>
        {data.decisions.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No pending decisions at this time.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {data.decisions.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-[15px] font-medium text-foreground">
                    {d.title}
                  </p>
                  {d.due_date && (
                    <p className="text-xs text-muted-foreground">
                      Due{" "}
                      {new Date(
                        d.due_date + "T00:00:00"
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      priorityColors[d.priority] || ""
                    }`}
                  >
                    {d.priority}
                  </Badge>
                  <Link
                    href="/alerts"
                    className="text-xs text-primary hover:underline"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        {block.commentary && (
          <p className="mt-4 border-t border-border pt-4 text-[15px] leading-relaxed text-muted-foreground italic">
            {block.commentary}
          </p>
        )}
      </section>
    );
  }

  return null;
}
