"use client";

import { useCallback, useRef, useState } from "react";

export interface RecordedAudio {
  blob: Blob;
  url: string;
  durationMs: number;
}

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  const resolveRef = useRef<((value: RecordedAudio | null) => void) | null>(
    null,
  );

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    setError(null);
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError("Tu dispositivo no permite grabar audio");
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const durationMs = Date.now() - startedAtRef.current;
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const result: RecordedAudio | null =
          blob.size > 0
            ? { blob, url: URL.createObjectURL(blob), durationMs }
            : null;
        resolveRef.current?.(result);
        resolveRef.current = null;
        cleanup();
        setIsRecording(false);
      };

      recorder.start();
      startedAtRef.current = Date.now();
      setIsRecording(true);
      setElapsedMs(0);
      intervalRef.current = setInterval(
        () => setElapsedMs(Date.now() - startedAtRef.current),
        200,
      );
      return true;
    } catch {
      setError("No pudimos acceder al micrófono");
      cleanup();
      return false;
    }
  }, [cleanup]);

  const stop = useCallback(
    (): Promise<RecordedAudio | null> =>
      new Promise((resolve) => {
        const recorder = recorderRef.current;
        if (!recorder || recorder.state === "inactive") {
          resolve(null);
          return;
        }
        resolveRef.current = resolve;
        recorder.stop();
      }),
    [],
  );

  const cancel = useCallback(() => {
    resolveRef.current = null;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    cleanup();
    setIsRecording(false);
  }, [cleanup]);

  return { isRecording, elapsedMs, error, start, stop, cancel };
};
