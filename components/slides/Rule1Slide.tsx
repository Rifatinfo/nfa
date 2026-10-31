"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { EPS, delta } from "@/lib/automata";
import { ENFA, ENFA_GRAPH } from "@/lib/machine";
import Graph, { EdgeStatus, NodeStatus } from "../Graph";
import NfaTable, { NFA_COLS, Targets } from "../NfaTable";
import { Narration, Panel, S, SetView, SlideHeader } from "../ui";

const DEF_STEPS = 4; // Σ, Q, start, final
export const RULE1_STEPS = 1 + DEF_STEPS + ENFA.states.length;

export default function Rule1Slide({ step }: { step: number }) {
  const nodeStatus: Record<string, NodeStatus> = {};
  const transitionStatus: Record<string, EdgeStatus> = {};
  let defaultNode: NodeStatus = "idle";
  let defaultEdge: EdgeStatus = "idle";
  let caption: ReactNode = null;

  const rowIndex = step - 1 - DEF_STEPS;
  const rowState = rowIndex >= 0 ? ENFA.states[rowIndex] : undefined;

  if (step === 1) {
    for (const t of ENFA.transitions) transitionStatus[t.id] = t.symbol === EPS ? "muted" : "active";
  } else if (step === 2) {
    defaultNode = "member";
  } else if (step === 3) {
    nodeStatus.q0 = "focus";
    defaultNode = defaultEdge = "muted";
  } else if (step === 4) {
    nodeStatus.q4 = "accept";
    defaultNode = defaultEdge = "muted";
  } else if (rowState) {
    nodeStatus[rowState] = "focus";
    defaultNode = defaultEdge = "muted";
    for (const t of ENFA.transitions) {
      if (t.from === rowState) {
        transitionStatus[t.id] = "active";
        if (t.to !== rowState) nodeStatus[t.to] = "member";
      }
    }
    caption = (
      <span className="flex flex-wrap gap-x-6 font-mono">
        {NFA_COLS.map((c) => (
          <span key={c}>
            δ(<S id={rowState} />, {c}) = <Targets list={delta(ENFA, rowState, c)} />
          </span>
        ))}
      </span>
    );
  }

  const defs = [
    { k: "Σ", value: <span className="font-mono">{"{a, b}"}</span> },
    { k: "Q", value: <SetView set={ENFA.states} /> },
    { k: "Start", value: <S id="q0" /> },
    { k: "Final", value: <S id="q4" /> },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SlideHeader badge="Rule 1" title="Transition Table of the ε-NFA" />
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col gap-2">
          <div className="canvas relative min-h-[240px] flex-1 p-5">
            <Graph
              model={ENFA_GRAPH}
              nodeStatus={nodeStatus}
              transitionStatus={transitionStatus}
              defaultNode={defaultNode}
              defaultEdge={defaultEdge}
            />
          </div>
          <Narration k={step}>{caption}</Narration>
        </div>

        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1">
          <Panel>
            <div className="space-y-1.5">
              {defs.map((d, i) => (
                <motion.div
                  key={d.k}
                  animate={{ opacity: step >= i + 1 ? 1 : 0.2 }}
                  className={`flex items-baseline gap-3 rounded-md px-2 py-1 text-[17px] transition-colors ${
                    step === i + 1 ? "bg-amber-300/10" : ""
                  }`}
                >
                  <span className="w-14 text-slate-400">{d.k}</span>
                  <span className="text-white">{d.value}</span>
                </motion.div>
              ))}
            </div>
          </Panel>

          <div className="px-1">
            <NfaTable rows={Math.max(0, rowIndex + 1)} rowStatus={rowState ? { [rowState]: "focus" } : {}} />
          </div>
        </div>
      </div>
    </div>
  );
}
