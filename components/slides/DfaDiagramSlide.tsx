"use client";

import type { ReactNode } from "react";
import { DFA, DFA_BADGES, DFA_GRAPH, DFA_ROWS } from "@/lib/machine";
import Graph, { EdgeStatus, NodeStatus, Token } from "../Graph";
import { Narration, SlideHeader } from "../ui";
import { targetOf } from "./DfaTableSlide";

const N = DFA_ROWS.length;
export const DFA_DIAGRAM_STEPS = 2 + 2 * N;

export default function DfaDiagramSlide({ step }: { step: number }) {
  const nodesShown = Math.min(step, N);
  const edgeRows = Math.max(0, Math.min(step - N, N));
  const addingNode = step >= 1 && step <= N ? DFA_ROWS[step - 1] : undefined;
  const addingEdges = step > N && step <= 2 * N ? DFA_ROWS[step - N - 1] : undefined;
  const complete = step === 2 * N + 1;
  const focusRow = addingNode ?? addingEdges;

  const visibleNodes = DFA_ROWS.slice(0, nodesShown).map((d) => d.name);
  const edgeFrom = new Set(DFA_ROWS.slice(0, edgeRows).map((d) => d.name));
  const visibleTransitions = DFA.transitions.filter((t) => edgeFrom.has(t.from)).map((t) => t.id);

  const nodeStatus: Record<string, NodeStatus> = {};
  const transitionStatus: Record<string, EdgeStatus> = {};
  const tokens: Token[] = [];
  if (addingNode) nodeStatus[addingNode.name] = "focus";
  if (addingEdges) {
    nodeStatus[addingEdges.name] = "focus";
    for (const t of DFA.transitions.filter((t) => t.from === addingEdges.name)) {
      transitionStatus[t.id] = "active";
      tokens.push({ tid: t.id, key: `${step}-${t.id}`, delay: 0.7 });
    }
  }
  if (complete) for (const d of DFA_ROWS) nodeStatus[d.name] = d.accepting ? "accept" : "reject";

  let caption: ReactNode = null;
  if (addingEdges)
    caption = (
      <span className="font-mono">
        {addingEdges.name} —a→ {targetOf(addingEdges, "a").name}
        <span className="mx-4 text-slate-600">|</span>
        {addingEdges.name} —b→ {targetOf(addingEdges, "b").name}
      </span>
    );
  if (complete) caption = <>Final DFA: 5 states, 10 transitions. D is the dead state.</>;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SlideHeader badge="Step 6" title="DFA Diagram" />
      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col gap-2">
          <div className="canvas relative min-h-[280px] flex-1 p-6">
            <Graph
              model={DFA_GRAPH}
              visibleNodes={visibleNodes}
              visibleTransitions={visibleTransitions}
              nodeStatus={nodeStatus}
              transitionStatus={transitionStatus}
              tokens={tokens}
              badges={DFA_BADGES}
            />
          </div>
          <Narration k={step}>{caption}</Narration>
        </div>

        <div className="pt-2">
          <table className="stt w-full text-lg">
            <thead>
              <tr>
                <th className="px-3 py-2">State</th>
                <th className="px-3 py-2">a</th>
                <th className="px-3 py-2">b</th>
              </tr>
            </thead>
            <tbody>
              {DFA_ROWS.map((d, i) => (
                <tr key={d.name} className={d === focusRow ? "row-focus" : ""}>
                  <td className="px-3 py-2">
                    <span className="inline-block w-5 text-slate-400">{d.name === DFA.start ? "→" : ""}</span>
                    <span className="font-semibold text-white">{d.name}</span>
                    <span className="inline-block w-4 text-slate-400">{d.accepting ? "*" : ""}</span>
                  </td>
                  {["a", "b"].map((x) => (
                    <td key={x} className={`px-3 py-2 ${i < edgeRows || complete ? "text-white" : "text-slate-500"}`}>
                      {targetOf(d, x).name}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
