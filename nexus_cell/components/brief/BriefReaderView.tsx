"use client";

import { BRAND } from "@/lib/brand";
import { SECTION_HERO } from "@/lib/project-imagery";
import { sectionEyebrow } from "@/lib/sections";
import {
  RpPageHeader,
  RpSubhead,
  RpStatStrip,
  RpStat,
  RpTable,
  RpList,
  RpRow,
  RpStatus,
  RpFilm,
  fmtMoney,
  fmtDate,
  dot,
  pad2,
  statusLabel,
} from "@/components/rp";
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
  /** Owner's name for the cover meta ("Prepared for …"), when known. */
  principalName?: string;
  /** Back link above the eyebrow (e.g. to /brief). */
  back?: { href: string; label: string };
}

/**
 * The owner's brief, read like a printed Roaring Pines brief: page header,
 * a film-still cover, numbered sections on ruled heads, and a colophon.
 * Render inside <RpPage>.
 */
export function BriefReaderView({ brief, liveData, principalName, back }: BriefReaderViewProps) {
  const { issue, rest } = splitBriefTitle(brief.title);
  return (
    <>
      <RpPageHeader
        back={back}
        eyebrow={sectionEyebrow("brief")}
        tags={<RpStatus kind="brief" value={brief.status} />}
        title={issue}
        line={brief.cover_subtitle || undefined}
        spec={dot(rest, brief.published_at && `Published ${fmtDate(brief.published_at, "medium")}`)}
      />
      <div className="grid items-start gap-[var(--rp-gap)] xl:grid-cols-[minmax(0,760px)_minmax(200px,260px)] xl:gap-14">
        <article className="flex w-full min-w-0 max-w-[760px] flex-col gap-[var(--rp-gap)]">
          <BriefCover brief={brief} principalName={principalName} />
          <BriefBody brief={brief} liveData={liveData} />
          <BriefColophon brief={brief} />
        </article>
        <BriefContents brief={brief} liveData={liveData} />
      </div>
    </>
  );
}

/** "In this brief": a sticky contents rail beside the reader at ≥1280px. */
function BriefContents({ brief, liveData }: { brief: Brief; liveData: Record<string, unknown> }) {
  const entries = briefEntries(brief, liveData);
  if (entries.length === 0) return null;
  return (
    <aside className="hidden self-stretch xl:block">
      <nav aria-label="In this brief" className="sticky top-6 flex flex-col gap-4 border-t border-rp-line pt-5">
        <span className="rp-eyebrow--muted">In this brief</span>
        <ol className="m-0 flex list-none flex-col p-0">
          {entries.map((e) => (
            <li key={e.block.id}>
              <a
                href={`#${sectionId(e.block)}`}
                className="flex items-baseline gap-3 border-b border-rp-line py-2.5 font-display text-[13px] uppercase tracking-[.1em] text-rp-muted transition-colors hover:text-rp-text"
              >
                <span className="tabular-nums text-rp-gold">{pad2(e.num)}</span>
                <span className="min-w-0">{e.title}</span>
              </a>
            </li>
          ))}
        </ol>
        <span className="text-[12px] text-rp-dim">
          {dot(`${entries.length} sections`, fmtDate(brief.brief_date, "medium"))}
        </span>
      </nav>
    </aside>
  );
}

// ── Shared pieces (also used by the editor's live preview) ──────────────────

/** 'Owner Brief No. 35 — 22 Sep 2026' → { issue: 'Owner Brief No. 35', rest: '22 Sep 2026' }. */
export function splitBriefTitle(title: string): { issue: string; rest: string | null } {
  const m = (title || "").match(/^(.*?)\s+[—–]\s+(.*)$/);
  if (!m) return { issue: title || "Brief", rest: null };
  return { issue: m[1], rest: m[2] };
}

export function BriefCover({
  brief,
  principalName,
  compact,
}: {
  brief: Brief;
  principalName?: string;
  compact?: boolean;
}) {
  const showDate = brief.cover_show_date !== false;
  const showPrincipal = brief.cover_show_principal !== false && !!principalName;
  return (
    <RpFilm
      {...SECTION_HERO.brief}
      aspect={compact ? "banner" : "film"}
      caption={undefined}
      line={brief.cover_title || brief.title}
      meta={dot(
        "Owner's brief",
        showDate && fmtDate(brief.brief_date, "long"),
        showPrincipal && `Prepared for ${principalName}`,
      )}
      className={compact ? "[&_.rp-film-line]:text-[26px] [&_.rp-film-meta]:text-[11px] [&_.rp-film-overlay]:p-4" : undefined}
    />
  );
}

