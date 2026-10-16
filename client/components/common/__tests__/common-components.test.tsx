import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownText } from "@/components/common/markdown-text";

describe("MarkdownText", () => {
  it("renders headings, paragraphs, inline styles and lists", () => {
    render(
      <MarkdownText
        content={[
          "# Título",
          "",
          "Hola **mundo** con `code` y *itálica*",
          "",
          "- uno",
          "- dos",
          "",
          "1. primero",
          "2. segundo",
        ].join("\n")}
      />,
    );
    expect(screen.getByText("Título")).toBeInTheDocument();
    expect(screen.getByText("mundo")).toBeInTheDocument();
    expect(screen.getByText("code")).toBeInTheDocument();
    expect(screen.getByText("itálica")).toBeInTheDocument();
    expect(screen.getByText("uno")).toBeInTheDocument();
    expect(screen.getByText("primero")).toBeInTheDocument();
  });

  it("handles empty content", () => {
    const { container } = render(<MarkdownText content="" />);
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });
});
