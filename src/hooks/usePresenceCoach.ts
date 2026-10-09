"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PresenceMetrics } from "@/lib/types";

interface Landmarker {
  detectForVideo: (v: HTMLVideoElement, ts: number) => { faceLandmarks: { x: number; y: number }[][] };
  close: () => void;
}

export interface PresenceLive {
  face: boolean;
  lookingAway: boolean;
  moving: boolean;
}

const SAMPLE_MS = 120;

let consolePatched = false;
/** MediaPipe's WASM runtime logs routine "INFO:" lines via console.error, which dev overlays treat as errors. */
function silenceMediapipeInfo() {
  if (consolePatched) return;
  consolePatched = true;
  const orig = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && /^(INFO|W\d{4}|I\d{4}):?/.test(args[0])) return;
    orig(...args);
  };
}

export function usePresenceCoach() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [on, setOn] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<PresenceLive>({ face: false, lookingAway: false, moving: false });
  const [metrics, setMetrics] = useState<PresenceMetrics>({ faceVisiblePct: 0, lookingAwayPct: 0, movementScore: 0, postureShifts: 0, samples: 0 });

  const stream = useRef<MediaStream | null>(null);
  const lm = useRef<Landmarker | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const acc = useRef({ samples: 0, face: 0, away: 0, move: 0, shifts: 0, prev: null as null | { x: number; y: number }, base: null as null | { size: number; y: number }, lastShift: 0 });

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    lm.current?.close();
    lm.current = null;
    setOn(false);
    setStatus("idle");
  }, []);

  useEffect(() => stop, [stop]);

  const tick = useCallback(() => {
    const v = videoRef.current;
    const l = lm.current;
    if (!v || !l || v.readyState < 2) return;
    const res = l.detectForVideo(v, performance.now());
    const a = acc.current;
    a.samples++;
    const pts = res.faceLandmarks?.[0];
    const cv = canvasRef.current;
    const g = cv?.getContext("2d");
    if (cv && g) {
      cv.width = v.videoWidth;
      cv.height = v.videoHeight;
      g.clearRect(0, 0, cv.width, cv.height);
    }
    if (!pts) {
      setLive({ face: false, lookingAway: true, moving: false });
    } else {
      a.face++;
      const nose = pts[1];
      const le = pts[33];
      const re = pts[263];
      const top = pts[10];
      const chin = pts[152];
      const yaw = (nose.x - le.x) / (re.x - le.x || 1e-6);
      const pitch = (nose.y - top.y) / (chin.y - top.y || 1e-6);
      const away = yaw < 0.28 || yaw > 0.72 || pitch < 0.3 || pitch > 0.72;
      if (away) a.away++;
      const d = a.prev ? Math.hypot(nose.x - a.prev.x, nose.y - a.prev.y) : 0;
      a.prev = { x: nose.x, y: nose.y };
      a.move += d;
      const size = Math.hypot(re.x - le.x, re.y - le.y);
      if (!a.base) a.base = { size, y: nose.y };
      else {
        const now = performance.now();
        if ((Math.abs(size - a.base.size) / a.base.size > 0.18 || Math.abs(nose.y - a.base.y) > 0.09) && now - a.lastShift > 2500) {
          a.shifts++;
          a.lastShift = now;
          a.base = { size, y: nose.y };
        } else {
          a.base = { size: a.base.size * 0.98 + size * 0.02, y: a.base.y * 0.98 + nose.y * 0.02 };
        }
      }
      setLive({ face: true, lookingAway: away, moving: d > 0.02 });
      if (cv && g) {
        g.fillStyle = away ? "rgba(251,191,36,0.75)" : "rgba(167,139,250,0.75)";
        for (let i = 0; i < pts.length; i += 3) {
          g.beginPath();
          g.arc(pts[i].x * cv.width, pts[i].y * cv.height, 1.3, 0, Math.PI * 2);
          g.fill();
        }
      }
    }
    if (a.samples % 8 === 0) {
      setMetrics({
        faceVisiblePct: Math.round((a.face / a.samples) * 100),
        lookingAwayPct: Math.round(((a.away + (a.samples - a.face)) / a.samples) * 100),
        movementScore: Math.min(100, Math.round((a.move / Math.max(1, a.face)) * 2500)),
        postureShifts: a.shifts,
        samples: a.samples,
      });
    }
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setStatus("loading");
    acc.current = { samples: 0, face: 0, away: 0, move: 0, shifts: 0, prev: null, base: null, lastShift: 0 };
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" } });
      setOn(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream.current;
        await videoRef.current.play().catch(() => {});
      }
    } catch {
      setStatus("error");
      setError("Camera permission denied");
      return;
    }
    try {
      silenceMediapipeInfo();
      const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const fileset = await FilesetResolver.forVisionTasks("/mediapipe");
      lm.current = (await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: "/mediapipe/face_landmarker.task", delegate: "GPU" },
        runningMode: "VIDEO",
        numFaces: 1,
      })) as unknown as Landmarker;
      setStatus("ready");
      timer.current = setInterval(tick, SAMPLE_MS);
    } catch (e) {
      setStatus("error");
      setError(`Face analysis unavailable: ${(e as Error).message}`);
    }
  }, [tick]);

  useEffect(() => {
    if (on && videoRef.current && stream.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = stream.current;
      videoRef.current.play().catch(() => {});
    }
  }, [on]);

  return { videoRef, canvasRef, on, status, error, live, metrics, start, stop };
}
