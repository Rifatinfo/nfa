"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { DFA, DFA_ROWS } from "@/lib/machine";
import { Narration, SetView, SlideHeader } from "../ui";
import { targetOf } from "./DfaTableSlide";

const TUPLE = [
  { k: "Q'", v: `{${DFA.states.join(", ")}}` },
  { k: "Σ", v: "{a, b}" },
  { k: "δ'", v: "defined by the table" },
  { k: "q₀'", v: DFA.start },
  { k: "F'", v: `{${DFA.accepting.join(", ")}}` },
];
export const NOTATION_STEPS = 1 + DFA_ROWS.length + TUPLE.length;

/** Shows a subset until it has been named, then swaps to the letter. */
function SwapCell({ set, name, named, flash }: { set: string[]; name: string; named: boolean; flash: boolean }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {named ? (
        <motion.span
          key="n"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`inline-block font-semibold ${flash ? "text-amber-300" : "text-white"}`}
        >
          {name}
        </motion.span>
      ) : (
        <motion.span key="s" exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.2 }} className="inline-block text-[15px] text-slate-400">
          {set.length === 0 ? <span className="font-mono">∅</span> : <SetView set={set} />}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export default function NotationSlide({ step }: { step: number }) {
  const namedCount = Math.min(step, DFA_ROWS.length);
  const naming = step >= 1 && step <= DFA_ROWS.length ? DFA_ROWS[step - 1] : undefined;
  const tupleIdx = step - 1 - DFA_ROWS.length; // -1 … 4
  const named = new Set(DFA_ROWS.slice(0, namedCount).map((d) => d.name));
  const hl = tupleIdx >= 0 ? TUPLE[tupleIdx].k : undefined;
  const showMarks = tupleIdx >= 3;

  let caption: ReactNode = null;
  if (naming)
    caption = (
      <>
        Let <b className="text-white">{naming.name}</b> = {naming.set.length ? <SetView set={naming.set} /> : "∅"}
      </>
    );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SlideHeader badge="Step 5" title="DFA Notation" />
      <div className="grid min-h-0 flex-1 items-start gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3 pt-2">
          <table className="stt w-full text-lg">
            <thead>
              <tr>
                <th className={`px-4 py-2.5 ${hl === "Q'" ? "col-hot" : ""}`}>DFA state</th>
                <th className="px-4 py-2.5 text-left">NFA states</th>
                <th className={`px-4 py-2.5 ${hl === "Σ" ? "col-hot" : ""}`}>a</th>
                <th className={`px-4 py-2.5 ${hl === "Σ" ? "col-hot" : ""}`}>b</th>
              </tr>
            </thead>
            <tbody>
              {DFA_ROWS.map((d) => {
                const rowHot = d === naming || (hl === "q₀'" && d.name === DFA.start) || (hl === "F'" && d.accepting);
                return (
                  <tr key={d.name} className={rowHot ? (hl === "F'" ? "row-accept" : "row-focus") : ""}>
                    <td className={`px-4 py-2.5 whitespace-nowrap ${hl === "Q'" ? "col-hot" : ""}`}>
                      <span className="inline-block w-5 text-slate-400">{showMarks && d.name === DFA.start ? "→" : ""}</span>
                      {named.has(d.name) ? (
                        <motion.span
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`inline-block font-semibold ${d === naming ? "text-amber-300" : "text-white"}`}
                        >
                          {d.name}
                        </motion.span>
                      ) : (
                        <span className="text-slate-600">?</span>
                      )}
                      <span className="inline-block w-4 text-slate-400">{tupleIdx >= 4 && d.accepting ? "*" : ""}</span>
                    </td>
                    <td className="px-4 py-2.5 text-left text-slate-300">
                      {d.set.length === 0 ? <span className="font-mono">∅</span> : <SetView set={d.set} />}
                    </td>
                    {["a", "b"].map((x) => {
                      const t = targetOf(d, x);
                      return (
                        <td key={x} className={`px-4 py-2.5 ${hl === "δ'" ? "cell-hot" : ""}`}>
                          <SwapCell set={t.set} name={t.name} named={named.has(t.name)} flash={t === naming} />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Narration k={step}>{caption}</Narration>
        </div>

        <div className="pt-2">
          <div className="mb-3 font-mono text-lg text-slate-300">M&apos; = (Q&apos;, Σ, δ&apos;, q₀&apos;, F&apos;)</div>
          <div className="space-y-1">
            {TUPLE.map((t, i) => (
              <motion.div
                key={t.k}
                initial={false}
                animate={{ opacity: tupleIdx >= i ? 1 : 0, x: tupleIdx >= i ? 0 : 12 }}
                transition={{ duration: 0.35 }}
                className={`flex gap-3 rounded-md px-2 py-1.5 text-lg transition-colors ${hl === t.k ? "bg-amber-300/10" : ""}`}
              >
                <span className="w-10 font-mono text-slate-400">{t.k}</span>
                <span className="text-slate-500">{t.k === "δ'" ? ":" : "="}</span>
                <span className={t.k === "δ'" ? "text-base text-slate-300" : "font-mono text-white"}>{t.v}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
