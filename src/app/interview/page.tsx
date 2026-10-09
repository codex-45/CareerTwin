"use client";

import clsx from "clsx";
import { Activity, Brain, Camera, CameraOff, ChevronRight, Eye, Mic, MicOff, RotateCcw, ShieldAlert, Sparkles, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Badge, Bar, Button, Card, NeedTwin, PageHeader, ScoreRing, SourceTag, scoreColor } from "@/components/ui";
import { usePresenceCoach } from "@/hooks/usePresenceCoach";
import { computeDelivery, useSpeechCoach } from "@/hooks/useSpeechCoach";
import { statusOf } from "@/lib/engine";
import { BANK, LEVELS, TOPICS, bankQuestion, decideNext, followupQuestion, initialState, summarise, topicsForSkills, type AdaptiveState, type Decision } from "@/lib/interview";
import { api, useApp, useHydrated } from "@/lib/store";
import type { DeliveryMetrics, Evaluation, InterviewQuestion, InterviewTurn, Level } from "@/lib/types";

type Phase = "setup" | "asking" | "evaluated" | "report";

const LEVEL_LABEL: Record<Level, string> = { easy: "Easy", medium: "Medium", hard: "Hard", scenario: "Scenario" };

export default function InterviewPage() {
  const hydrated = useHydrated();
  const twin = useApp((s) => s.twin);
  if (!hydrated) return null;
  if (!twin) return <NeedTwin feature="The Adaptive Interviewer" />;
  return <Interview />;
}

