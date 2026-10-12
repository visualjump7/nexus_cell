import React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";

// Roaring Pines owner-brief print styles: uppercase tracked headings, thin
// rules above (never under) headings, gold square bullets, ink on white.
const INK = "#111111";
const BODY = "#2A2D30";
const GOLD = "#B0853A";
const RULE = "#E6E8E9";

const styles = StyleSheet.create({
  h2: {
    fontSize: 12,
    fontWeight: "bold",
    color: INK,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: 14,
    marginBottom: 6,
    paddingTop: 8,
    borderTopWidth: 0.75,
    borderTopColor: RULE,
  },
  h3: {
    fontSize: 10.5,
    fontWeight: "bold",
    color: INK,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: 10,
    marginBottom: 4,
  },
  p: { fontSize: 10, lineHeight: 1.6, marginBottom: 8, color: BODY },
  bold: { fontWeight: "bold", color: INK },
  italic: { fontStyle: "italic" },
  ul: { marginBottom: 8, paddingLeft: 2 },
  ol: { marginBottom: 8, paddingLeft: 2 },
  li: {
    fontSize: 10,
    lineHeight: 1.6,
    marginBottom: 3,
    flexDirection: "row" as const,
  },
  liSquare: { width: 3.5, height: 3.5, backgroundColor: GOLD, marginTop: 5.5, marginRight: 9 },
  liBullet: { width: 14, fontSize: 9, color: GOLD, fontWeight: "bold", paddingTop: 1 },
  liContent: { flex: 1, fontSize: 10, lineHeight: 1.6, color: BODY },
});

interface ParsedNode {
  tag: string;
  attrs?: Record<string, string>;
  children: (ParsedNode | string)[];
}

function parseHTML(html: string): ParsedNode[] {
  const nodes: (ParsedNode | string)[] = [];
  let cursor = 0;

  while (cursor < html.length) {
    const tagStart = html.indexOf("<", cursor);
    // Keep the spaces around inline runs ("<strong>18 Sep.</strong> The pit");
    // drop whitespace-only gaps that hold a line break (between blocks).
    if (tagStart === -1) {
      const text = html.slice(cursor);
      if (text.trim() || (text.includes(" ") && !text.includes("\n"))) nodes.push(decodeEntities(text));
      break;
    }

    if (tagStart > cursor) {
      const text = html.slice(cursor, tagStart);
      if (text.trim() || (text.includes(" ") && !text.includes("\n"))) nodes.push(decodeEntities(text));
    }

    if (
      html.slice(tagStart, tagStart + 4) === "<br>" ||
      html.slice(tagStart, tagStart + 5) === "<br/>" ||
      html.slice(tagStart, tagStart + 6) === "<br />"
    ) {
      nodes.push({ tag: "br", children: [] });
      cursor = html.indexOf(">", tagStart) + 1;
      continue;
    }

    if (html[tagStart + 1] === "/") {
      cursor = html.indexOf(">", tagStart) + 1;
      continue;
    }

    const tagEnd = html.indexOf(">", tagStart);
    if (tagEnd === -1) break;

    const tagContent = html.slice(tagStart + 1, tagEnd);
    const spaceIdx = tagContent.indexOf(" ");
    const tagName = (
      spaceIdx > -1 ? tagContent.slice(0, spaceIdx) : tagContent
    ).toLowerCase();

    const closeTag = `</${tagName}>`;
    let closeIdx = html.indexOf(closeTag, tagEnd + 1);
    let depth = 1;
    let searchFrom = tagEnd + 1;
    while (depth > 0 && searchFrom < html.length) {
      const nextOpen = html.indexOf(`<${tagName}`, searchFrom);
      const nextClose = html.indexOf(closeTag, searchFrom);
      if (nextClose === -1) break;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        searchFrom = nextOpen + tagName.length + 1;
      } else {
        depth--;
        if (depth === 0) closeIdx = nextClose;
        searchFrom = nextClose + closeTag.length;
      }
    }

    if (closeIdx === -1) {
      cursor = tagEnd + 1;
      continue;
    }

    const innerHtml = html.slice(tagEnd + 1, closeIdx);
    const children = parseHTML(innerHtml);
    nodes.push({ tag: tagName, children });
    cursor = closeIdx + closeTag.length;
  }

  return nodes as ParsedNode[];
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function renderInlineChildren(
  children: (ParsedNode | string)[]
): React.ReactNode[] {
  return children.map((child, i) => {
    // Raw strings stay raw so react-pdf keeps the spaces around inline
    // <strong>/<em> runs (a nested <Text> drops its leading space).
    if (typeof child === "string") {
      return child;
    }
    if (child.tag === "strong" || child.tag === "b") {
      return (
        <Text key={i} style={styles.bold}>
          {renderInlineChildren(child.children)}
        </Text>
      );
    }
    if (child.tag === "em" || child.tag === "i") {
      return (
        <Text key={i} style={styles.italic}>
          {renderInlineChildren(child.children)}
        </Text>
      );
    }
    if (child.tag === "u") {
      return (
        <Text
          key={i}
          style={{ textDecoration: "underline" as const }}
        >
          {renderInlineChildren(child.children)}
        </Text>
      );
    }
    if (child.tag === "br") {
      return <Text key={i}>{"\n"}</Text>;
    }
    return <Text key={i}>{renderInlineChildren(child.children)}</Text>;
  });
}