export function BriefBody({
  brief,
  liveData,
  compact,
}: {
  brief: Brief;
  liveData: Record<string, unknown>;
  compact?: boolean;
}) {
  const entries = briefEntries(brief, liveData);
  if (entries.length === 0) {
    return (
      <p className="text-[15px] text-rp-muted">Nothing in this brief yet.</p>
    );
  }
  return (
    <div className="flex flex-col gap-[var(--rp-gap)]">
      {entries.map((e) => (
        <div key={e.block.id}>{renderBlock(e.block, liveData, e.num, e.title, compact)}</div>
      ))}
    </div>
  );
}

export function BriefColophon({ brief }: { brief: Brief }) {
  return (
    <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-rp-line pt-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BRAND.badge} alt="" aria-hidden className="h-8 w-auto opacity-80" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="font-display text-[11px] uppercase tracking-[.2em] text-rp-muted">
          {BRAND.fullName}
        </span>
        <span className="text-[12px] text-rp-dim">
          {dot("Prepared by the owner's rep team", fmtDate(brief.brief_date, "medium"), "Private · not for distribution")}
        </span>
      </div>
    </footer>
  );
}

// ── Blocks ─────────────────────────────────────────────────────────────────

const BLOCK_TITLE: Record<BriefBlock["type"], string> = {
  text: "Note",
  document: "Document",
  cashflow: "Cash",
  bills: "Bills due",
  projects: "Projects",
  decisions: "Decisions",
};

function blockRenders(block: BriefBlock, liveData: Record<string, unknown>): boolean {
  if (block.type === "text" || block.type === "document") return !!block.content_html;
  if (block.type === "cashflow") return !!liveData.cashflow;
  if (block.type === "bills") {
    const daysAhead = (block.config?.days_ahead as number | undefined) ?? 7;
    return !!liveData[`bills_${daysAhead}`];
  }
  if (block.type === "projects") return !!liveData.projects;
  if (block.type === "decisions") return !!liveData.decisions;
  return false;
}

function blockTitle(block: BriefBlock): string {
  if ((block.type === "text" || block.type === "document") && block.content_html) {
    return splitLeadHeading(block.content_html).heading || BLOCK_TITLE[block.type];
  }
  return BLOCK_TITLE[block.type] ?? block.type;
}

const sectionId = (block: BriefBlock) => `brief-${block.id}`;

/** The blocks that render, numbered in order, with their section titles. */
function briefEntries(brief: Brief, liveData: Record<string, unknown>) {
  return (brief.blocks || [])
    .filter((b) => blockRenders(b, liveData))
    .map((block, i) => ({ block, num: i + 1, title: blockTitle(block) }));
}

