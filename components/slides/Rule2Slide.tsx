"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { EPS, epsilonClosure } from "@/lib/automata";
import { ENFA, ENFA_GRAPH } from "@/lib/machine";
import Graph, { EdgeStatus, NodeStatus, Token } from "../Graph";
import NfaTable from "../NfaTable";
import { Narration, S, SetView, SlideHeader, useTicker } from "../ui";

const CLOSURES = ENFA.states.map((s) => ({ state: s, trace: epsilonClosure(ENFA, [s]) }));
export const RULE2_STEPS = CLOSURES.length + 2;

export default function Rule2Slide({ step }: { step: number }) {
  const current = step >= 1 && step <= CLOSURES.length ? CLOSURES[step - 1] : undefined;
  const visits = current?.trace.visits ?? [];
  const tick = useTicker(step, visits.length, 800);
  const discovered = visits.slice(0, Math.min(tick, visits.length - 1) + 1);
  const finished = current ? tick >= visits.length : false;

  const nodeStatus: Record<string, NodeStatus> = {};
  const transitionStatus: Record<string, EdgeStatus> = {};
  const tokens: Token[] = [];
  let defaultNode: NodeStatus = "idle";
  let defaultEdge: EdgeStatus = "idle";
  let caption: ReactNode = null;

  if (step === 0) {
    defaultEdge = "muted";
    for (const t of ENFA.transitions) if (t.symbol === EPS) transitionStatus[t.id] = "focus";
    caption = <>E(q) = all states reachable from q using only ε-moves, including q itself.</>;
  } else if (current) {
    defaultNode = defaultEdge = "muted";
    for (const t of ENFA.transitions) if (t.symbol === EPS) transitionStatus[t.id] = "idle";
    discovered.forEach((v, i) => {
      nodeStatus[v.state] = i === 0 ? "focus" : "member";
      if (v.via) {
        transitionStatus[v.via.id] = "focus";
        if (i === discovered.length - 1 && !finished) tokens.push({ tid: v.via.id, key: `${step}-${i}`, color: "#fcd34d" });
      }
    });
    const lastVisit = discovered.at(-1)!;
    caption = finished ? (
      <>
        E(<S id={current.state} />) = <SetView set={current.trace.result} />
      </>
    ) : lastVisit.via ? (
      <span className="font-mono">
        <S id={lastVisit.via.from} /> —ε→ <S id={lastVisit.state} />
      </span>
    ) : (
      <>
        Start at <S id={current.state} />
      </>
    );
  }

  const rowStatus: Record<string, "focus" | "member"> = {};
  const cellHot: string[] = [];
  discovered.forEach((v, i) => {
    rowStatus[v.state] = i === 0 ? "focus" : "member";
    if (v.via) cellHot.push(`${v.via.from}|${EPS}`);
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SlideHeader badge="Rule 2" title="ε-Closure" />
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col gap-2">
          <div className="canvas relative min-h-[220px] flex-1 p-5">
            <Graph
              model={ENFA_GRAPH}
              nodeStatus={nodeStatus}
              transitionStatus={transitionStatus}
              defaultNode={defaultNode}
              defaultEdge={defaultEdge}
              tokens={tokens}
            />
          </div>
          <Narration k={`${step}-${discovered.length}-${finished}`}>{caption}</Narration>
          <div className="px-1">
            <NfaTable compact colHot={EPS} rowStatus={rowStatus} cellHot={cellHot} />
          </div>
        </div>

        <div className="flex min-h-0 flex-col justify-center gap-1 overflow-y-auto pr-1">
          {CLOSURES.map((c, i) => {
            const isCurrent = c === current;
            const done = step > i + 1 || (isCurrent && finished);
            return (
              <div
                key={c.state}
                className={`rounded-lg px-4 py-2.5 transition-colors duration-300 ${isCurrent ? "bg-amber-300/10" : ""}`}
              >
                <div className="flex items-baseline gap-2 text-xl">
                  <span className="font-mono text-slate-300">
                    E(<S id={c.state} className="text-white" />)
                  </span>
                  <span className="text-slate-500">=</span>
                  <AnimatePresence mode="wait">
                    {done ? (
                      <motion.span key="r" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="text-white">
                        <SetView set={c.trace.result} />
                      </motion.span>
                    ) : isCurrent ? (
                      <motion.span key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-amber-200">
                        <SetView set={discovered.map((v) => v.state)} />
                      </motion.span>
                    ) : (
                      <span key="p" className="text-slate-600">
                        ?
                      </span>
                    )}
                  </AnimatePresence>
                </div>
                {isCurrent && discovered.length > 1 && (
                  <div className="mt-1 font-mono text-sm text-slate-400">
                    {discovered.map((v, k) => (
                      <motion.span key={v.state} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {k > 0 && " → "}
                        <S id={v.state} />
                      </motion.span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
