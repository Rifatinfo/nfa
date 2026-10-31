"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

/** q0 → q₀ in HTML. */
export function S({ id, className = "" }: { id: string; className?: string }) {
  const m = /^q(\d+)$/.exec(id);
  return (
    <span className={`font-mono ${className}`}>
      {m ? (
        <>
          q<sub className="text-[0.7em]">{m[1]}</sub>
        </>
      ) : (
        id
      )}
    </span>
  );
}

/** A set of states, e.g. {q0, q2}; ∅ when empty. Members in `hot` are highlighted. */
export function SetView({
  set,
  hot = [],
  className = "",
  hotClass = "text-sky-300",
}: {
  set: string[];
  hot?: string[];
  className?: string;
  hotClass?: string;
}) {
  if (set.length === 0) return <span className={`font-mono ${className}`}>∅</span>;
  return (
    <span className={`font-mono whitespace-nowrap ${className}`}>
      {"{"}
      {set.map((s, i) => (
        <span key={s}>
          <S id={s} className={`transition-colors duration-300 ${hot.includes(s) ? hotClass : ""}`} />
          {i < set.length - 1 && ", "}
        </span>
      ))}
      {"}"}
    </span>
  );
}

export function Panel({
  title,
  right,
  children,
  className = "",
}: {
  title?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`panel ${className}`}>
      {(title || right) && (
        <div className="mb-2.5 flex items-center justify-between gap-3">
          {title && <div className="eyebrow">{title}</div>}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

/** Slide heading: short label + title. */
export function SlideHeader({ badge, title }: { badge?: string; title: ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline gap-3">
      {badge && <span className="text-sm font-semibold text-indigo-300">{badge}</span>}
      <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
    </div>
  );
}

/** One-line caption under a diagram; fades when its content changes. */
export function Narration({ k, children }: { k: string | number; children: ReactNode }) {
  return (
    <div className="relative min-h-7">
      <AnimatePresence mode="wait">
        <motion.div
          key={k}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="px-1 text-[15px] leading-snug text-slate-300"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * Counts 0 → max at a fixed interval, restarting whenever `resetKey` changes.
 * Used to play a short animated sequence inside a single presentation step.
 */
export function useTicker(resetKey: string | number, max: number, interval = 650, delay = 350) {
  const [state, setState] = useState({ key: resetKey, tick: 0 });
  useEffect(() => {
    if (max <= 0) return;
    let i = 0;
    let id: ReturnType<typeof setInterval> | undefined;
    const startTimer = setTimeout(() => {
      i = 1;
      setState({ key: resetKey, tick: 1 });
      if (i >= max) return;
      id = setInterval(() => {
        i++;
        setState({ key: resetKey, tick: i });
        if (i >= max && id) clearInterval(id);
      }, interval);
    }, delay);
    return () => {
      clearTimeout(startTimer);
      if (id) clearInterval(id);
    };
  }, [resetKey, max, interval, delay]);
  return state.key === resetKey ? state.tick : 0;
}
