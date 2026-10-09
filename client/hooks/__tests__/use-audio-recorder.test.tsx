import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";

class FakeMediaRecorder {
  static last: FakeMediaRecorder | null = null;
  state = "inactive";
  mimeType = "audio/webm";
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;

  constructor() {
    FakeMediaRecorder.last = this;
  }

  start() {
    this.state = "recording";
  }

  stop() {
    this.state = "inactive";
    this.ondataavailable?.({
      data: new Blob(["audio"], { type: "audio/webm" }),
    });
    this.onstop?.();
  }
}

const installUserMedia = () => {
  const stopTrack = vi.fn();
  const getUserMedia = vi.fn().mockResolvedValue({
    getTracks: () => [{ stop: stopTrack }],
  });
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia },
  });
  return { getUserMedia, stopTrack };
};

describe("useAudioRecorder", () => {
  beforeEach(() => {
    FakeMediaRecorder.last = null;
    vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:mock"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("records and returns a blob with a duration on stop", async () => {
    const { stopTrack } = installUserMedia();
    const { result } = renderHook(() => useAudioRecorder());

    let started = false;
    await act(async () => {
      started = await result.current.start();
    });
    expect(started).toBe(true);
    expect(result.current.isRecording).toBe(true);

    await act(async () => {
      const recorded = await result.current.stop();
      expect(recorded?.url).toBe("blob:mock");
      expect(recorded?.durationMs).toBeGreaterThanOrEqual(0);
    });

    expect(stopTrack).toHaveBeenCalled();
    expect(result.current.isRecording).toBe(false);
  });

  it("cancels a recording", async () => {
    installUserMedia();
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.start();
    });
    act(() => result.current.cancel());
    expect(result.current.isRecording).toBe(false);
  });

  it("surfaces an error when microphone access is denied", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    const { result } = renderHook(() => useAudioRecorder());

    let started = true;
    await act(async () => {
      started = await result.current.start();
    });
    expect(started).toBe(false);
    expect(result.current.error).toMatch(/micrófono/);
  });

  it("surfaces an error when recording is unsupported", async () => {
    vi.stubGlobal("MediaRecorder", undefined);
    const { result } = renderHook(() => useAudioRecorder());

    let started = true;
    await act(async () => {
      started = await result.current.start();
    });
    expect(started).toBe(false);
    expect(result.current.error).toMatch(/no permite grabar/);
  });

  it("resolves null when stopping without an active recording", async () => {
    const { result } = renderHook(() => useAudioRecorder());
    let recorded: unknown = "unset";
    await act(async () => {
      recorded = await result.current.stop();
    });
    expect(recorded).toBeNull();
  });
});
