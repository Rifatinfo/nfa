"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useId } from "react";
import type { GraphEdge, GraphModel, GraphNode, LoopSide } from "@/lib/machine";

export type NodeStatus = "idle" | "muted" | "focus" | "member" | "active" | "accept" | "reject";
export type EdgeStatus = "idle" | "muted" | "done" | "focus" | "active";

const R = 26;

const NODE_STYLE: Record<NodeStatus, { stroke: string; fill: string; text: string; glow?: string }> = {
  idle: { stroke: "#5b74e8", fill: "#101a3c", text: "#d4dcff" },
  muted: { stroke: "#2a3566", fill: "#0b1230", text: "#56618f" },
  focus: { stroke: "#fbbf24", fill: "#2e2107", text: "#fde68a", glow: "#fbbf24" },
  member: { stroke: "#38bdf8", fill: "#072640", text: "#bae6fd", glow: "#38bdf8" },
  active: { stroke: "#ff6b81", fill: "#30101c", text: "#ffd5dc", glow: "#ff6b81" },
  accept: { stroke: "#34d399", fill: "#06301f", text: "#bbf7d0", glow: "#34d399" },
  reject: { stroke: "#f43f5e", fill: "#2e0812", text: "#fecdd3", glow: "#f43f5e" },
};

const EDGE_COLOR: Record<EdgeStatus, string> = {
  idle: "#6372a8",
  muted: "#26305a",
  done: "#38bdf8",
  focus: "#fbbf24",
  active: "#ff6b81",
};
const EPS_IDLE = "#9d8cff";

const EDGE_RANK: EdgeStatus[] = ["muted", "idle", "done", "focus", "active"];

type Pt = { x: number; y: number };
const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
const mul = (a: Pt, k: number): Pt => ({ x: a.x * k, y: a.y * k });
const unit = (a: Pt): Pt => {
  const l = Math.hypot(a.x, a.y) || 1;
  return { x: a.x / l, y: a.y / l };
};
const polar = (c: Pt, r: number, th: number): Pt => ({ x: c.x + r * Math.cos(th), y: c.y + r * Math.sin(th) });
const f = (n: number) => n.toFixed(1);

interface EdgeGeo {
  d: string;
  label: Pt;
  tip: Pt;
  dir: Pt;
  at: (t: number) => Pt;
}

const LOOP_ANGLE: Record<LoopSide, number> = { top: -Math.PI / 2, bottom: Math.PI / 2, left: Math.PI, right: 0 };

function edgeGeometry(p: GraphNode, q: GraphNode, edge: GraphEdge): EdgeGeo {
  if (p.id === q.id) {
    const th = LOOP_ANGLE[p.loop];
    const s = polar(p, R, th - 0.5);
    const tip = polar(p, R + 1, th + 0.5);
    const c1 = polar(p, R * 2.9, th - 0.75);
    const c2 = polar(p, R * 2.9, th + 0.75);
    const dir = unit(sub(tip, c2));
    const end = sub(tip, mul(dir, 9));
    const at = (t: number): Pt => {
      const u = 1 - t;
      return {
        x: u * u * u * s.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * end.x,
        y: u * u * u * s.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * end.y,
      };
    };
    return {
      d: `M ${f(s.x)} ${f(s.y)} C ${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(end.x)} ${f(end.y)}`,
      label: polar(p, R * 1.84 + 17, th),
      tip,
      dir,
      at,
    };
  }
  const delta = sub(q, p);
  const n = unit({ x: -delta.y, y: delta.x });
  const mid = mul(add(p, q), 0.5);
  const c = add(mid, mul(n, edge.bend * 2));
  const s = add(p, mul(unit(sub(c, p)), R));
  const tip = add(q, mul(unit(sub(c, q)), R + 1));
  const dir = unit(sub(tip, c));
  const end = sub(tip, mul(dir, 9));
  const at = (t: number): Pt => {
    const u = 1 - t;
    return {
      x: u * u * s.x + 2 * u * t * c.x + t * t * end.x,
      y: u * u * s.y + 2 * u * t * c.y + t * t * end.y,
    };
  };
  const sign = edge.bend > 0 ? 1 : -1;
  // Push the label box clear of the line: half its width sideways, half its height up/down.
  const offset = 6 + Math.abs(n.x) * (edge.label.length * 4.6 + 8) + Math.abs(n.y) * 11;
  return {
    d: `M ${f(s.x)} ${f(s.y)} Q ${f(c.x)} ${f(c.y)} ${f(end.x)} ${f(end.y)}`,
    label: add(at(0.5), mul(n, sign * offset)),
    tip,
    dir,
    at,
  };
}

