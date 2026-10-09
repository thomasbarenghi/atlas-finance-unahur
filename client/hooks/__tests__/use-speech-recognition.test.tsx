import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const isNativePlatform = vi.fn(() => false);
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => isNativePlatform() },
}));

import { useSpeechRecognition } from "@/hooks/use-speech-recognition";

class FakeSpeechRecognition {
  static last: FakeSpeechRecognition | null = null;
  lang = "";
  continuous = false;
  interimResults = false;
  onresult: ((event: unknown) => void) | null = null;
  onerror: (() => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();

  constructor() {
    FakeSpeechRecognition.last = this;
  }
}

const emitTranscript = (text: string) => {
  FakeSpeechRecognition.last?.onresult?.({
    resultIndex: 0,
    results: {
      length: 1,
      0: { isFinal: true, length: 1, 0: { transcript: text } },
    },
  });
};

describe("useSpeechRecognition", () => {
  beforeEach(() => {
    isNativePlatform.mockReturnValue(false);
    FakeSpeechRecognition.last = null;
    (window as unknown as Record<string, unknown>).SpeechRecognition =
      FakeSpeechRecognition;
  });

  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).SpeechRecognition;
    delete (window as unknown as Record<string, unknown>)
      .webkitSpeechRecognition;
  });

  it("starts recognition and returns the final transcript on stop", async () => {
    const { result } = renderHook(() => useSpeechRecognition());

    let started = false;
    await act(async () => {
      started = await result.current.start();
    });
    expect(started).toBe(true);
    expect(FakeSpeechRecognition.last?.lang).toBe("es-AR");
    expect(FakeSpeechRecognition.last?.continuous).toBe(true);
    expect(FakeSpeechRecognition.last?.start).toHaveBeenCalled();

    emitTranscript("  hola mundo ");
    let transcript = "";
    await act(async () => {
      transcript = await result.current.stop();
    });
    expect(transcript).toBe("hola mundo");
  });

  it("clears the transcript on cancel", async () => {
    const { result } = renderHook(() => useSpeechRecognition());
    await act(async () => {
      await result.current.start();
    });
    emitTranscript("algo");
    await act(async () => {
      await result.current.cancel();
    });
    expect(FakeSpeechRecognition.last?.abort).toHaveBeenCalled();
    const transcript = await result.current.stop();
    expect(transcript).toBe("");
  });

  it("errors when the browser does not support dictation", async () => {
    delete (window as unknown as Record<string, unknown>).SpeechRecognition;
    const { result } = renderHook(() => useSpeechRecognition());
    let started = true;
    await act(async () => {
      started = await result.current.start();
    });
    expect(started).toBe(false);
    expect(result.current.error).toMatch(/no está disponible/);
  });

  it("errors on native platforms", async () => {
    isNativePlatform.mockReturnValue(true);
    const { result } = renderHook(() => useSpeechRecognition());
    let started = true;
    await act(async () => {
      started = await result.current.start();
    });
    expect(started).toBe(false);
    expect(result.current.error).toMatch(/app/);
    expect(result.current.isNative).toBe(true);
  });
});
