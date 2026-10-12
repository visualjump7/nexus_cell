import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { htmlToPdfElements } from "@/lib/html-to-pdf-blocks";
import type {
  Brief,
  BriefBlock,
  CashFlowBlockData,
  BillBlockData,
  ProjectsBlockData,
  DecisionsBlockData,
} from "@/lib/brief-service";
import { BRAND } from "@/lib/brand";

// ── Print palette ──────────────────────────────────────────────────────────
// Dark cover on the app ground; white content pages with ink text, thin
// rules and the burnished gold darkened for paper.
const C = {
  ground: "#0A0B0C",
  line: "#1F1F1F",
  text: "#F5F5F5",
  muted: "#9AA0A4",
  dim: "#6E7578",
  gold: "#CDA14B",
  ink: "#111111",
  body: "#2A2D30",
  head: "#1F1F1F",
  quiet: "#6E7578",
  rule: "#E6E8E9",
  goldPrint: "#B0853A",
  alertPrint: "#A84432",
  greenPrint: "#6E9A2E",
  bluePrint: "#2F72A8",
};

const coverStyles = StyleSheet.create({
  page: {
    backgroundColor: C.ground,
    paddingTop: 56,
    paddingBottom: 48,
    paddingHorizontal: 56,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logo: { maxHeight: 64, maxWidth: 180, objectFit: "contain" },
  wordmark: { fontSize: 15, fontWeight: "bold", color: C.text, letterSpacing: 2.4, lineHeight: 1.05 },
  wordmarkSub: { fontSize: 7.5, color: C.muted, letterSpacing: 2.4, marginTop: 3 },
  kicker: { fontSize: 8, color: C.gold, letterSpacing: 2.2, textTransform: "uppercase" },
  body: { flexDirection: "column" },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 2.2,
    color: C.gold,
    marginBottom: 18,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: C.text,
    letterSpacing: 1.5,
    lineHeight: 1.05,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 1.45,
    color: C.muted,
    marginBottom: 26,
    maxWidth: 400,
  },
  accentLine: { width: 56, height: 2, marginBottom: 22 },
  meta: {
    fontSize: 9,
    color: C.muted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.75,
    borderTopColor: C.line,
    paddingTop: 12,
  },
  footerText: { fontSize: 7.5, color: C.dim, letterSpacing: 1.5, textTransform: "uppercase" },
});

