"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Automaton, EPS, SimFrame, Transition, isAcceptingSet, simulate } from "@/lib/automata";
import { GraphModel } from "@/lib/machine";
import Graph, { EdgeStatus, NodeStatus, Token } from "./Graph";
import { Panel, S, SetView } from "./ui";

export interface SimMachine {
  key: string;
  name: string;
  automaton: Automaton;
  graph: GraphModel;
  badges?: Record<string, string>;
}

interface SimulatorProps {
  machines: SimMachine[];
  initialInput?: string;
  presets?: string[];
  onResult?: (input: string, accepted: boolean, machine: string) => void;
  /** Extra content in the right column, under the input. */
  aside?: ReactNode;
  /** Extra content at the end of the right column. */
  after?: ReactNode;
  /** Extra content under the diagram. */
  below?: ReactNode;
}

function Move({ t }: { t: Transition }) {
  return (
    <div className={`font-mono text-sm ${t.symbol === EPS ? "text-amber-200" : "text-slate-200"}`}>
      <S id={t.from} /> <span className="text-slate-500">—{t.symbol}→</span> <S id={t.to} />
    </div>
  );
}

export default function Simulator({ machines, initialInput = "aab", presets, onResult, aside, after, below }: SimulatorProps) {
  const [mi, setMi] = useState(0);
  const machine = machines[mi];
  const a = machine.automaton;
  const [input, setInput] = useState(initialInput);
  const [run, setRun] = useState<{ id: number; input: string; frames: SimFrame[] } | null>(null);
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState("");

  const frames = useMemo(() => run?.frames ?? [], [run]);
  const last = frames.length - 1;
  const frame = frames[pos];
  const done = run !== null && pos === last;
  const accepted = done && isAcceptingSet(a, frame.active);

  useEffect(() => {
    if (!playing || !run) return;
    if (pos >= last) {
      const id = setTimeout(() => setPlaying(false), 0);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setPos((p) => p + 1), 1250 / speed);
    return () => clearTimeout(id);
  }, [playing, pos, last, run, speed]);

  useEffect(() => {
    if (done && run) onResult?.(run.input, isAcceptingSet(a, frames[last].active), machine.key);
    // report once per finished run
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, run?.id]);

  const execute = (value = input) => {
    const bad = [...value].filter((c) => !a.alphabet.includes(c));
    if (bad.length) {
      setError(`Use only ${a.alphabet.join(" and ")}.`);
      return;
    }
    setError("");
    setInput(value);
    setRun({ id: Date.now(), input: value, frames: simulate(a, value) });
    setPos(0);
    setPlaying(value.length > 0);
  };

  const switchMachine = (i: number) => {
    setMi(i);
    setRun(null);
    setPos(0);
    setPlaying(false);
  };

  const { nodeStatus, transitionStatus, tokens } = useMemo(() => {
    const nodeStatus: Record<string, NodeStatus> = {};
    const transitionStatus: Record<string, EdgeStatus> = {};
    const tokens: Token[] = [];
    if (!frame) return { nodeStatus, transitionStatus, tokens };
    for (let i = 1; i < pos; i++) for (const t of frames[i].moveEdges) transitionStatus[t.id] = "done";
    for (const t of frame.closureEdges) transitionStatus[t.id] = "focus";
    for (const t of frame.moveEdges) transitionStatus[t.id] = "active";
    for (const s of frame.active) nodeStatus[s] = a.accepting.includes(s) ? "accept" : "active";
    if (done && !accepted) for (const s of frame.active) nodeStatus[s] = "reject";
    const key = `${run?.id}-${pos}`;
    for (const t of frame.moveEdges) tokens.push({ tid: t.id, key });
    for (const t of frame.closureEdges) tokens.push({ tid: t.id, key, color: "#fcd34d", delay: pos === 0 ? 0 : 0.9 });
    return { nodeStatus, transitionStatus, tokens };
  }, [frame, frames, pos, a, done, accepted, run?.id]);

  const isPath = run !== null && frames.every((fr) => fr.active.length === 1);
  const runInput = run?.input ?? "";

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-h-0 flex-col gap-3">
        <div className="canvas relative min-h-[260px] flex-1 overflow-hidden">
          {machines.length > 1 && (
            <div className="absolute top-3 left-3 z-10 flex rounded-lg border border-white/10 p-0.5 text-xs">
              {machines.map((m, i) => (
                <button
                  key={m.key}
                  onClick={() => switchMachine(i)}
                  className={`rounded-md px-3 py-1 font-medium transition ${
                    i === mi ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
          <div className="absolute inset-0 px-6 pt-10 pb-4">
            <Graph
              key={machine.key}
              model={machine.graph}
              nodeStatus={nodeStatus}
              transitionStatus={transitionStatus}
              tokens={tokens}
              badges={machine.badges}
            />
          </div>
        </div>
        {below}
      </div>

      <div className="flex min-h-0 flex-col gap-3 overflow-y-auto pr-1">
        <Panel title="Input">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              execute();
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.trim())}
              placeholder="ε"
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-transparent px-3 py-1.5 font-mono text-white outline-none placeholder:text-slate-600 focus:border-indigo-400"
              spellCheck={false}
              aria-label="Input string"
            />
            <button type="submit" className="btn-primary">
              Run
            </button>
          </form>
          {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
          {presets && (
            <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
              {presets.map((p) => (
                <button
                  key={p || "eps"}
                  onClick={() => execute(p)}
                  className="font-mono text-sm text-slate-400 underline-offset-4 hover:text-white hover:underline"
                >
                  {p || "ε"}
                </button>
              ))}
            </div>
          )}
          <div className="mt-3 flex items-center gap-1.5">
            <button className="btn-icon" disabled={!run} onClick={() => (setPos(0), setPlaying(false))} title="Reset">
              ⏮
            </button>
            <button className="btn-icon" disabled={!run || pos === 0} onClick={() => (setPos(pos - 1), setPlaying(false))} title="Back">
              ‹
            </button>
            <button
              className="btn-icon"
              disabled={!run}
              onClick={() => {
                if (done) setPos(0);
                setPlaying(!playing || done);
              }}
              title={playing ? "Pause" : "Play"}
            >
              {playing ? "❚❚" : "▶"}
            </button>
            <button className="btn-icon" disabled={!run || done} onClick={() => (setPos(pos + 1), setPlaying(false))} title="Forward">
              ›
            </button>
            <label className="ml-auto flex items-center gap-2 text-xs text-slate-400">
              <input
                type="range"
                min={0.5}
                max={3}
                step={0.25}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-16 accent-indigo-400"
                aria-label="Speed"
              />
              <span className="w-7 font-mono">{speed}×</span>
            </label>
          </div>
        </Panel>

        {aside}

        {run && (
          <Panel title="Trace" right={<span className="font-mono text-xs text-slate-500">{pos}/{last}</span>}>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1">
                {runInput.length === 0 && <span className="font-mono text-sm text-slate-400">ε</span>}
                {[...runInput].map((c, i) => (
                  <span
                    key={i}
                    className={`grid h-7 w-7 place-items-center rounded font-mono text-sm transition-colors ${
                      i === pos - 1
                        ? "bg-rose-400 font-semibold text-white"
                        : i < pos - 1
                          ? "bg-white/10 text-slate-300"
                          : "border border-white/10 text-slate-500"
                    }`}
                  >
                    {c}
                  </span>
                ))}
              </div>
              <div className="text-sm">
                <span className="text-slate-400">Current: </span>
                {frame.active.length === 1 ? (
                  <S id={frame.active[0]} className="text-white" />
                ) : (
                  <SetView set={frame.active} className="text-white" />
                )}
              </div>
              {(frame.moveEdges.length > 0 || frame.closureEdges.length > 0) && (
                <div>
                  {frame.moveEdges.map((t) => (
                    <Move key={t.id} t={t} />
                  ))}
                  {frame.closureEdges.map((t) => (
                    <Move key={t.id} t={t} />
                  ))}
                </div>
              )}
            </div>
          </Panel>
        )}

        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`rounded-xl border px-4 py-3 ${
                accepted ? "border-emerald-400/40 bg-emerald-400/5" : "border-rose-400/40 bg-rose-400/5"
              }`}
            >
              <div className={`font-semibold ${accepted ? "text-emerald-300" : "text-rose-300"}`}>
                {accepted ? "Accepted" : "Rejected"}
              </div>
              {isPath && (
                <div className="mt-1 font-mono text-sm text-slate-300">
                  {frames.map((fr, i) => (
                    <span key={i}>
                      {i > 0 && <span className="text-slate-500"> —{fr.symbol}→ </span>}
                      <S id={fr.active[0] ?? "∅"} />
                    </span>
                  ))}
                </div>
              )}
              {!isPath && (
                <div className="mt-1 text-sm text-slate-300">
                  Final set <SetView set={frame.active} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {after}
      </div>
    </div>
  );
}
