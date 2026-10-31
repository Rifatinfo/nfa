"use client";

import { DFA, DFA_BADGES, DFA_GRAPH, ENFA, ENFA_GRAPH, RULES } from "@/lib/machine";
import Simulator, { SimMachine } from "../Simulator";
import { Panel, SlideHeader } from "../ui";

const MACHINES: SimMachine[] = [
  { key: "nfa", name: "ε-NFA", automaton: ENFA, graph: ENFA_GRAPH },
  { key: "dfa", name: "DFA", automaton: DFA, graph: DFA_GRAPH, badges: DFA_BADGES },
];

export const SIMULATOR_STEPS = RULES.length + 1;

export default function SimulatorSlide({ step }: { step: number }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <SlideHeader badge="Overview" title="Interactive Simulator" />
      <div className="min-h-0 flex-1">
        <Simulator
          machines={MACHINES}
          initialInput="abba"
          aside={
            <Panel title="Rules">
              <ol className="space-y-1.5">
                {RULES.map((r, i) => {
                  const shown = step > i;
                  const current = step === i + 1;
                  return (
                    <li
                      key={r.n}
                      className={`flex gap-2.5 rounded-md px-1.5 py-1 text-sm transition-all duration-500 ${
                        current ? "bg-amber-300/10" : ""
                      } ${shown ? "opacity-100" : "translate-x-2 opacity-0"}`}
                    >
                      <span className={`font-mono ${current ? "text-amber-300" : "text-slate-500"}`}>{r.n}.</span>
                      <span>
                        <span className="text-slate-100">{r.title}</span>
                        {r.formula && <span className="block font-mono text-[13px] text-slate-400">{r.formula}</span>}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </Panel>
          }
        />
      </div>
    </div>
  );
}