function arrowPoints(tip: Pt, dir: Pt, size = 11) {
  const base = sub(tip, mul(dir, size));
  const perp = { x: -dir.y, y: dir.x };
  const a = add(base, mul(perp, size * 0.48));
  const b = sub(base, mul(perp, size * 0.48));
  return `${f(tip.x)},${f(tip.y)} ${f(a.x)},${f(a.y)} ${f(b.x)},${f(b.y)}`;
}

/** Renders "q0" as q with a subscript, any other label as-is. */
function NodeLabel({ id, x, y, color }: { id: string; x: number; y: number; color: string }) {
  const m = /^q(\d+)$/.exec(id);
  return (
    <motion.text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      className="font-mono"
      fontSize={m ? 17 : 19}
      fontWeight={700}
      animate={{ fill: color }}
      transition={{ duration: 0.35 }}
    >
      {m ? (
        <>
          q<tspan fontSize={11} dy={5}>{m[1]}</tspan>
        </>
      ) : (
        id
      )}
    </motion.text>
  );
}

export interface Token {
  /** Transition id to travel along. */
  tid: string;
  key: string | number;
  color?: string;
  delay?: number;
}

interface GraphProps {
  model: GraphModel;
  nodeStatus?: Record<string, NodeStatus>;
  /** Keyed by transition id; an arrow takes the strongest status of its transitions. */
  transitionStatus?: Record<string, EdgeStatus>;
  defaultNode?: NodeStatus;
  defaultEdge?: EdgeStatus;
  /** Node ids to draw; all when omitted. */
  visibleNodes?: string[];
  /** Transition ids to draw; all when omitted. */
  visibleTransitions?: string[];
  tokens?: Token[];
  /** Small badge text per node, e.g. the subset it stands for. */
  badges?: Record<string, string>;
  className?: string;
}

