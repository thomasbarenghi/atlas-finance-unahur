import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useMoneyInput } from "@/components/common/money-input/hooks/use-money-input";

describe("useMoneyInput", () => {
  it("formats the initial value", () => {
    const { result } = renderHook(() =>
      useMoneyInput({ value: 1234.5, onChange: vi.fn() }),
    );
    expect(result.current.text).toBe("1.234,5");
  });

  it("formats typing and reports the parsed number", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useMoneyInput({ value: 0, onChange }));

    act(() => result.current.handleChange("1234567"));
    expect(result.current.text).toBe("1.234.567");
    expect(onChange).toHaveBeenLastCalledWith(1234567);

    act(() => result.current.handleChange("1.234,5"));
    expect(onChange).toHaveBeenLastCalledWith(1234.5);
  });

  it("ignores external value updates while editing and reformats on blur", () => {
    const onBlur = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }) => useMoneyInput({ value, onChange: vi.fn(), onBlur }),
      { initialProps: { value: 100 } },
    );

    act(() => result.current.handleChange("200"));
    expect(result.current.text).toBe("200");

    rerender({ value: 999 });
    expect(result.current.text).toBe("200");

    act(() => result.current.handleBlur());
    expect(result.current.text).toBe("999");
    expect(onBlur).toHaveBeenCalled();
  });

  it("emits null for empty input", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useMoneyInput({ value: 10, onChange }));
    act(() => result.current.handleChange(""));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});