/** Pull a leading <h1–h3> out of rich text so it can head the section. */
export function splitLeadHeading(html: string): { heading: string | null; body: string } {
  const m = html.match(/^\s*<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
  if (!m) return { heading: null, body: html };
  const heading = m[1]
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
  return { heading: heading || null, body: html.slice(m[0].length) };
}

function Commentary({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div className="rp-prose rp-prose--muted">
      <p className="whitespace-pre-line">{text}</p>
    </div>
  );
}

function Section({
  id,
  num,
  title,
  spec,
  children,
}: {
  id: string;
  num: number;
  title: string;
  spec?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5">
      <RpSubhead id={id} size="md" num={pad2(num)} title={title} spec={spec} />
      {children}
    </section>
  );
}

function renderBlock(
  block: BriefBlock,
  liveData: Record<string, unknown>,
  num: number,
  title: string,
  compact?: boolean,
): React.ReactNode {
  const id = sectionId(block);
  if (block.type === "text" || block.type === "document") {
    if (!block.content_html) return null;
    const { body } = splitLeadHeading(block.content_html);
    return (
      <Section id={id} num={num} title={title}>
        {body.trim() && (
          <div className="rp-prose" dangerouslySetInnerHTML={{ __html: body }} />
        )}
        <Commentary text={block.commentary} />
      </Section>
    );
  }

  if (block.type === "cashflow") {
    const data = liveData.cashflow as CashFlowBlockData | undefined;
    if (!data) return null;
    return (
      <Section id={id} num={num} title={title} spec={`${data.month} ${data.year}`}>
        <RpStatStrip cols={3}>
          <RpStat
            label="Paid out"
            value={fmtMoney(data.cashOut, { compact: true })}
            sub={`${data.paidCount} ${data.paidCount === 1 ? "bill" : "bills"} paid`}
          />
          <RpStat
            label="Pending"
            value={data.pendingCount}
            sub={`${data.pendingCount === 1 ? "bill" : "bills"} to pay this month`}
          />
          <RpStat
            label="Net"
            value={fmtMoney(data.net, { compact: true })}
            tone={data.net < 0 ? "alert" : "default"}
            sub="Paid and pending"
          />
        </RpStatStrip>
        <Commentary text={block.commentary} />
      </Section>
    );
  }

  if (block.type === "bills") {
    const daysAhead = (block.config?.days_ahead as number | undefined) ?? 7;
    const dataKey = `bills_${daysAhead}`;
    const data = liveData[dataKey] as BillBlockData | undefined;
    if (!data) return null;
    return (
      <Section
        id={id}
        num={num}
        title={title}
        spec={dot(
          `Next ${daysAhead} days`,
          `${data.bills.length} ${data.bills.length === 1 ? "bill" : "bills"}`,
          data.bills.length > 0 && fmtMoney(data.total, { compact: true }),
        )}
      >
        {data.bills.length === 0 ? (
          <p className="text-[15px] text-rp-muted">No bills due in this period.</p>
        ) : (
          <RpTable dense minWidth={compact ? 360 : 480} caption={`Bills due in the next ${daysAhead} days`}>
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Due</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.bills.map((bill) => (
                <tr key={bill.id}>
                  <td>
                    {bill.vendor}
                    {(bill.category || bill.description) && (
                      <span className="sub">{bill.category || bill.description}</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap">{fmtDate(bill.due_date, "short")}</td>
                  <td className="num">{fmtMoney(bill.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td />
                <td className="num">{fmtMoney(data.total)}</td>
              </tr>
            </tfoot>
          </RpTable>
        )}
        <Commentary text={block.commentary} />
      </Section>
    );
  }

  if (block.type === "projects") {
    const data = liveData.projects as ProjectsBlockData | undefined;
    if (!data) return null;
    const statusFilter = block.config?.status as string | undefined;
    const filteredProjects =
      statusFilter && statusFilter !== "all"
        ? data.projects.filter((p) => p.status === statusFilter)
        : data.projects;

    return (
      <Section
        id={id}
        num={num}
        title={title}
        spec={dot(
          `${filteredProjects.length} ${filteredProjects.length === 1 ? "package" : "packages"}`,
          statusFilter && statusFilter !== "all" ? statusLabel("project", statusFilter) : "All statuses",
        )}
      >
        {filteredProjects.length === 0 ? (
          <p className="text-[15px] text-rp-muted">No packages to show.</p>
        ) : (
          <RpTable dense minWidth={compact ? 360 : 520} caption="Projects snapshot">
            <thead>
              <tr>
                <th className="idx">#</th>
                <th>Package</th>
                {!compact && <th>Location</th>}
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((p, i) => (
                <tr key={p.id}>
                  <td className="idx">{pad2(i + 1)}</td>
                  <td>
                    {p.name}
                    {p.project_type && <span className="sub">{p.project_type}</span>}
                  </td>
                  {!compact && <td className="text-rp-muted">{p.location || "—"}</td>}
                  <td><RpStatus kind="project" value={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </RpTable>
        )}
        <Commentary text={block.commentary} />
      </Section>
    );
  }

  if (block.type === "decisions") {
    const data = liveData.decisions as DecisionsBlockData | undefined;
    if (!data) return null;
    return (
      <Section
        id={id}
        num={num}
        title={title}
        spec={data.count === 0 ? "Nothing waiting" : `${data.count} awaiting you`}
      >
        {data.decisions.length === 0 ? (
          <p className="text-[15px] text-rp-muted">No decisions waiting.</p>
        ) : (
          <RpList>
            {data.decisions.map((d, i) => (
              <RpRow
                key={d.id}
                index={i + 1}
                title={d.title}
                href="/alerts"
                meta={d.due_date ? `Due ${fmtDate(d.due_date, "short")}` : "No due date"}
                aside={<RpStatus kind="priority" value={d.priority} />}
                edge={d.priority === "urgent" ? "alert" : d.priority === "high" ? "gold" : undefined}
              />
            ))}
          </RpList>
        )}
        <Commentary text={block.commentary} />
      </Section>
    );
  }

  return null;
}