export default function Graph({
  model,
  nodeStatus = {},
  transitionStatus = {},
  defaultNode = "idle",
  defaultEdge = "idle",
  visibleNodes,
  visibleTransitions,
  tokens = [],
  badges = {},
  className = "",
}: GraphProps) {
  const uid = useId().replace(/:/g, "");
  const nodeById = new Map(model.nodes.map((n) => [n.id, n]));
  const nodes = model.nodes.filter((n) => !visibleNodes || visibleNodes.includes(n.id));
  const edges = model.edges.filter(
    (e) =>
      (!visibleTransitions || e.tids.some((t) => visibleTransitions.includes(t))) &&
      (!visibleNodes || (visibleNodes.includes(e.from) && visibleNodes.includes(e.to))),
  );

  const statusOfEdge = (e: GraphEdge): EdgeStatus => {
    let best: EdgeStatus | undefined;
    for (const t of e.tids) {
      const s = transitionStatus[t];
      if (s && (!best || EDGE_RANK.indexOf(s) > EDGE_RANK.indexOf(best))) best = s;
    }
    return best ?? defaultEdge;
  };

  const geos = new Map(model.edges.map((e) => [e.id, edgeGeometry(nodeById.get(e.from)!, nodeById.get(e.to)!, e)]));
  const startNode = model.nodes.find((n) => n.start);

  return (
    <svg
      viewBox={`0 0 ${model.width} ${model.height}`}
      className={`h-full w-full overflow-visible ${className}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Start arrow */}
      {startNode && nodes.includes(startNode) && (
        <motion.g
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: (nodeStatus[startNode.id] ?? defaultNode) === "muted" ? 0.35 : 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <line
            x1={startNode.x - R - 58}
            y1={startNode.y}
            x2={startNode.x - R - 10}
            y2={startNode.y}
            stroke="#8aa0ff"
            strokeWidth={2}
          />
          <polygon points={arrowPoints({ x: startNode.x - R - 1, y: startNode.y }, { x: 1, y: 0 })} fill="#8aa0ff" />
        </motion.g>
      )}

      {/* Edges */}
      <AnimatePresence>
        {edges.map((e) => {
          const g = geos.get(e.id)!;
          const status = statusOfEdge(e);
          const color = status === "idle" && e.epsilon ? EPS_IDLE : EDGE_COLOR[status];
          const hot = status === "active" || status === "focus";
          const maskId = `${uid}-m-${e.id.replace(/[^a-zA-Z0-9]/g, "_")}`;
          return (
            <motion.g key={e.id} initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={model.width} height={model.height}>
                <motion.path
                  d={g.d}
                  fill="none"
                  stroke="white"
                  strokeWidth={14}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                />
              </mask>
              <motion.path
                d={g.d}
                fill="none"
                mask={`url(#${maskId})`}
                strokeDasharray={e.epsilon ? "7 6" : undefined}
                strokeLinecap="round"
                animate={{ stroke: color, strokeWidth: hot ? 3 : 2 }}
                transition={{ duration: 0.35 }}
                style={hot ? { filter: `drop-shadow(0 0 6px ${color})` } : undefined}
              />
              {hot && (
                <path
                  d={g.d}
                  fill="none"
                  stroke="white"
                  strokeOpacity={0.75}
                  strokeWidth={1.4}
                  className="edge-flow"
                  mask={`url(#${maskId})`}
                />
              )}
              <motion.polygon
                points={arrowPoints(g.tip, g.dir)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, fill: color }}
                transition={{ opacity: { delay: 0.55, duration: 0.2 }, fill: { duration: 0.35 } }}
              />
              <motion.g
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: hot ? 1.12 : 1 }}
                transition={{ delay: 0.35, duration: 0.35 }}
              >
                <motion.rect
                  x={g.label.x - (e.label.length * 4.6 + 8)}
                  y={g.label.y - 11}
                  width={e.label.length * 9.2 + 16}
                  height={22}
                  rx={6}
                  animate={{
                    fill: hot ? "#1a1a2e" : "#0d1222",
                    stroke: hot ? color : "#0d1222",
                  }}
                  strokeWidth={1}
                />
                <motion.text
                  x={g.label.x}
                  y={g.label.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={14}
                  fontWeight={700}
                  className="font-mono"
                  fontStyle={e.epsilon ? "italic" : undefined}
                  animate={{ fill: hot ? "#fff" : status === "muted" ? "#3b4675" : e.epsilon ? "#c4b8ff" : "#dbe2ff" }}
                >
                  {e.label}
                </motion.text>
              </motion.g>
            </motion.g>
          );
        })}
      </AnimatePresence>

      {/* Nodes */}
      <AnimatePresence>
        {nodes.map((n) => {
          const status = nodeStatus[n.id] ?? defaultNode;
          const st = NODE_STYLE[status];
          return (
            <motion.g
              key={n.id}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.3 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
            >
              {st.glow && (
                <motion.circle
                  cx={n.x}
                  cy={n.y}
                  r={R}
                  fill="none"
                  stroke={st.glow}
                  strokeWidth={2}
                  initial={{ scale: 1, opacity: 0.45 }}
                  animate={{ scale: 1.45, opacity: 0 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                />
              )}
              <motion.circle
                cx={n.x}
                cy={n.y}
                r={R}
                strokeWidth={2.5}
                animate={{ stroke: st.stroke, fill: st.fill }}
                transition={{ duration: 0.35 }}
                style={st.glow ? { filter: `drop-shadow(0 0 6px ${st.glow}88)` } : undefined}
              />
              {n.accepting && (
                <motion.circle
                  cx={n.x}
                  cy={n.y}
                  r={R - 5}
                  fill="none"
                  strokeWidth={1.8}
                  animate={{ stroke: st.stroke }}
                  transition={{ duration: 0.35 }}
                />
              )}
              <NodeLabel id={n.id} x={n.x} y={n.y} color={st.text} />
              {badges[n.id] && (
                <motion.text
                  key={badges[n.id]}
                  x={n.x}
                  textAnchor="middle"
                  fontSize={12}
                  className="font-mono"
                  fill="#8ea2e8"
                  initial={{ opacity: 0, y: n.badge === "top" ? n.y - R - 4 : n.y + R + 10 }}
                  animate={{ opacity: 1, y: n.badge === "top" ? n.y - R - 11 : n.y + R + 19 }}
                >
                  {badges[n.id]}
                </motion.text>
              )}
            </motion.g>
          );
        })}
      </AnimatePresence>

      {/* Tokens travelling along transitions */}
      {tokens.map((tk) => {
        const e = model.edges.find((x) => x.tids.includes(tk.tid));
        if (!e) return null;
        const g = geos.get(e.id)!;
        const pts = Array.from({ length: 25 }, (_, i) => g.at(i / 24));
        const color = tk.color ?? "#ffd166";
        return (
          <motion.circle
            key={`${tk.key}-${tk.tid}`}
            r={6.5}
            fill={color}
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
            initial={{ cx: pts[0].x, cy: pts[0].y, opacity: 0 }}
            animate={{ cx: pts.map((p) => p.x), cy: pts.map((p) => p.y), opacity: [0, 1, 1, 1, 0] }}
            transition={{ duration: 0.95, ease: "easeInOut", delay: tk.delay ?? 0 }}
          />
        );
      })}
    </svg>
  );
}