function Interview() {
  const { twin, gap, addInterview } = useApp();
  const suggested = useMemo(() => {
    const own = topicsForSkills(twin!.technical.filter((s) => statusOf(s) === "evidenced").map((s) => s.name), 2);
    const gapTopic = gap ? topicsForSkills(gap.items.filter((i) => i.status !== "evidenced").map((i) => i.name), 1) : [];
    return [...new Set([...own, ...gapTopic])].slice(0, 3);
  }, [twin, gap]);

  const [topics, setTopics] = useState<string[]>(suggested.length ? suggested : ["DSA"]);
  const [maxQ, setMaxQ] = useState(6);
  const [voice, setVoice] = useState(true);
  const [cam, setCam] = useState(false);
  const [consent, setConsent] = useState(false);
  const [tts, setTts] = useState(true);

  const [phase, setPhase] = useState<Phase>("setup");
  const [adaptive, setAdaptive] = useState<AdaptiveState>(initialState(topics));
  const [current, setCurrent] = useState<InterviewQuestion | null>(null);
  const [qSource, setQSource] = useState<string>();
  const [answer, setAnswer] = useState("");
  const [turns, setTurns] = useState<InterviewTurn[]>([]);
  const [evaluation, setEvaluation] = useState<(Evaluation & { source?: string }) | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [delivery, setDelivery] = useState<DeliveryMetrics | undefined>();
  const [busy, setBusy] = useState(false);
  const [showIdeal, setShowIdeal] = useState(false);
  const asked = useRef<Set<string>>(new Set());
  const spoken = useRef<DeliveryMetrics | undefined>(undefined);

  const speech = useSpeechCoach();
  const { videoRef, canvasRef, ...presence } = usePresenceCoach();

  const say = (text: string) => {
    if (!tts || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/`/g, ""));
    u.rate = 1.02;
    window.speechSynthesis.speak(u);
  };

  const fetchQuestion = async (topic: string, level: Level, kind: InterviewQuestion["kind"], prev?: InterviewQuestion, focus?: string): Promise<InterviewQuestion> => {
    try {
      const r = await api<{ question: InterviewQuestion | null; source: string }>("/api/interview", {
        action: "question",
        topic,
        level,
        kind,
        focus,
        asked: [...asked.current],
        context: `${twin!.headline}. Projects: ${twin!.projects.map((p) => p.title).join(", ")}. ${prev ? `Previous question: ${prev.q}` : ""}`,
      });
      if (r.question) {
        setQSource("ai");
        return r.question;
      }
    } catch {}
    setQSource("engine");
    if (kind !== "core" && prev) return followupQuestion(prev, kind, focus);
    const order = [topic, ...topics.filter((t) => t !== topic), ...TOPICS];
    for (const lv of [level, ...LEVELS]) {
      for (const t of order) {
        const q = bankQuestion(t, lv);
        if (!asked.current.has(q.q)) return q;
      }
    }
    return bankQuestion(topic, level);
  };

  const ask = (q: InterviewQuestion) => {
    asked.current.add(q.q);
    setCurrent(q);
    setAnswer("");
    setEvaluation(null);
    setDelivery(undefined);
    setShowIdeal(false);
    setPhase("asking");
    spoken.current = undefined;
    say(q.q);
  };

  const begin = async () => {
    setBusy(true);
    asked.current = new Set();
    setTurns([]);
    const st = initialState(topics);
    setAdaptive(st);
    if (cam && consent) presence.start();
    const q = await fetchQuestion(st.topics[0], "easy", "core");
    setBusy(false);
    ask(q);
  };

  const submit = async () => {
    if (!current) return;
    setBusy(true);
    window.speechSynthesis?.cancel();
    const d = speech.listening ? speech.stop(answer) : spoken.current;
    spoken.current = undefined;
    setDelivery(d);
    let ev: Evaluation & { source?: string };
    try {
      const r = await api<{ evaluation: Evaluation; source: string }>("/api/interview", { action: "evaluate", question: current, answer });
      ev = { ...r.evaluation, source: r.source };
    } catch {
      const { heuristicEvaluate } = await import("@/lib/interview");
      ev = { ...heuristicEvaluate(current, answer), source: "engine" };
    }
    const dec = decideNext(adaptive, ev, current);
    setEvaluation(ev);
    setDecision(dec);
    setTurns((t) => [...t, { question: current, answer, evaluation: ev, delivery: d, decision: dec.reason }]);
    setBusy(false);
    setPhase("evaluated");
  };

  const next = async () => {
    if (!decision || !current) return;
    if (turns.length >= maxQ) return finish();
    setBusy(true);
    const q = await fetchQuestion(decision.next.topic, decision.next.level, decision.next.kind, current, decision.next.focus);
    const st = decision.state;
    const topicList = st.topics.includes(q.topic) ? st.topics : [...st.topics, q.topic];
    setAdaptive({ ...st, topics: topicList, topicIdx: topicList.indexOf(q.topic), levelIdx: LEVELS.indexOf(q.level) });
    setBusy(false);
    ask(q);
  };

  const finish = () => {
    const sum = summarise(turns);
    const dels = turns.map((t) => t.delivery).filter(Boolean) as DeliveryMetrics[];
    const avg = (f: (d: DeliveryMetrics) => number) => (dels.length ? Math.round(dels.reduce((a, d) => a + f(d), 0) / dels.length) : 0);
    const deliveryAgg: DeliveryMetrics | undefined = dels.length
      ? {
          wpm: avg((d) => d.wpm),
          fillers: dels.reduce((a, d) => a + d.fillers, 0),
          fillerList: dels.reduce<Record<string, number>>((acc, d) => {
            for (const [k, v] of Object.entries(d.fillerList)) acc[k] = (acc[k] ?? 0) + v;
            return acc;
          }, {}),
          longPauses: dels.reduce((a, d) => a + d.longPauses, 0),
          clarity: avg((d) => d.clarity),
          confidence: avg((d) => d.confidence),
          hedges: dels.reduce((a, d) => a + d.hedges, 0),
          durationSec: dels.reduce((a, d) => a + d.durationSec, 0),
        }
      : undefined;
    const presenceAgg = presence.on && presence.metrics.samples > 0 ? presence.metrics : undefined;
    presence.stop();
    if (speech.listening) speech.stop();
    window.speechSynthesis?.cancel();
    addInterview({ at: new Date().toISOString(), overall: sum.overall, questions: turns.length, topics: sum.topics, delivery: deliveryAgg, presence: presenceAgg });
    setPhase("report");
  };

  const toggleMic = () => {
    if (speech.listening) {
      spoken.current = speech.stop(answer);
      setDelivery(spoken.current);
    } else {
      const base = answer ? `${answer} ` : "";
      speech.start((t) => setAnswer(base + t));
    }
  };

  /* ------------------------------ render ------------------------------ */

  if (phase === "setup") {
    return (
      <div className="fade-up">
        <PageHeader icon={Brain} title="AI Interviewer with Adaptive Difficulty" subtitle="Not a random-question chatbot: every answer is scored on conceptual knowledge vs practical application, and the next question adapts — Easy → Medium → Hard → Scenario → Follow-ups." />
        <div className="grid gap-5 lg:grid-cols-3">
          <Card title="1 · Topics" className="lg:col-span-2">
            <p className="mb-3 text-xs text-slate-500">Pre-selected from your twin&apos;s proven skills{gap ? ` and gaps for ${gap.roleTitle}` : ""}.</p>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTopics((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))}
                  className={clsx("rounded-xl border px-3.5 py-2 text-sm transition", topics.includes(t) ? "border-violet-400/50 bg-violet-500/15 text-white" : "border-white/10 text-slate-400 hover:bg-white/5")}
                >
                  {t}
                  {suggested.includes(t) && <span className="ml-1.5 text-[10px] text-violet-300">suggested</span>}
                </button>
              ))}
            </div>
            <div className="mt-6">
              <div className="mb-2 text-sm font-semibold text-slate-200">2 · Length</div>
              <div className="flex gap-2">
                {[4, 6, 8, 10].map((n) => (
                  <button key={n} onClick={() => setMaxQ(n)} className={clsx("rounded-lg border px-3 py-1.5 text-sm", maxQ === n ? "border-violet-400/50 bg-violet-500/15 text-white" : "border-white/10 text-slate-400")}>
                    {n} questions
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Sparkles className="h-4 w-4 text-violet-300" /> How adaptation works
              </div>
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-slate-300">
                {["Easy", "Medium", "Hard", "Scenario", "Follow-ups"].map((l, i) => (
                  <span key={l} className="flex items-center gap-2">
                    <span className="rounded-md bg-white/5 px-2 py-1">{l}</span>
                    {i < 4 && <ChevronRight className="h-3 w-3 text-slate-600" />}
                  </span>
                ))}
              </div>
              <ul className="mt-3 space-y-1 text-xs text-slate-400">
                <li>• Score ≥ 7 → difficulty goes up</li>
                <li>• Strong theory but weak application → practical, project-based follow-up</li>
                <li>• Partially correct → probe the exact missing concept</li>
                <li>• Struggling → step down and rebuild fundamentals</li>
              </ul>
            </div>
          </Card>
          <Card title="3 · Speech & presence coach">
            <Toggle on={voice} set={setVoice} icon={Mic} label="Answer by voice" sub={speech.supported ? "Live transcript, pace, fillers, pauses" : "Browser lacks speech-to-text (use Chrome) — pauses still measured"} />
            <Toggle on={tts} set={setTts} icon={Volume2} label="Interviewer speaks questions" sub="Text-to-speech" />
            <Toggle on={cam} set={setCam} icon={Camera} label="Webcam presence signals" sub="Face visibility, looking away, movement, posture" />
            {cam && (
              <label className="mt-3 flex gap-2 rounded-xl border border-amber-400/20 bg-amber-500/5 p-3 text-xs text-amber-100/90">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
                <span>
                  I consent to webcam analysis. Video is processed <b>locally in my browser</b> and never uploaded. CareerTwin only measures observable presentation signals — it does{" "}
                  <b>not</b> infer emotions, honesty or personality.
                </span>
              </label>
            )}
            <Button className="mt-5 w-full py-3" onClick={begin} loading={busy} disabled={!topics.length || (cam && !consent)}>
              Start interview
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (phase === "report") return <Report turns={turns} onRestart={() => setPhase("setup")} />;

  const levelIdx = current ? LEVELS.indexOf(current.level) : 0;

  return (
    <div className="fade-up">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge tone="violet">
            Question {turns.length + (phase === "asking" ? 1 : 0)} / {maxQ}
          </Badge>
          <span className="text-sm text-slate-400">{current?.topic}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setTts(!tts)} className="rounded-lg p-2 text-slate-400 hover:bg-white/5" title="Toggle voice">
            {tts ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <Button variant="ghost" onClick={finish} disabled={!turns.length}>
            End & see report
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="flex items-center gap-1.5">
            {LEVELS.map((l, i) => (
              <div key={l} className="flex flex-1 flex-col gap-1">
                <div className={clsx("h-1.5 rounded-full", i <= levelIdx ? "bg-gradient-to-r from-violet-500 to-cyan-400" : "bg-white/10")} />
                <span className={clsx("text-[11px]", i === levelIdx ? "text-white" : "text-slate-500")}>{LEVEL_LABEL[l]}</span>
              </div>
            ))}
          </div>

          <Card>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge tone="cyan">{LEVEL_LABEL[current!.level]}</Badge>
              {current!.kind === "practical" && <Badge tone="amber">Practical follow-up</Badge>}
              {current!.kind === "followup" && <Badge tone="amber">Follow-up</Badge>}
              <SourceTag source={qSource} />
            </div>
            <p className="text-lg leading-relaxed text-white">{current!.q}</p>
          </Card>

          <Card>
            <textarea
              className="input h-40 text-sm"
              placeholder={voice ? "Click the mic and answer out loud — or type here…" : "Type your answer…"}
              value={speech.interim ? `${answer} ${speech.interim}` : answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={phase !== "asking"}
            />
            {phase === "asking" && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {voice && (
                  <button
                    onClick={toggleMic}
                    className={clsx("grid h-11 w-11 place-items-center rounded-full transition", speech.listening ? "rec-pulse bg-rose-500 text-white" : "bg-white/10 text-slate-200 hover:bg-white/15")}
                    title={speech.listening ? "Stop recording" : "Record answer"}
                  >
                    {speech.listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>
                )}
                {speech.listening && (
                  <div className="flex items-end gap-0.5">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} className="w-1 rounded-full bg-violet-400 transition-all" style={{ height: `${4 + Math.max(0, speech.level * 28 * (0.4 + Math.abs(Math.sin(i * 1.7 + speech.level * 9))))}px` }} />
                    ))}
                  </div>
                )}
                {speech.error && <span className="text-xs text-rose-300">{speech.error}</span>}
                <Button className="ml-auto" onClick={submit} loading={busy} disabled={!answer.trim() && !speech.interim}>
                  Submit answer
                </Button>
              </div>
            )}
          </Card>

          {phase === "evaluated" && evaluation && decision && (
            <div className="fade-up space-y-5">
              <Card title="Evaluation" action={<SourceTag source={evaluation.source} />}>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="flex flex-col items-center">
                    <ScoreRing value={evaluation.overall} max={10} size={92} label="overall" />
                  </div>
                  {(
                    [
                      ["Conceptual", evaluation.conceptual],
                      ["Practical", evaluation.practical],
                      ["Communication", evaluation.communication],
                    ] as const
                  ).map(([l, v]) => (
                    <div key={l} className="flex flex-col justify-center">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-slate-400">{l}</span>
                        <span className="text-white">{v}/10</span>
                      </div>
                      <Bar value={v} max={10} />
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-slate-300">{evaluation.feedback}</p>
                {evaluation.missed.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="text-xs text-slate-500">Missed:</span>
                    {evaluation.missed.map((m) => (
                      <Badge key={m} tone="red">{m}</Badge>
                    ))}
                  </div>
                )}
                <button onClick={() => setShowIdeal(!showIdeal)} className="mt-3 text-xs text-violet-300 hover:text-violet-200">
                  {showIdeal ? "Hide" : "Show"} model answer
                </button>
                {showIdeal && <p className="mt-2 rounded-xl bg-black/30 p-3 text-sm text-slate-300">{current!.ideal}</p>}
              </Card>

              <Card className="border-violet-400/30 bg-violet-500/[0.06]">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-300">
                  <Brain className="h-4 w-4" /> Interviewer&apos;s adaptive decision
                </div>
                <div className="mt-2 font-mono text-sm text-slate-200">{decision.diagnosis}</div>
                <div className="mt-2 text-sm text-white">→ {decision.reason}</div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={next} loading={busy}>
                    {turns.length >= maxQ ? "See final report" : "Next question"} <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <Card title={<span className="flex items-center gap-2"><Camera className="h-4 w-4" /> Presence</span>} action={presence.on ? <Badge tone={presence.status === "ready" ? "green" : "amber"}>{presence.status === "ready" ? "analysing" : presence.status}</Badge> : null}>
            <div className={clsx("relative overflow-hidden rounded-xl bg-black/40", !presence.on && "hidden")}>
              <video ref={videoRef} muted playsInline className="aspect-[4/3] w-full -scale-x-100 object-cover" />
              <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100" />
              {presence.status === "ready" && (
                <div className="absolute bottom-2 left-2 flex gap-1.5">
                  <Badge tone={presence.live.face ? "green" : "red"}>{presence.live.face ? "Face visible" : "No face"}</Badge>
                  {presence.live.face && presence.live.lookingAway && <Badge tone="amber">Looking away</Badge>}
                </div>
              )}
            </div>
            {!presence.on ? (
              <div className="text-center">
                <CameraOff className="mx-auto h-8 w-8 text-slate-600" />
                <p className="mt-2 text-xs text-slate-500">Webcam off</p>
                <label className="mt-3 flex gap-2 text-left text-[11px] text-slate-400">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                  I consent to local, on-device analysis (no emotion inference, nothing uploaded)
                </label>
                <Button variant="outline" className="mt-3 w-full" disabled={!consent} onClick={presence.start}>
                  Turn on camera
                </Button>
              </div>
            ) : (
              <div className="mt-3 space-y-2 text-xs">
                <Metric label="Face visible" value={`${presence.metrics.faceVisiblePct}%`} good={presence.metrics.faceVisiblePct >= 85} />
                <Metric label="Looking away" value={`${presence.metrics.lookingAwayPct}%`} good={presence.metrics.lookingAwayPct <= 25} />
                <Metric label="Movement" value={presence.metrics.movementScore < 30 ? "Steady" : presence.metrics.movementScore < 60 ? "Moderate" : "Excessive"} good={presence.metrics.movementScore < 60} />
                <Metric label="Posture shifts" value={String(presence.metrics.postureShifts)} good={presence.metrics.postureShifts <= 4} />
                {presence.error && <p className="text-rose-300">{presence.error}</p>}
              </div>
            )}
          </Card>

          <Card title={<span className="flex items-center gap-2"><Activity className="h-4 w-4" /> Speech delivery</span>}>
            {speech.listening ? (
              <div className="space-y-2 text-xs">
                <Metric label="Live words" value={String(answer.split(/\s+/).filter(Boolean).length)} />
                <Metric label="Long pauses (>2s)" value={String(speech.livePauses)} good={speech.livePauses < 3} />
                <Metric label="Filler words" value={String(computeDelivery(answer, 0, 0).fillers)} good={computeDelivery(answer, 0, 0).fillers < 4} />
              </div>
            ) : delivery ? (
              <DeliveryBlock d={delivery} />
            ) : (
              <p className="text-xs text-slate-500">Record a spoken answer to see pace (WPM), filler words, long pauses, clarity and delivery confidence.</p>
            )}
          </Card>

          {turns.length > 0 && (
            <Card title="Knowledge state">
              <KnowledgeState turns={turns} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Toggle({ on, set, icon: Icon, label, sub }: { on: boolean; set: (v: boolean) => void; icon: React.ElementType; label: string; sub: string }) {
  return (
    <button onClick={() => set(!on)} className="mb-2 flex w-full items-center gap-3 rounded-xl border border-white/10 p-3 text-left hover:bg-white/[0.03]">
      <Icon className={clsx("h-4 w-4", on ? "text-violet-300" : "text-slate-500")} />
      <div className="flex-1">
        <div className="text-sm text-slate-200">{label}</div>
        <div className="text-[11px] text-slate-500">{sub}</div>
      </div>
      <div className={clsx("h-5 w-9 rounded-full p-0.5 transition", on ? "bg-violet-500" : "bg-white/15")}>
        <div className={clsx("h-4 w-4 rounded-full bg-white transition", on && "translate-x-4")} />
      </div>
    </button>
  );
}

function Metric({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2">
      <span className="text-slate-400">{label}</span>
      <span className={clsx("font-mono font-medium", good === undefined ? "text-white" : good ? "text-emerald-300" : "text-amber-300")}>{value}</span>
    </div>
  );
}

function DeliveryBlock({ d }: { d: DeliveryMetrics }) {
  return (
    <div className="space-y-2 font-mono text-xs">
      <Metric label="Speaking speed" value={d.wpm ? `${d.wpm} WPM` : "—"} good={d.wpm ? d.wpm >= 110 && d.wpm <= 170 : undefined} />
      <Metric label="Filler words" value={String(d.fillers)} good={d.fillers <= 3} />
      <Metric label="Long pauses" value={String(d.longPauses)} good={d.longPauses <= 2} />
      <Metric label="Hedging phrases" value={String(d.hedges)} good={d.hedges <= 2} />
      <Metric label="Answer clarity" value={`${d.clarity}%`} good={d.clarity >= 70} />
      <Metric label="Delivery confidence" value={`${d.confidence}%`} good={d.confidence >= 70} />
      {Object.keys(d.fillerList).length > 0 && (
        <div className="pt-1 text-[11px] text-slate-500">
          Fillers:{" "}
          {Object.entries(d.fillerList)
            .map(([k, v]) => `“${k}” ×${v}`)
            .join(", ")}
        </div>
      )}
      <p className="pt-1 font-sans text-[10px] text-slate-600">Confidence = heuristic from pace, pauses, fillers & hedging — not a personality judgement.</p>
    </div>
  );
}

function KnowledgeState({ turns }: { turns: InterviewTurn[] }) {
  const { topics } = summarise(turns);
  return (
    <div className="space-y-3">
      {topics.map((t) => (
        <div key={t.topic}>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-slate-300">{t.topic}</span>
            <span className="text-slate-500">reached: {t.reached}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
            <div>
              Conceptual <Bar value={t.conceptual} max={10} />
            </div>
            <div>
              Practical <Bar value={t.practical} max={10} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Report({ turns, onRestart }: { turns: InterviewTurn[]; onRestart: () => void }) {
  const rec = useApp((s) => s.interviews[0]);
  const { topics, overall } = summarise(turns);
  const weakest = [...topics].sort((a, b) => a.overall - b.overall)[0];
  const practicalGap = topics.filter((t) => t.conceptual - t.practical >= 2);
  return (
    <div className="fade-up space-y-5">
      <PageHeader icon={Brain} title="Interview report" subtitle="Your Career Twin has been updated with this performance — skill strengths and role readiness now reflect how you actually answered.">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRestart}>
            <RotateCcw className="h-4 w-4" /> New interview
          </Button>
          <Link href="/pitch" className="rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2.5 text-sm font-medium text-white">
            Generate my pitch →
          </Link>
        </div>
      </PageHeader>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="flex flex-col items-center">
          <ScoreRing value={overall} max={10} size={150} label="overall score" />
          <div className="mt-4 space-y-1 text-center text-sm text-slate-300">
            <div>{turns.length} adaptive questions</div>
            <div className="text-slate-500">Highest level reached: {LEVELS[Math.max(...turns.filter((t) => t.evaluation.overall >= 6).map((t) => LEVELS.indexOf(t.question.level)), 0)]}</div>
          </div>
        </Card>
        <Card title="Per-topic diagnosis" className="lg:col-span-2">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr>
                <th className="pb-2">Topic</th>
                <th className="pb-2">Conceptual</th>
                <th className="pb-2">Practical</th>
                <th className="pb-2">Reached</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((t) => (
                <tr key={t.topic} className="border-t border-white/5">
                  <td className="py-2.5 text-slate-200">{t.topic}</td>
                  <td style={{ color: scoreColor(t.conceptual, 10) }}>{t.conceptual}/10</td>
                  <td style={{ color: scoreColor(t.practical, 10) }}>{t.practical}/10</td>
                  <td className="capitalize text-slate-400">{t.reached}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 space-y-1.5 text-sm text-slate-300">
            {practicalGap.map((t) => (
              <div key={t.topic} className="flex gap-2">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" /> {t.topic}: conceptual knowledge is strong but practical application is weak — build or deploy something with it.
              </div>
            ))}
            {weakest && weakest.overall < 6 && (
              <div className="flex gap-2">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" /> Focus next on <b>{weakest.topic}</b> ({BANK[weakest.topic]?.skills.slice(0, 3).join(", ") || "STAR stories"}).
              </div>
            )}
          </div>
        </Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title={<span className="flex items-center gap-2"><Mic className="h-4 w-4" /> Speech coach</span>}>
          {rec?.delivery ? <DeliveryBlock d={rec.delivery} /> : <p className="text-sm text-slate-500">No spoken answers recorded this session.</p>}
        </Card>
        <Card title={<span className="flex items-center gap-2"><Eye className="h-4 w-4" /> Presence signals</span>}>
          {rec?.presence ? (
            <div className="space-y-2 text-xs">
              <Metric label="Face visible" value={`${rec.presence.faceVisiblePct}%`} good={rec.presence.faceVisiblePct >= 85} />
              <Metric label="Looking away from camera" value={`${rec.presence.lookingAwayPct}%`} good={rec.presence.lookingAwayPct <= 25} />
              <Metric label="Movement" value={`${rec.presence.movementScore}/100`} good={rec.presence.movementScore < 60} />
              <Metric label="Posture shifts" value={String(rec.presence.postureShifts)} good={rec.presence.postureShifts <= 4} />
              <p className="pt-1 text-[10px] text-slate-600">Observable signals only. CareerTwin does not infer emotion, honesty or personality from faces.</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Webcam was off for this session.</p>
          )}
        </Card>
      </div>
      <Card title="Transcript">
        <div className="space-y-4">
          {turns.map((t, i) => (
            <div key={i} className="border-l-2 border-violet-400/30 pl-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge tone="cyan">{LEVEL_LABEL[t.question.level]}</Badge>
                <span className="text-slate-500">{t.question.topic}</span>
                <span className="ml-auto font-mono" style={{ color: scoreColor(t.evaluation.overall, 10) }}>
                  {t.evaluation.overall}/10
                </span>
              </div>
              <div className="mt-1 text-sm text-white">{t.question.q}</div>
              <div className="mt-1 text-sm text-slate-400">{t.answer}</div>
              <div className="mt-1 text-xs text-violet-300">→ {t.decision}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
