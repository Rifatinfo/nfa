"use client";

import { useState } from "react";
import { DFA, DFA_BADGES, DFA_GRAPH, ENFA, ENFA_GRAPH } from "@/lib/machine";
import Simulator, { SimMachine } from "../Simulator";
import { Panel, SlideHeader } from "../ui";

const MACHINES: SimMachine[] = [
  { key: "dfa", name: "DFA", automaton: DFA, graph: DFA_GRAPH, badges: DFA_BADGES },
  { key: "nfa", name: "ε-NFA", automaton: ENFA, graph: ENFA_GRAPH },
];

const PRESETS = ["", "a", "ab", "abba", "bbba", "aa", "bab"];

interface Result {
  id: number;
  input: string;
  accepted: boolean;
}

export default function TestSlide() {
  const [history, setHistory] = useState<Result[]>([]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SlideHeader badge="Step 7" title="Test the DFA" />
      <div className="min-h-0 flex-1">
        <Simulator
          machines={MACHINES}
          initialInput="abba"
          presets={PRESETS}
          onResult={(input, accepted) => setHistory((h) => [{ id: Date.now(), input, accepted }, ...h].slice(0, 6))}
          after={
            history.length > 0 && (
              <Panel title="Results">
                <table className="w-full text-sm">
                  <tbody>
                    {history.map((r) => (
                      <tr key={r.id}>
                        <td className="py-0.5 font-mono text-slate-200">{r.input || "ε"}</td>
                        <td className={`py-0.5 text-right ${r.accepted ? "text-emerald-300" : "text-rose-300"}`}>
                          {r.accepted ? "accepted" : "rejected"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
            )
          }
        />
      </div>
    </div>
  );
}
