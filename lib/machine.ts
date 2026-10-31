import { Automaton, EPS, subsetConstruction } from "./automata";

export type LoopSide = "top" | "bottom" | "left" | "right";

export interface GraphNode {
  id: string;
  x: number;
  y: number;
  accepting: boolean;
  start: boolean;
  loop: LoopSide;
  badge: "top" | "bottom";
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  /** Transition ids drawn by this edge (several symbols can share one arrow). */
  tids: string[];
  bend: number;
  epsilon: boolean;
}

export interface GraphModel {
  width: number;
  height: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface Layout {
  width: number;
  height: number;
  nodes: Record<string, { x: number; y: number; loop?: LoopSide; badge?: "top" | "bottom" }>;
}

const PAIR_BEND = 30;

/** Group transitions into drawable arrows and bend parallel / opposite arrows apart. */
export function buildGraph(a: Automaton, layout: Layout): GraphModel {
  const groups = new Map<string, GraphEdge>();
  for (const t of a.transitions) {
    const eps = t.symbol === EPS;
    const id = `${t.from}>${t.to}${eps ? "~" : ""}`;
    const g = groups.get(id);
    if (g) {
      g.tids.push(t.id);
      g.label += `, ${t.symbol}`;
    } else {
      groups.set(id, { id, from: t.from, to: t.to, label: t.symbol, tids: [t.id], bend: 0, epsilon: eps });
    }
  }
  const edges = [...groups.values()];
  for (const e of edges) {
    if (e.from === e.to) continue;
    const siblings = edges.filter(
      (o) => o.from !== o.to && ((o.from === e.from && o.to === e.to) || (o.from === e.to && o.to === e.from)),
    );
    if (siblings.length < 2) continue;
    const sameDirection = siblings.every((o) => o.from === e.from);
    e.bend = sameDirection ? (siblings.indexOf(e) === 0 ? -PAIR_BEND : PAIR_BEND) : PAIR_BEND;
  }
  return {
    width: layout.width,
    height: layout.height,
    nodes: a.states.map((s) => ({
      id: s,
      x: layout.nodes[s].x,
      y: layout.nodes[s].y,
      loop: layout.nodes[s].loop ?? "top",
      badge: layout.nodes[s].badge ?? "bottom",
      accepting: a.accepting.includes(s),
      start: a.start === s,
    })),
    edges,
  };
}

/** The ε-NFA from the lecture notes. */
export const ENFA: Automaton = {
  states: ["q0", "q1", "q2", "q3", "q4"],
  alphabet: ["a", "b"],
  start: "q0",
  accepting: ["q4"],
  transitions: [
    { id: "t1", from: "q0", to: "q1", symbol: "a" },
    { id: "t2", from: "q0", to: "q2", symbol: EPS },
    { id: "t3", from: "q1", to: "q0", symbol: "b" },
    { id: "t4", from: "q2", to: "q2", symbol: "b" },
    { id: "t5", from: "q2", to: "q3", symbol: EPS },
    { id: "t6", from: "q3", to: "q4", symbol: "a" },
    { id: "t7", from: "q3", to: "q4", symbol: EPS },
  ],
};

export const ENFA_GRAPH = buildGraph(ENFA, {
  width: 780,
  height: 350,
  nodes: {
    q0: { x: 120, y: 125 },
    q2: { x: 320, y: 125 },
    q3: { x: 510, y: 125 },
    q4: { x: 700, y: 125 },
    q1: { x: 120, y: 295 },
  },
});

export const SUBSET = subsetConstruction(ENFA);
export const DFA = SUBSET.dfa;

export const DFA_GRAPH = buildGraph(DFA, {
  width: 780,
  height: 400,
  nodes: {
    A: { x: 130, y: 120, badge: "top" },
    C: { x: 400, y: 120 },
    E: { x: 660, y: 120, badge: "top" },
    B: { x: 130, y: 320 },
    D: { x: 660, y: 320, loop: "right" },
  },
});

/** DFA rows in presentation order: live states first, the dead (∅) state last — as in the notes. */
export const DFA_ROWS = [...SUBSET.dstates].sort((x, y) => Number(x.set.length === 0) - Number(y.set.length === 0));

export const dstateOf = (name: string) => SUBSET.dstates.find((d) => d.name === name)!;

export const setText = (set: string[]) => (set.length ? `{${set.join(",")}}` : "∅");

/** Each DFA state labelled with the NFA subset it represents. */
export const DFA_BADGES = Object.fromEntries(SUBSET.dstates.map((d) => [d.name, setText(d.set)]));

export const RULES = [
  { n: 1, title: "STT for the ε-NFA", formula: "" },
  { n: 2, title: "ε-closure of all states", formula: "" },
  { n: 3, title: "STT for the DFA", formula: "δ'(R, x) = E(∪ δ(r, x)),  r ∈ R" },
  { n: 4, title: "Start state", formula: "q₀' = E({q₀})" },
];
