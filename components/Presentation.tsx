"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import Cover from "./slides/Cover";
import DfaDiagramSlide, { DFA_DIAGRAM_STEPS } from "./slides/DfaDiagramSlide";
import DfaTableSlide, { DFA_TABLE_STEPS } from "./slides/DfaTableSlide";
import NotationSlide, { NOTATION_STEPS } from "./slides/NotationSlide";
import Rule1Slide, { RULE1_STEPS } from "./slides/Rule1Slide";
import Rule2Slide, { RULE2_STEPS } from "./slides/Rule2Slide";
import Rule3Slide, { RULE3_STEPS } from "./slides/Rule3Slide";
import SimulatorSlide, { SIMULATOR_STEPS } from "./slides/SimulatorSlide";
import TestSlide from "./slides/TestSlide";

interface SlideDef {
  id: string;
  title: string;
  steps: number;
  render: (step: number) => ReactNode;
}

const SLIDES: SlideDef[] = [
  { id: "cover", title: "Cover", steps: 1, render: () => <Cover /> },
  { id: "simulator", title: "Simulator", steps: SIMULATOR_STEPS, render: (s) => <SimulatorSlide step={s} /> },
  { id: "rule1", title: "Rule 1", steps: RULE1_STEPS, render: (s) => <Rule1Slide step={s} /> },
  { id: "rule2", title: "Rule 2", steps: RULE2_STEPS, render: (s) => <Rule2Slide step={s} /> },
  { id: "rule3", title: "Rules 3 & 4", steps: RULE3_STEPS, render: (s) => <Rule3Slide step={s} /> },
  { id: "table", title: "DFA Table", steps: DFA_TABLE_STEPS, render: (s) => <DfaTableSlide step={s} /> },
  { id: "notation", title: "DFA Notation", steps: NOTATION_STEPS, render: (s) => <NotationSlide step={s} /> },
  { id: "diagram", title: "DFA Diagram", steps: DFA_DIAGRAM_STEPS, render: (s) => <DfaDiagramSlide step={s} /> },
  { id: "test", title: "Test", steps: 1, render: () => <TestSlide /> },
];

const slideVariants = {
  enter: (d: number) => ({ opacity: 0, x: 40 * d }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: -40 * d }),
};

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** "#/3/2" → page 3, step 2. */
function parseHash(): { page: number; step: number } | null {
  const m = /^#\/(\d+)(?:\/(\d+))?$/.exec(window.location.hash);
  if (!m) return null;
  const page = clamp(Number(m[1]), 0, SLIDES.length - 1);
  return { page, step: clamp(Number(m[2] ?? 0), 0, SLIDES[page].steps - 1) };
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
    </svg>
  );
}

export default function Presentation() {
  const [page, setPage] = useState(0);
  const [steps, setSteps] = useState<number[]>(() => SLIDES.map(() => 0));
  const [dir, setDir] = useState(1);

  const slide = SLIDES[page];
  const step = steps[page];

  // Restore position from the URL once on load.
  useEffect(() => {
    const h = parseHash(); // read before the effect below rewrites the hash
    if (!h) return;
    const id = setTimeout(() => {
      setPage(h.page);
      setSteps((s) => s.map((v, i) => (i === h.page ? h.step : v)));
    }, 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    window.history.replaceState(null, "", `#/${page}/${step}`);
  }, [page, step]);

  const goPage = useCallback(
    (p: number, atEnd = false) => {
      if (p < 0 || p >= SLIDES.length || p === page) return;
      setDir(p > page ? 1 : -1);
      if (atEnd) setSteps((s) => s.map((v, i) => (i === p ? SLIDES[p].steps - 1 : v)));
      setPage(p);
    },
    [page],
  );

  const setStep = useCallback(
    (n: number) => setSteps((s) => s.map((v, i) => (i === page ? clamp(n, 0, SLIDES[page].steps - 1) : v))),
    [page],
  );

  const next = useCallback(() => {
    if (step < slide.steps - 1) setStep(step + 1);
    else goPage(page + 1);
  }, [step, slide.steps, setStep, goPage, page]);

  const prev = useCallback(() => {
    if (step > 0) setStep(step - 1);
    else goPage(page - 1, true);
  }, [step, setStep, goPage, page]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable=true]")) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const actions: Record<string, () => void> = {
        ArrowRight: next,
        ArrowLeft: prev,
        PageDown: () => goPage(page + 1),
        PageUp: () => goPage(page - 1),
        Home: () => goPage(0),
        End: () => goPage(SLIDES.length - 1),
        f: () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()),
      };
      const fn = actions[e.key];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, goPage, page]);

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <main className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.section
            key={slide.id}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute inset-0 ${slide.id === "cover" ? "" : "px-6 pt-6 pb-2 xl:px-10"}`}
          >
            {slide.render(step)}
          </motion.section>
        </AnimatePresence>
      </main>

      <footer className="flex h-16 shrink-0 items-center justify-between px-6 xl:px-10">
        <button className="btn-round" onClick={() => goPage(page - 1)} disabled={page === 0} aria-label="Previous page">
          <Chevron dir="left" />
        </button>

        <nav className="flex items-center gap-2" aria-label="Pages">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goPage(i)}
              title={s.title}
              aria-current={i === page ? "page" : undefined}
              className="grid h-6 place-items-center"
            >
              <motion.span
                layout
                className={`relative block h-1.5 overflow-hidden rounded-full ${
                  i === page ? "w-8 bg-white/15" : i < page ? "w-1.5 bg-white/50" : "w-1.5 bg-white/15 hover:bg-white/40"
                }`}
              >
                {i === page && (
                  <motion.span
                    className="absolute inset-y-0 left-0 bg-white/80"
                    initial={false}
                    animate={{ width: `${((step + 1) / slide.steps) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.span>
            </button>
          ))}
        </nav>

        <button
          className="btn-round"
          onClick={() => goPage(page + 1)}
          disabled={page === SLIDES.length - 1}
          aria-label="Next page"
        >
          <Chevron dir="right" />
        </button>
      </footer>
    </div>
  );
}
