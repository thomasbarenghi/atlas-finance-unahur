"use client";

import { useCallback, useRef } from "react";

interface SpeechAlternative {
  transcript: string;
}

interface SpeechResult {
  isFinal: boolean;
  length: number;
  0: SpeechAlternative;
}

interface SpeechResultList {
  length: number;
  [index: number]: SpeechResult;
}

interface SpeechResultEvent {
  resultIndex: number;
  results: SpeechResultList;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const getSpeechRecognitionCtor = (): SpeechRecognitionCtor | null => {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
};

export const useSpeechRecognition = () => {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef("");

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = "es-AR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let text = "";
      for (let index = 0; index < event.results.length; index += 1) {
        text += event.results[index][0].transcript;
      }
      transcriptRef.current = text.trim();
    };
    recognition.onerror = () => {};
    recognition.onend = () => {};
    recognition.start();
    recognitionRef.current = recognition;
  }, []);

  const stop = useCallback((): string => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    const transcript = transcriptRef.current;
    transcriptRef.current = "";
    return transcript;
  }, []);

  const cancel = useCallback(() => {
    recognitionRef.current?.abort?.();
    recognitionRef.current = null;
    transcriptRef.current = "";
  }, []);

  return { start, stop, cancel };
};
