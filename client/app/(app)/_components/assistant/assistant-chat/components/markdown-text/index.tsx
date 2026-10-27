import { cn } from "@/lib/utils";
import { parseMarkdown } from "./markdown.utils";

export interface MarkdownTextProps {
  content: string;
  className?: string;
}

export const MarkdownText = ({ content, className }: MarkdownTextProps) => {
  return (
    <div className={cn("flex flex-col gap-2 leading-relaxed", className)}>
      {parseMarkdown(content)}
    </div>
  );
};
