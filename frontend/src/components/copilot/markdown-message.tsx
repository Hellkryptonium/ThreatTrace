import type { ReactNode } from "react";
import styles from "./markdown-message.module.css";

function inlineMarkdown(value: string): ReactNode[] {
  return value.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={index}>{part.slice(1, -1)}</code>;
    return part;
  });
}

export function MarkdownMessage({ content }: { content: string }) {
  const nodes: ReactNode[] = [];
  const lines = content.split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) continue;
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const Tag = heading[1].length === 1 ? "h2" : heading[1].length === 2 ? "h3" : "h4";
      nodes.push(<Tag key={`heading-${index}`}>{inlineMarkdown(heading[2])}</Tag>);
      continue;
    }
    const bullet = line.match(/^[-*]\s+(.+)$/);
    const numbered = line.match(/^\d+\.\s+(.+)$/);
    if (bullet || numbered) {
      const ordered = Boolean(numbered);
      const items: ReactNode[] = [];
      while (index < lines.length) {
        const item = lines[index].trim().match(ordered ? /^\d+\.\s+(.+)$/ : /^[-*]\s+(.+)$/);
        if (!item) break;
        items.push(<li key={`item-${index}`}>{inlineMarkdown(item[1])}</li>);
        index += 1;
      }
      index -= 1;
      const List = ordered ? "ol" : "ul";
      nodes.push(<List key={`list-${index}`}>{items}</List>);
      continue;
    }
    nodes.push(<p key={`paragraph-${index}`}>{inlineMarkdown(line)}</p>);
  }

  return <div className={styles.markdown}>{nodes}</div>;
}
