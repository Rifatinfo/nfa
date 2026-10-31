"use client";

import { AnimatePresence, motion } from "framer-motion";
import { EPS, delta, setKey } from "@/lib/automata";
import { ENFA, ENFA_GRAPH, SUBSET } from "@/lib/machine";
import Graph, { EdgeStatus, NodeStatus, Token } from "../Graph";
import NfaTable from "../NfaTable";
import { Panel, SetView, SlideHeader, useTicker } from "../ui";

/** Transitions computed on this page: every non-empty subset × every symbol. */
const R3 = SUBSET.steps.filter((s) => s.fromSet.length > 0);
const LIVE = SUBSET.dstates.filter((d) => d.set.length > 0);
export const RULE3_STEPS = R3.length + 2;
const START = SUBSET.start;

function Bracket({ list }: { list: string[] }) {
  return list.length === 0 ? <span className="font-mono">∅</span> : <SetView set={list} />;
}

export default function Rule3Slide({ step }: { step: number }) {
  const cur = step >= 1 && step <= R3.length ? R3[step - 1] : undefined;
  const isStart = step === 0;
  const isEnd = step === R3.length + 1;
  const tick = useTicker(step, isStart ? START.visits.length : cur ? 3 : 0, isStart ? 750 : 1150);
  const phase = cur ? tick : 0;

  const doneCount = cur ? step - 1 + (phase >= 3 ? 1 : 0) : isEnd ? R3.length : 0;
  const done = R3.slice(0, doneCount);
  const knownKeys = new Set([setKey(START.result), ...done.map((s) => setKey(s.toSet))]);

  const nodeStatus: Record<string, NodeStatus> = {};
  const transitionStatus: Record<string, EdgeStatus> = {};
  const tokens: Token[] = [];
  let defaultNode: NodeStatus = "muted";
  let defaultEdge: EdgeStatus = "muted";
  const rowStatus: Record<string, "focus" | "member"> = {};
  const cellHot: string[] = [];
  let colHot: string | undefined;

  if (isStart) {
    const seen = START.visits.slice(0, Math.min(tick, START.visits.length - 1) + 1);
    seen.forEach((v, i) => {
      nodeStatus[v.state] = i === 0 ? "focus" : "member";
      rowStatus[v.state] = i === 0 ? "focus" : "member";
      if (v.via) {
        transitionStatus[v.via.id] = "focus";
        cellHot.push(`${v.via.from}|${EPS}`);
        if (i === seen.length - 1 && tick < START.visits.length) tokens.push({ tid: v.via.id, key: `s${i}`, color: "#fcd34d" });
      }
    });
    colHot = EPS;
  } else if (cur) {
    colHot = phase >= 2 ? EPS : cur.symbol;
    for (const r of cur.fromSet) {
      nodeStatus[r] = "member";
      rowStatus[r] = "member";
      if (phase >= 1) cellHot.push(`${r}|${cur.symbol}`);
    }
    if (phase >= 1) {
      for (const t of cur.moveEdges) {
        transitionStatus[t.id] = "active";
        nodeStatus[t.to] = "active";
        if (phase === 1) tokens.push({ tid: t.id, key: `${step}-m` });
      }
    }
    if (phase >= 2) {
      for (const v of cur.closure.visits) {
        nodeStatus[v.state] = "active";
        rowStatus[v.state] = "focus";
        if (v.via) {
          transitionStatus[v.via.id] = "focus";
          cellHot.push(`${v.via.from}|${EPS}`);
          if (phase === 2) tokens.push({ tid: v.via.id, key: `${step}-e`, color: "#fcd34d" });
        }
      }
    }
  } else {
    defaultNode = "idle";
    defaultEdge = "idle";
  }

  const resultOf = (set: string[], x: string) =>
    done.find((s) => setKey(s.fromSet) === setKey(set) && s.symbol === x);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SlideHeader badge="Rules 3 & 4" title="Subset Construction" />
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col gap-3">
          <div className="canvas relative min-h-[200px] flex-1 p-4">
            <Graph
              model={ENFA_GRAPH}
              nodeStatus={nodeStatus}
              transitionStatus={transitionStatus}
              defaultNode={defaultNode}
              defaultEdge={defaultEdge}
              tokens={tokens}
            />
          </div>
          <div className="px-1">
            <NfaTable compact rowStatus={rowStatus} colHot={colHot} cellHot={cellHot} />
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1">
          <div className="space-y-1 px-1 font-mono text-[15px] text-slate-400">
            <div className={isStart ? "text-amber-200" : ""}>q₀&apos; = E({"{"}q₀{"}"})</div>
            <div className={cur ? "text-amber-200" : ""}>δ&apos;(R, x) = E(∪ δ(r, x)),  r ∈ R</div>
          </div>

          <Panel className="min-h-[150px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-1.5 text-[16px] leading-relaxed"
              >
                {isStart && (
                  <>
                    <div>
                      <span className="text-slate-400">Start: </span>q₀&apos; = E({"{"}q₀{"}"})
                    </div>
                    {tick >= START.visits.length && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white">
                        = <SetView set={START.result} />
                      </motion.div>
                    )}
                  </>
                )}
                {cur && (
                  <>
                    <div>
                      <span className="text-slate-400">R = </span>
                      <SetView set={cur.fromSet} />
                      <span className="text-slate-400">,  x = </span>
                      <span className="font-mono">{cur.symbol}</span>
                    </div>
                    {phase >= 1 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <span className="text-slate-400">move: </span>
                        {cur.fromSet.map((r, i) => (
                          <span key={r} className="font-mono">
                            {i > 0 && <span className="text-slate-500"> ∪ </span>}
                            <span className={delta(ENFA, r, cur.symbol).length ? "text-rose-200" : "text-slate-500"}>
                              <Bracket list={delta(ENFA, r, cur.symbol)} />
                            </span>
                          </span>
                        ))}
                        <span className="text-slate-400"> = </span>
                        <Bracket list={cur.moveSet} />
                      </motion.div>
                    )}
                    {phase >= 2 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <span className="text-slate-400">E(</span>
                        <Bracket list={cur.moveSet} />
                        <span className="text-slate-400">) = </span>
                        <Bracket list={cur.toSet} />
                      </motion.div>
                    )}
                    {phase >= 3 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-1 text-emerald-300">
                        δ&apos;(R, {cur.symbol}) = <Bracket list={cur.toSet} />
                        {cur.isNew && <span className="ml-2 text-sm text-slate-400">new</span>}
                      </motion.div>
                    )}
                  </>
                )}
                {isEnd && (
                  <div className="text-slate-300">
                    ∅ is the dead state: δ&apos;(∅, a) = δ&apos;(∅, b) = ∅
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </Panel>

          <table className="stt w-full text-[15px]">
            <thead>
              <tr>
                <th className="px-3 py-1.5 text-left">R</th>
                <th className="px-3 py-1.5">a</th>
                <th className="px-3 py-1.5">b</th>
              </tr>
            </thead>
            <tbody>
              {LIVE.filter((d) => knownKeys.has(setKey(d.set))).map((d) => {
                const active = cur && setKey(cur.fromSet) === setKey(d.set);
                return (
                  <motion.tr
                    key={d.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={active ? "row-focus" : ""}
                  >
                    <td className="px-3 py-1.5 text-left">
                      <SetView set={d.set} />
                    </td>
                    {["a", "b"].map((x) => {
                      const r = resultOf(d.set, x);
                      return (
                        <td key={x} className="px-3 py-1.5">
                          {r ? (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                              <Bracket list={r.toSet} />
                            </motion.span>
                          ) : (
                            <span className="text-slate-600">–</span>
                          )}
                        </td>
                      );
                    })}
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
