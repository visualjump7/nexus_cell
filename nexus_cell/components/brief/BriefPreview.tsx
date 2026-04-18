"use client";

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

interface BriefPreviewProps {
  brief: Brief;
  liveData: Record<string, unknown>;
  compact?: boolean;
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

export function BriefPreview({ brief, liveData, compact }: BriefPreviewProps) {
  const dateFormatted = new Date(
    brief.brief_date + "T00:00:00"
  ).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      <div>
        <h2
          className={
            compact
              ? "text-lg font-bold text-foreground"
              : "text-2xl font-bold text-foreground font-serif"
          }
        >
          {brief.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {dateFormatted} · Prepared by your team
        </p>
      </div>

      {brief.blocks?.map((block) => (
        <BriefBlockPreview
          key={block.id}
          block={block}
          liveData={liveData}
          compact={compact}
        />
      ))}

      {(!brief.blocks || brief.blocks.length === 0) && (
        <p className="text-sm italic text-muted-foreground">
          No content blocks added yet.
        </p>
      )}
    </div>
  );
}

function BriefBlockPreview({
  block,
  liveData,
}: {
  block: BriefBlock;
  liveData: Record<string, unknown>;
  compact?: boolean;
}) {
  if (block.type === "text" || block.type === "document") {
    if (!block.content_html) return null;
    return (
      <div
        className="text-foreground leading-relaxed"
        dangerouslySetInnerHTML={{ __html: block.content_html }}
      />
    );
  }

  if (block.type === "cashflow") {
    const data = liveData.cashflow as CashFlowBlockData | undefined;
    if (!data) return null;
    return (
      <div className="rounded-lg border border-border bg-card/50 p-4">
        <h3 className="text-sm font-semibold text-foreground">
          Cash Flow — {data.month} {data.year}
        </h3>
        <div className="mt-3 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Paid out</p>
            <p className="text-lg font-bold text-red-400">
              {formatCurrency(data.cashOut)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-lg font-bold text-yellow-400">
              {data.pendingCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Net</p>
            <p
              className={`text-lg font-bold ${
                data.net < 0 ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {formatCurrency(data.net)}
            </p>
          </div>
        </div>
        {block.commentary && (
          <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground italic">
            {block.commentary}
          </p>
        )}
      </div>
    );
  }

  if (block.type === "bills") {
    const daysAhead = (block.config?.days_ahead as number | undefined) ?? 7;
    const dataKey = `bills_${daysAhead}`;
    const data = liveData[dataKey] as BillBlockData | undefined;
    if (!data) return null;
    return (
      <div className="rounded-lg border border-border bg-card/50 p-4">
        <h3 className="text-sm font-semibold text-foreground">
          Bills Due — Next {daysAhead} Days
        </h3>
        {data.bills.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No bills due.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {data.bills.map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <p className="text-foreground">{bill.vendor}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(
                      bill.due_date + "T00:00:00"
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                    {bill.category && ` · ${bill.category}`}
                  </p>
                </div>
                <p className="font-medium text-foreground">
                  {formatCurrency(bill.amount)}
                </p>
              </div>
            ))}
            <div className="border-t border-border pt-2 text-right">
              <p className="text-sm font-semibold text-foreground">
                Total: {formatCurrency(data.total)}
              </p>
            </div>
          </div>
        )}
        {block.commentary && (
          <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground italic">
            {block.commentary}
          </p>
        )}
      </div>
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
      <div className="rounded-lg border border-border bg-card/50 p-4">
        <h3 className="text-sm font-semibold text-foreground">
          Projects Snapshot
        </h3>
        {filteredProjects.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No projects found.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    className={`text-[10px] ${statusColors[p.status] || ""}`}
                  >
                    {p.status.replace("_", " ")}
                  </Badge>
                  <span className="text-foreground">{p.name}</span>
                </div>
                {p.project_type && (
                  <span className="text-xs text-muted-foreground capitalize">
                    {p.project_type}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        {block.commentary && (
          <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground italic">
            {block.commentary}
          </p>
        )}
      </div>
    );
  }

  if (block.type === "decisions") {
    const data = liveData.decisions as DecisionsBlockData | undefined;
    if (!data) return null;

    return (
      <div className="rounded-lg border border-border bg-card/50 p-4">
        <h3 className="text-sm font-semibold text-foreground">
          Pending Decisions ({data.count})
        </h3>
        {data.decisions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No pending decisions.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {data.decisions.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <p className="text-foreground">{d.title}</p>
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
                <Badge
                  variant="outline"
                  className={`text-[10px] ${priorityColors[d.priority] || ""}`}
                >
                  {d.priority}
                </Badge>
              </div>
            ))}
          </div>
        )}
        {block.commentary && (
          <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground italic">
            {block.commentary}
          </p>
        )}
      </div>
    );
  }

  return null;
}
