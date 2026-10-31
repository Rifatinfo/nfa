"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { DState } from "@/lib/automata";
import { DFA_ROWS, ENFA, ENFA_GRAPH, SUBSET, dstateOf } from "@/lib/machine";
import Graph, { NodeStatus } from "../Graph";
import { Narration, SetView, SlideHeader } from "../ui";

export const DFA_TABLE_STEPS = DFA_ROWS.length + 2;

export const targetOf = (d: DState, symbol: string) =>
  dstateOf(SUBSET.steps.find((s) => s.from === d.name && s.symbol === symbol)!.to);

function Cell({ set }: { set: string[] }) {
  return set.length === 0 ? <span className="font-mono">∅</span> : <SetView set={set} />;
}

export default function DfaTableSlide({ step }: { step: number }) {
  const rows = Math.min(step, DFA_ROWS.length);
  const current = step >= 1 && step <= DFA_ROWS.length ? DFA_ROWS[step - 1] : undefined;
  const marking = step === DFA_ROWS.length + 1;

  const nodeStatus: Record<string, NodeStatus> = {};
  if (current) for (const s of current.set) nodeStatus[s] = "member";
  if (marking) for (const s of ENFA.accepting) nodeStatus[s] = "accept";

  let caption: ReactNode = null;
  if (current?.set.length === 0) caption = <>∅ has no moves, so both entries are ∅.</>;
  if (marking) caption = <>→ marks the start state. * marks every set that contains q₄.</>;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SlideHeader badge="Step 4" title="DFA Transition Table" />
      <div className="grid min-h-0 flex-1 items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3 pt-2">
          <table className="stt w-full text-lg">
            <thead>
              <tr>
                <th className="w-10 px-2 py-2.5" />
                <th className="px-4 py-2.5 text-left">NFA states</th>
                <th className="px-4 py-2.5">a</th>
                <th className="px-4 py-2.5">b</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {DFA_ROWS.slice(0, rows).map((d, i) => (
                  <motion.tr
                    key={d.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className={d === current ? "row-focus" : ""}
                  >
                    <td className="px-2 py-2.5 text-slate-300">
                      {marking && (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.12 }}>
                          {i === 0 && "→"}
                          {d.accepting && "*"}
                        </motion.span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-left">
                      <Cell set={d.set} />
                    </td>
                    {["a", "b"].map((x, k) => (
                      <td key={x} className="px-4 py-2.5">
                        <motion.span
                          className="inline-block"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 + k * 0.3, duration: 0.3 }}
                        >
                          <Cell set={targetOf(d, x).set} />
                        </motion.span>
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          <Narration k={step}>{caption}</Narration>
        </div>

        <div className="canvas aspect-[780/350] w-full p-3">
          <Graph
            model={ENFA_GRAPH}
            nodeStatus={nodeStatus}
            defaultNode={current || marking ? "muted" : "idle"}
            defaultEdge={current || marking ? "muted" : "idle"}
          />
        </div>
      </div>
    </div>
  );
}
