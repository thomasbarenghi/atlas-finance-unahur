import type { ReactNode } from "react";

const renderInline = (text: string): ReactNode[] => {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const token = match[0];
    const key = `${match.index}-${token}`;
    if (token.startsWith("**")) {
      nodes.push(
        <strong key={key} className="font-semibold">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`")) {
      nodes.push(
        <code
          key={key}
          className="bg-muted rounded px-1 py-0.5 font-mono text-[0.85em]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
};

export const parseMarkdown = (content: string): ReactNode[] => {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const text = paragraph.join(" ").trim();
    if (text) {
      blocks.push(<p key={`p-${blocks.length}`}>{renderInline(text)}</p>);
    }
    paragraph = [];
  };

  const flushList = () => {
    if (!list || list.items.length === 0) {
      list = null;
      return;
    }
    const Tag = list.type;
    const items = list.items;
    blocks.push(
      <Tag
        key={`list-${blocks.length}`}
        className={
          list.type === "ul"
            ? "list-disc space-y-1 pl-4"
            : "list-decimal space-y-1 pl-4"
        }
      >
        {items.map((item, index) => (
          <li key={`${index}-${item.slice(0, 8)}`}>{renderInline(item)}</li>
        ))}
      </Tag>,
    );
    list = null;
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (trimmed === "") {
      flushParagraph();
      flushList();
      continue;
    }

    const bullet = /^[-*•]\s+(.*)$/.exec(trimmed);
    const ordered = /^\d+[.)]\s+(.*)$/.exec(trimmed);
    const heading = /^#{1,6}\s+(.*)$/.exec(trimmed);

    if (bullet) {
      flushParagraph();
      if (!list || list.type !== "ul") {
        flushList();
        list = { type: "ul", items: [] };
      }
      list.items.push(bullet[1]);
      continue;
    }

    if (ordered) {
      flushParagraph();
      if (!list || list.type !== "ol") {
        flushList();
        list = { type: "ol", items: [] };
      }
      list.items.push(ordered[1]);
      continue;
    }

    if (heading) {
      flushParagraph();
      flushList();
      blocks.push(
        <p key={`h-${blocks.length}`} className="font-semibold">
          {renderInline(heading[1])}
        </p>,
      );
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  return blocks;
};