const contentStyles = StyleSheet.create({
  page: { backgroundColor: "#ffffff", paddingTop: 50, paddingHorizontal: 50, paddingBottom: 72 },
  header: { marginBottom: 22 },
  kicker: { fontSize: 7.5, color: C.goldPrint, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 },
  briefTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: C.ink,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  attribution: { fontSize: 8, color: C.quiet, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 },
  divider: { height: 0.75, backgroundColor: C.goldPrint },
  section: { marginBottom: 18 },
  sectionHead: {
    flexDirection: "row" as const,
    alignItems: "baseline" as const,
    borderTopWidth: 0.75,
    borderTopColor: C.rule,
    paddingTop: 9,
    marginBottom: 10,
  },
  sectionNum: { fontSize: 9, color: C.goldPrint, fontWeight: "bold", letterSpacing: 1, width: 22 },
  sectionTitle: { fontSize: 11.5, fontWeight: "bold", color: C.ink, letterSpacing: 1.5, textTransform: "uppercase" },
  sectionSpec: { fontSize: 8, color: C.quiet, letterSpacing: 1, textTransform: "uppercase", marginLeft: 10 },
  commentary: {
    fontSize: 9.5,
    lineHeight: 1.55,
    color: "#4A4F53",
    marginTop: 10,
    paddingLeft: 9,
    borderLeftWidth: 1.5,
    borderLeftColor: C.goldPrint,
  },
  empty: { fontSize: 9, color: C.quiet },
  tableRow: {
    flexDirection: "row" as const,
    borderBottomWidth: 0.75,
    borderBottomColor: C.rule,
    paddingVertical: 5,
  },
  tableHeader: {
    flexDirection: "row" as const,
    borderBottomWidth: 0.75,
    borderBottomColor: C.head,
    paddingBottom: 4,
  },
  th: { fontSize: 7, color: C.head, fontWeight: "bold", letterSpacing: 1.2, textTransform: "uppercase" },
  tableCell: { fontSize: 9, color: C.body },
  cellSub: { fontSize: 7.5, color: C.quiet, marginTop: 1.5 },
  totalRow: {
    flexDirection: "row" as const,
    paddingTop: 6,
    marginTop: 2,
    borderTopWidth: 0.75,
    borderTopColor: C.head,
  },
  totalCell: { fontSize: 9.5, color: C.ink, fontWeight: "bold", letterSpacing: 0.5 },
  statRow: { flexDirection: "row" as const, borderTopWidth: 0.75, borderTopColor: C.rule },
  statCell: { flex: 1, paddingTop: 8, paddingRight: 10 },
  statLabel: { fontSize: 7, color: C.quiet, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: "bold", letterSpacing: 0.5 },
  statSub: { fontSize: 7.5, color: C.quiet, marginTop: 3 },
  tag: {
    fontSize: 6.5,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 0.75,
    marginRight: 0.75,
  },
  pageFooter: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    borderTopWidth: 0.75,
    borderTopColor: C.rule,
    paddingTop: 8,
  },
  pageFooterText: { fontSize: 6.5, color: "#9AA0A4", letterSpacing: 1.2, textTransform: "uppercase" },
});

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr.slice(0, 10) + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** react-pdf renders raster images from absolute URLs only (no SVG, no relative paths). */
function isPrintableLogo(url: string | null | undefined): url is string {
  if (!url) return false;
  if (!/^https?:\/\//i.test(url) && !url.startsWith("data:image/")) return false;
  return !/\.svg(\?|#|$)/i.test(url) && !url.startsWith("data:image/svg");
}

/** Pull a leading <h1–h3> out of rich text so it can head the section. */
function splitLeadHeading(html: string): { heading: string | null; body: string } {
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

const STATUS_TONE: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: C.goldPrint },
  on_hold: { label: "On hold", color: C.bluePrint },
  completed: { label: "Complete", color: C.greenPrint },
  archived: { label: "Archived", color: C.quiet },
};

const PRIORITY_TONE: Record<string, { label: string; color: string }> = {
  urgent: { label: "Urgent", color: C.alertPrint },
  high: { label: "High", color: C.goldPrint },
  normal: { label: "Normal", color: C.quiet },
  low: { label: "Low", color: "#9AA0A4" },
};

interface BriefPDFProps {
  brief: Brief;
  liveData: Record<string, unknown>;
  principalName?: string;
  // Club name shown on the cover eyebrow and in the footers.
  clubName?: string;
}

export function BriefPDF({
  brief,
  liveData,
  principalName,
  clubName = BRAND.fullName,
}: BriefPDFProps) {
  const accentColor = brief.cover_accent_color || C.gold;
  const coverTitle = brief.cover_title || brief.title;
  const briefDate = formatDate(brief.brief_date);
  const logo = isPrintableLogo(brief.cover_logo_url) ? brief.cover_logo_url : null;

  // Number only the blocks that render.
  let n = 0;
  const sections = (brief.blocks || []).map((block) => {
    const node = <ContentBlock key={block.id} block={block} liveData={liveData} num={n + 1} />;
    if (!blockRenders(block, liveData)) return null;
    n += 1;
    return node;
  });

  return (
    <Document title={`${brief.title} · ${clubName}`} author={clubName}>
      <Page size="A4" style={coverStyles.page}>
        <View style={coverStyles.top}>
          {logo ? (
            // react-pdf Image has no alt prop; the logo is decorative.
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={logo} style={coverStyles.logo} />
          ) : (
            <View>
              <Text style={coverStyles.wordmark}>ROARING</Text>
              <Text style={coverStyles.wordmark}>PINES</Text>
              <Text style={coverStyles.wordmarkSub}>MOTOR CLUB</Text>
            </View>
          )}
          <Text style={coverStyles.kicker}>Owner&apos;s brief</Text>
        </View>

        <View style={coverStyles.body}>
          <Text style={coverStyles.eyebrow}>{clubName}</Text>
          <Text style={coverStyles.title}>{coverTitle}</Text>
          {brief.cover_subtitle && (
            <Text style={coverStyles.subtitle}>{brief.cover_subtitle}</Text>
          )}
          <View style={[coverStyles.accentLine, { backgroundColor: accentColor }]} />
          {brief.cover_show_date !== false && (
            <Text style={coverStyles.meta}>{briefDate}</Text>
          )}
          {brief.cover_show_principal !== false && principalName && (
            <Text style={coverStyles.meta}>Prepared for {principalName}</Text>
          )}
        </View>

        <View style={coverStyles.footer}>
          <Text style={coverStyles.footerText}>Confidential · {clubName}</Text>
          <Text style={coverStyles.footerText}>State Road 100 · Palatka, Florida</Text>
        </View>
      </Page>

      <Page size="A4" style={contentStyles.page} wrap>
        <View style={contentStyles.header}>
          <Text style={contentStyles.kicker}>{clubName} · Owner&apos;s brief</Text>
          <Text style={contentStyles.briefTitle}>{brief.title}</Text>
          <Text style={contentStyles.attribution}>
            {briefDate} · Prepared by the owner&apos;s rep team
          </Text>
          <View style={contentStyles.divider} />
        </View>

        {sections}

        <View style={contentStyles.pageFooter} fixed>
          <Text style={contentStyles.pageFooterText}>Confidential · {clubName}</Text>
          <Text style={contentStyles.pageFooterText}>{briefDate}</Text>
          <Text
            style={contentStyles.pageFooterText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

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

function SectionHead({ num, title, spec }: { num: number; title: string; spec?: string | null }) {
  // The first section sits right under the gold header rule: no second rule.
  const style = num === 1 ? [contentStyles.sectionHead, { borderTopWidth: 0, paddingTop: 2 }] : contentStyles.sectionHead;
  return (
    <View style={style} minPresenceAhead={40}>
      <Text style={contentStyles.sectionNum}>{pad2(num)}</Text>
      <Text style={contentStyles.sectionTitle}>{title}</Text>
      {spec ? <Text style={contentStyles.sectionSpec}>{spec}</Text> : null}
    </View>
  );
}

function Commentary({ text }: { text: string | null }) {
  if (!text) return null;
  return <Text style={contentStyles.commentary}>{text}</Text>;
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ flexDirection: "row" as const }}>
      <Text style={[contentStyles.tag, { color, borderColor: color }]}>{label}</Text>
    </View>
  );
}

function ContentBlock({
  block,
  liveData,
  num,
}: {
  block: BriefBlock;
  liveData: Record<string, unknown>;
  num: number;
}) {
  if (block.type === "text" || block.type === "document") {
    if (!block.content_html) return null;
    const { heading, body } = splitLeadHeading(block.content_html);
    return (
      <View style={contentStyles.section}>
        <SectionHead num={num} title={heading || (block.type === "document" ? "Document" : "Note")} />
        <View>{htmlToPdfElements(body)}</View>
        <Commentary text={block.commentary} />
      </View>
    );
  }

  if (block.type === "cashflow") {
    const data = liveData.cashflow as CashFlowBlockData | undefined;
    if (!data) return null;
    return (
      <View style={contentStyles.section} wrap={false}>
        <SectionHead num={num} title="Cash" spec={`${data.month} ${data.year}`} />
        <View style={contentStyles.statRow}>
          <View style={contentStyles.statCell}>
            <Text style={contentStyles.statLabel}>Paid out</Text>
            <Text style={[contentStyles.statValue, { color: C.greenPrint }]}>
              {formatCurrency(data.cashOut)}
            </Text>
            <Text style={contentStyles.statSub}>{data.paidCount} bills paid</Text>
          </View>
          <View style={contentStyles.statCell}>
            <Text style={contentStyles.statLabel}>Pending</Text>
            <Text style={[contentStyles.statValue, { color: C.goldPrint }]}>
              {data.pendingCount}
            </Text>
            <Text style={contentStyles.statSub}>bills to pay this month</Text>
          </View>
          <View style={contentStyles.statCell}>
            <Text style={contentStyles.statLabel}>Net</Text>
            <Text
              style={[
                contentStyles.statValue,
                { color: data.net < 0 ? C.alertPrint : C.greenPrint },
              ]}
            >
              {formatCurrency(data.net)}
            </Text>
            <Text style={contentStyles.statSub}>Paid and pending</Text>
          </View>
        </View>
        <Commentary text={block.commentary} />
      </View>
    );
  }

  if (block.type === "bills") {
    const daysAhead = (block.config?.days_ahead as number | undefined) ?? 7;
    const data = liveData[`bills_${daysAhead}`] as BillBlockData | undefined;
    if (!data) return null;
    return (
      <View style={contentStyles.section}>
        <SectionHead
          num={num}
          title="Bills due"
          spec={`Next ${daysAhead} days · ${data.bills.length} ${data.bills.length === 1 ? "bill" : "bills"}`}
        />
        {data.bills.length === 0 ? (
          <Text style={contentStyles.empty}>No bills due in this period.</Text>
        ) : (
          <>
            <View style={contentStyles.tableHeader}>
              <Text style={[contentStyles.th, { width: "18%" }]}>Due</Text>
              <Text style={[contentStyles.th, { width: "52%" }]}>Vendor</Text>
              <Text style={[contentStyles.th, { width: "30%", textAlign: "right" }]}>Amount</Text>
            </View>
            {data.bills.map((bill) => (
              <View key={bill.id} style={contentStyles.tableRow} wrap={false}>
                <Text style={[contentStyles.tableCell, { width: "18%" }]}>
                  {formatShortDate(bill.due_date)}
                </Text>
                <View style={{ width: "52%" }}>
                  <Text style={contentStyles.tableCell}>{bill.vendor}</Text>
                  {bill.category && <Text style={contentStyles.cellSub}>{bill.category}</Text>}
                </View>
                <Text style={[contentStyles.tableCell, { width: "30%", textAlign: "right" }]}>
                  {formatCurrency(bill.amount)}
                </Text>
              </View>
            ))}
            <View style={contentStyles.totalRow} wrap={false}>
              <Text style={[contentStyles.totalCell, { width: "70%" }]}>TOTAL</Text>
              <Text style={[contentStyles.totalCell, { width: "30%", textAlign: "right" }]}>
                {formatCurrency(data.total)}
              </Text>
            </View>
          </>
        )}
        <Commentary text={block.commentary} />
      </View>
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
      <View style={contentStyles.section}>
        <SectionHead
          num={num}
          title="Projects"
          spec={`${filteredProjects.length} ${filteredProjects.length === 1 ? "package" : "packages"}${
            statusFilter && statusFilter !== "all" ? ` · ${STATUS_TONE[statusFilter]?.label ?? statusFilter}` : ""
          }`}
        />
        {filteredProjects.length === 0 ? (
          <Text style={contentStyles.empty}>No packages to show.</Text>
        ) : (
          <>
            <View style={contentStyles.tableHeader}>
              <Text style={[contentStyles.th, { width: "7%" }]}>#</Text>
              <Text style={[contentStyles.th, { width: "55%" }]}>Package</Text>
              <Text style={[contentStyles.th, { width: "23%" }]}>Type</Text>
              <Text style={[contentStyles.th, { width: "15%", textAlign: "right" }]}>Status</Text>
            </View>
            {filteredProjects.map((p, i) => {
              const tone = STATUS_TONE[p.status] ?? { label: p.status.replace(/_/g, " "), color: C.quiet };
              return (
                <View key={p.id} style={contentStyles.tableRow} wrap={false}>
                  <Text style={[contentStyles.tableCell, { width: "7%", color: C.goldPrint }]}>{pad2(i + 1)}</Text>
                  <Text style={[contentStyles.tableCell, { width: "55%" }]}>{p.name}</Text>
                  <Text style={[contentStyles.tableCell, { width: "23%", color: C.quiet }]}>
                    {p.project_type || "—"}
                  </Text>
                  <Text
                    style={[
                      contentStyles.tableCell,
                      { width: "15%", textAlign: "right", color: tone.color, fontSize: 7.5, letterSpacing: 1, textTransform: "uppercase" },
                    ]}
                  >
                    {tone.label}
                  </Text>
                </View>
              );
            })}
          </>
        )}
        <Commentary text={block.commentary} />
      </View>
    );
  }

  if (block.type === "decisions") {
    const data = liveData.decisions as DecisionsBlockData | undefined;
    if (!data) return null;

    return (
      <View style={contentStyles.section}>
        <SectionHead
          num={num}
          title="Decisions"
          spec={data.count === 0 ? "Nothing waiting" : `${data.count} awaiting you`}
        />
        {data.decisions.length === 0 ? (
          <Text style={contentStyles.empty}>No decisions waiting.</Text>
        ) : (
          data.decisions.map((d, i) => {
            const tone = PRIORITY_TONE[d.priority] ?? { label: d.priority, color: C.quiet };
            return (
              <View
                key={d.id}
                wrap={false}
                style={{
                  flexDirection: "row" as const,
                  alignItems: "flex-start" as const,
                  paddingVertical: 6,
                  borderBottomWidth: 0.75,
                  borderBottomColor: C.rule,
                }}
              >
                <Text style={{ width: 22, fontSize: 9, color: C.goldPrint, fontWeight: "bold" }}>{pad2(i + 1)}</Text>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ fontSize: 10, color: C.ink }}>{d.title}</Text>
                  {d.due_date && (
                    <Text style={contentStyles.cellSub}>Due {formatDate(d.due_date.slice(0, 10))}</Text>
                  )}
                </View>
                <Tag label={tone.label} color={tone.color} />
              </View>
            );
          })
        )}
        <Commentary text={block.commentary} />
      </View>
    );
  }

  return null;
}
