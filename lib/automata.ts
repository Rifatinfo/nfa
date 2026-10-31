export const EPS = "ε";

export interface Transition {
  id: string;
  from: string;
  to: string;
  symbol: string;
}

export interface Automaton {
  states: string[];
  alphabet: string[];
  start: string;
  accepting: string[];
  transitions: Transition[];
}

/** Sort and de-duplicate a set of states using the automaton's state order. */
export function sortSet(a: Automaton, set: Iterable<string>): string[] {
  const order = new Map(a.states.map((s, i) => [s, i]));
  return [...new Set(set)].sort((x, y) => (order.get(x) ?? 0) - (order.get(y) ?? 0));
}

export const setKey = (set: string[]) => set.join(",");

export const isAcceptingSet = (a: Automaton, set: string[]) =>
  set.some((s) => a.accepting.includes(s));

export function outgoing(a: Automaton, state: string, symbol: string) {
  return a.transitions.filter((t) => t.from === state && t.symbol === symbol);
}

/** δ(q, x) as a sorted target list. */
export function delta(a: Automaton, state: string, symbol: string) {
  return sortSet(a, outgoing(a, state, symbol).map((t) => t.to));
}

export interface ClosureVisit {
  state: string;
  via?: Transition;
}

export interface ClosureTrace {
  result: string[];
  /** States in the order they were discovered, with the ε-edge that reached them. */
  visits: ClosureVisit[];
}

/** ε-closure of a set of states, recorded breadth-first so it can be replayed. */
export function epsilonClosure(a: Automaton, seeds: string[]): ClosureTrace {
  const seen = new Set<string>();
  const visits: ClosureVisit[] = [];
  for (const s of seeds) {
    if (!seen.has(s)) {
      seen.add(s);
      visits.push({ state: s });
    }
  }
  for (let i = 0; i < visits.length; i++) {
    for (const t of outgoing(a, visits[i].state, EPS)) {
      if (!seen.has(t.to)) {
        seen.add(t.to);
        visits.push({ state: t.to, via: t });
      }
    }
  }
  return { result: sortSet(a, seen), visits };
}

/** ∪ δ(r, symbol) for r ∈ set. */
export function move(a: Automaton, set: string[], symbol: string) {
  const edges = a.transitions.filter((t) => set.includes(t.from) && t.symbol === symbol);
  return { result: sortSet(a, edges.map((t) => t.to)), edges };
}

export interface SubsetStep {
  from: string;
  fromSet: string[];
  symbol: string;
  moveEdges: Transition[];
  moveSet: string[];
  closure: ClosureTrace;
  to: string;
  toSet: string[];
  isNew: boolean;
}

export interface DState {
  name: string;
  set: string[];
  accepting: boolean;
}

export interface SubsetResult {
  start: ClosureTrace;
  dstates: DState[];
  steps: SubsetStep[];
  dfa: Automaton;
}

/** Subset construction for an ε-NFA. DFA states are named in discovery order. */
export function subsetConstruction(nfa: Automaton, names = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"): SubsetResult {
  const start = epsilonClosure(nfa, [nfa.start]);
  const dstates: DState[] = [];
  const byKey = new Map<string, string>();
  const add = (set: string[]) => {
    const name = names[dstates.length];
    dstates.push({ name, set, accepting: isAcceptingSet(nfa, set) });
    byKey.set(setKey(set), name);
    return name;
  };
  add(start.result);

  const steps: SubsetStep[] = [];
  for (let i = 0; i < dstates.length; i++) {
    const R = dstates[i];
    for (const symbol of nfa.alphabet) {
      const mv = move(nfa, R.set, symbol);
      const closure = epsilonClosure(nfa, mv.result);
      const known = byKey.get(setKey(closure.result));
      const to = known ?? add(closure.result);
      steps.push({
        from: R.name,
        fromSet: R.set,
        symbol,
        moveEdges: mv.edges,
        moveSet: mv.result,
        closure,
        to,
        toSet: closure.result,
        isNew: !known,
      });
    }
  }

  const dfa: Automaton = {
    states: dstates.map((d) => d.name),
    alphabet: nfa.alphabet,
    start: dstates[0].name,
    accepting: dstates.filter((d) => d.accepting).map((d) => d.name),
    transitions: steps.map((s) => ({ id: `${s.from}-${s.symbol}`, from: s.from, to: s.to, symbol: s.symbol })),
  };
  return { start, dstates, steps, dfa };
}

export interface SimFrame {
  index: number;
  symbol?: string;
  active: string[];
  moveEdges: Transition[];
  closureEdges: Transition[];
}

/** Run an automaton (DFA or ε-NFA) over the input, one frame per consumed symbol. */
export function simulate(a: Automaton, input: string): SimFrame[] {
  const init = epsilonClosure(a, [a.start]);
  const frames: SimFrame[] = [
    {
      index: 0,
      active: init.result,
      moveEdges: [],
      closureEdges: init.visits.flatMap((v) => (v.via ? [v.via] : [])),
    },
  ];
  let current = init.result;
  [...input].forEach((ch, i) => {
    const mv = move(a, current, ch);
    const cl = epsilonClosure(a, mv.result);
    current = cl.result;
    frames.push({
      index: i + 1,
      symbol: ch,
      active: current,
      moveEdges: mv.edges,
      closureEdges: cl.visits.flatMap((v) => (v.via ? [v.via] : [])),
    });
  });
  return frames;
}