function renderNodes(nodes: (ParsedNode | string)[]): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  let olCounter = 0;

  nodes.forEach((node, i) => {
    if (typeof node === "string") {
      if (node.trim()) {
        elements.push(
          <Text key={i} style={styles.p}>
            {node}
          </Text>
        );
      }
      return;
    }

    switch (node.tag) {
      case "h1":
      case "h2":
        elements.push(
          <Text key={i} style={styles.h2}>
            {renderInlineChildren(node.children)}
          </Text>
        );
        break;
      case "h3":
        elements.push(
          <Text key={i} style={styles.h3}>
            {renderInlineChildren(node.children)}
          </Text>
        );
        break;
      case "p":
        elements.push(
          <Text key={i} style={styles.p}>
            {renderInlineChildren(node.children)}
          </Text>
        );
        break;
      case "ul":
        elements.push(
          <View key={i} style={styles.ul}>
            {node.children
              .filter(
                (c): c is ParsedNode => typeof c !== "string" && c.tag === "li"
              )
              .map((li, j) => (
                <View key={j} style={styles.li}>
                  <View style={styles.liSquare} />
                  <Text style={styles.liContent}>
                    {renderInlineChildren(li.children)}
                  </Text>
                </View>
              ))}
          </View>
        );
        break;
      case "ol":
        olCounter = 0;
        elements.push(
          <View key={i} style={styles.ol}>
            {node.children
              .filter(
                (c): c is ParsedNode => typeof c !== "string" && c.tag === "li"
              )
              .map((li, j) => {
                olCounter++;
                return (
                  <View key={j} style={styles.li}>
                    <Text style={styles.liBullet}>{String(olCounter).padStart(2, "0")}</Text>
                    <Text style={styles.liContent}>
                      {renderInlineChildren(li.children)}
                    </Text>
                  </View>
                );
              })}
          </View>
        );
        break;
      case "br":
        elements.push(<Text key={i}>{"\n"}</Text>);
        break;
      default:
        elements.push(
          <Text key={i} style={styles.p}>
            {renderInlineChildren(node.children)}
          </Text>
        );
        break;
    }
  });

  return elements;
}

export function htmlToPdfElements(html: string): React.ReactNode[] {
  if (!html || html.trim() === "" || html === "<p></p>") return [];
  const nodes = parseHTML(html);
  return renderNodes(nodes);
}
