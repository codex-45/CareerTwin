"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { countFillers } from "@/lib/interview";
import type { DeliveryMetrics } from "@/lib/types";

interface SRAlternative {
  transcript: string;
}
interface SRResult {
  isFinal: boolean;
  0: SRAlternative;
}
interface SREvent {
  resultIndex: number;
  results: ArrayLike<SRResult>;
}
interface SpeechRec {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: SREvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}

const getSR = (): (new () => SpeechRec) | undefined => {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

const HEDGES = /\b(i think|i guess|maybe|probably|not sure|kind of|sort of|i believe|perhaps|i don't know)\b/gi;
const SILENCE_RMS = 0.018;
const LONG_PAUSE_MS = 2000;

export function computeDelivery(text: string, durationSec: number, longPauses: number): DeliveryMetrics {
  const words = text.split(/\s+/).filter(Boolean).length;
  const fillerList = countFillers(text);
  const fillers = Object.values(fillerList).reduce((a, b) => a + b, 0);
  const hedges = (text.match(HEDGES) || []).length;
  const wpm = durationSec > 3 ? Math.round(words / (durationSec / 60)) : 0;
  if (!words) return { wpm: 0, fillers: 0, fillerList: {}, longPauses, clarity: 0, confidence: 0, hedges: 0, durationSec: Math.round(durationSec) };
  const fillerRate = fillers / words;
  const pacePenalty = wpm > 175 ? (wpm - 175) * 0.5 : wpm && wpm < 105 ? (105 - wpm) * 0.4 : 0;
  const clarity = Math.round(Math.max(0, Math.min(100, 98 - fillerRate * 350 - longPauses * 3 - pacePenalty)));
  const confidence = Math.round(Math.max(0, Math.min(100, 90 - hedges * 6 - fillerRate * 200 - longPauses * 4 - pacePenalty * 0.6 - (words < 25 ? 12 : 0))));
  return { wpm, fillers, fillerList, longPauses, clarity, confidence, hedges, durationSec: Math.round(durationSec) };
}

export function useSpeechCoach() {
  const [supported] = useState(() => !!getSR());
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [level, setLevel] = useState(0);
  const [livePauses, setLivePauses] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const rec = useRef<SpeechRec | null>(null);
  const finalText = useRef("");
  const onFinal = useRef<((t: string) => void) | null>(null);
  const active = useRef(false);
  const stream = useRef<MediaStream | null>(null);
  const ctx = useRef<AudioContext | null>(null);
  const raf = useRef<number>(0);
  const t = useRef({ firstSpeech: 0, lastSpeech: 0, silenceStart: 0, pauseCounted: false, pauses: 0, startedAt: 0, lastResult: 0 });

  const cleanup = useCallback(() => {
    active.current = false;
    cancelAnimationFrame(raf.current);
    rec.current?.stop();
    rec.current = null;
    stream.current?.getTracks().forEach((tr) => tr.stop());
    stream.current = null;
    ctx.current?.close().catch(() => {});
    ctx.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const start = useCallback(
    async (onText: (t: string) => void) => {
      setError(null);
      finalText.current = "";
      onFinal.current = onText;
      t.current = { firstSpeech: 0, lastSpeech: 0, silenceStart: 0, pauseCounted: false, pauses: 0, startedAt: performance.now(), lastResult: 0 };
      setLivePauses(0);
      active.current = true;
      setListening(true);

      const SR = getSR();
      if (SR) {
        const r = new SR();
        r.continuous = true;
        r.interimResults = true;
        r.lang = "en-IN";
        r.onresult = (e) => {
          let inter = "";
          t.current.lastResult = performance.now();
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const res = e.results[i];
            if (res.isFinal) {
              finalText.current += `${res[0].transcript.trim()} `;
              onFinal.current?.(finalText.current.trim());
            } else inter += res[0].transcript;
          }
          setInterim(inter);
        };
        r.onerror = (e) => {
          if (e.error === "not-allowed") setError("Microphone permission denied");
          else if (e.error !== "no-speech" && e.error !== "aborted") setError(`Speech recognition: ${e.error}`);
        };
        r.onend = () => {
          if (active.current) {
            try {
              r.start();
            } catch {}
          }
        };
        rec.current = r;
        r.start();
      }

      // The level meter / pause detector is optional: transcription works without it.
      try {
        stream.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      } catch {
        if (!SR) setError("Microphone permission denied");
        return;
      }
      if (!active.current) {
        stream.current.getTracks().forEach((tr) => tr.stop());
        return;
      }
      ctx.current = new AudioContext();
      const analyser = ctx.current.createAnalyser();
      analyser.fftSize = 1024;
      ctx.current.createMediaStreamSource(stream.current).connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      const loop = () => {
        if (!active.current) return;
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (const v of buf) sum += v * v;
        const rms = Math.sqrt(sum / buf.length);
        setLevel(Math.min(1, rms * 12));
        const now = performance.now();
        const s = t.current;
        if (rms > SILENCE_RMS) {
          if (!s.firstSpeech) s.firstSpeech = now;
          s.lastSpeech = now;
          s.silenceStart = 0;
          s.pauseCounted = false;
        } else if (s.firstSpeech) {
          if (!s.silenceStart) s.silenceStart = now;
          if (!s.pauseCounted && now - s.silenceStart > LONG_PAUSE_MS) {
            s.pauseCounted = true;
            s.pauses++;
            setLivePauses(s.pauses);
          }
        }
        raf.current = requestAnimationFrame(loop);
      };
      loop();
    },
    [],
  );

  const stop = useCallback(
    (textOverride?: string): DeliveryMetrics => {
      const s = t.current;
      // A trailing silence at the end of an answer is not a hesitation pause.
      const trailing = s.pauseCounted ? 1 : 0;
      cleanup();
      setListening(false);
      setInterim("");
      setLevel(0);
      const dur = s.firstSpeech ? (s.lastSpeech - s.firstSpeech) / 1000 : s.lastResult ? (s.lastResult - s.startedAt) / 1000 : 0;
      return computeDelivery(textOverride ?? finalText.current, dur, Math.max(0, s.pauses - trailing));
    },
    [cleanup],
  );

  return { supported, listening, interim, level, livePauses, error, start, stop };
}
