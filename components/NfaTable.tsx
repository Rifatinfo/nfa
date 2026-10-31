"use client";

import { AnimatePresence, motion } from "framer-motion";
import { EPS, delta } from "@/lib/automata";
import { ENFA } from "@/lib/machine";
import { S, SetView } from "./ui";

export const NFA_COLS = [...ENFA.alphabet, EPS];

export function Targets({ list }: { list: string[] }) {
  if (list.length === 0) return <span className="font-mono text-slate-500">∅</span>;
  if (list.length === 1) return <S id={list[0]} />;
  return <SetView set={list} />;
}

interface NfaTableProps {
  /** Number of rows revealed (in state order). */
  rows?: number;
  rowStatus?: Record<string, "focus" | "member">;
  colHot?: string;
  /** Highlighted cells, e.g. "q0|a". */
  cellHot?: string[];
  compact?: boolean;
}

/** State transition table of the ε-NFA. */
export default function NfaTable({ rows = ENFA.states.length, rowStatus = {}, colHot, cellHot = [], compact }: NfaTableProps) {
  const pad = compact ? "px-3 py-1" : "px-4 py-2";
  return (
    <table className={`stt w-full ${compact ? "text-sm" : "text-base"}`}>
      <thead>
        <tr>
          <th className={pad}>State</th>
          {NFA_COLS.map((c) => (
            <th key={c} className={`${pad} ${colHot === c ? "col-hot" : ""}`}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <AnimatePresence initial={false}>
          {ENFA.states.slice(0, rows).map((s) => {
            const status = rowStatus[s];
            return (
              <motion.tr
                key={s}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className={status === "focus" ? "row-focus" : status === "member" ? "row-member" : ""}
              >
                <td className={`${pad} whitespace-nowrap`}>
                  <span className="inline-block w-4 text-slate-400">
                    {s === ENFA.start ? "→" : ENFA.accepting.includes(s) ? "*" : ""}
                  </span>
                  <S id={s} />
                </td>
                {NFA_COLS.map((c, ci) => (
                  <motion.td
                    key={c}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 + ci * 0.15, duration: 0.3 }}
                    className={`${pad} ${colHot === c ? "col-hot" : ""} ${cellHot.includes(`${s}|${c}`) ? "cell-hot" : ""}`}
                  >
                    <Targets list={delta(ENFA, s, c)} />
                  </motion.td>
                ))}
              </motion.tr>
            );
          })}
        </AnimatePresence>
      </tbody>
    </table>
  );
}
