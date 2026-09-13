"use client";

import { useCallback, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";

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

const LANGUAGE = "es-AR";

const getSpeechRecognitionCtor = (): SpeechRecognitionCtor | null => {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
};

export const useSpeechRecognition = () => {
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef("");

  const isNative = Capacitor.isNativePlatform();

  const start = useCallback(async (): Promise<boolean> => {
    setError(null);
    transcriptRef.current = "";

    if (isNative) {
      setError("El dictado por voz no está disponible en la app");
      return false;
    }

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError("El dictado no está disponible en este navegador");
      return false;
    }
    const recognition = new Ctor();
    recognition.lang = LANGUAGE;
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
    return true;
  }, [isNative]);

  const stop = useCallback(async (): Promise<string> => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    const transcript = transcriptRef.current;
    transcriptRef.current = "";
    return transcript;
  }, []);

  const cancel = useCallback(async (): Promise<void> => {
    recognitionRef.current?.abort?.();
    recognitionRef.current = null;
    transcriptRef.current = "";
  }, []);

  return { isNative, error, start, stop, cancel };
};
