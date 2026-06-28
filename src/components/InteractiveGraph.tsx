"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { X, Network, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GraphNode {
  id: string;
  title: string;
  category: string;
  connections: number;
}

interface GraphEdge {
  source: string;
  target: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface SimNode extends d3.SimulationNodeDatum, GraphNode {
  isCurrent?: boolean;
  isConnected?: boolean;
}

type SimLink = d3.SimulationLinkDatum<SimNode>;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

async function fetchGraphData(): Promise<GraphData> {
  const res = await fetch("/api/graph");
  const data: GraphData = await res.json();
  return data;
}

/* ------------------------------------------------------------------ */
/*  Color Palette — Pure Obsidian Monochrome                           */
/* ------------------------------------------------------------------ */

const C = {
  /* Dark theme */
  bg: "#000000",
  node: "#c0c0c0",          // Normal node fill
  nodeActive: "#e8e8e8",    // Current/active node (brighter)
  nodeHover: "#ffffff",     // Hovered node
  edge: "rgba(255,255,255,0.12)",   // Normal edge
  edgeActive: "rgba(255,255,255,0.35)", // Edges connected to current
  edgeHover: "rgba(255,255,255,0.6)",   // Edges connected to hovered
  label: "rgba(255,255,255,0.45)",     // Normal label
  labelActive: "rgba(255,255,255,0.9)", // Active node label
  labelHover: "rgba(255,255,255,0.85)", // Hovered label
  dimNode: 0.12,            // Unrelated node opacity on hover
  dimEdge: 0.03,            // Unrelated edge opacity on hover
  dimLabel: 0.06,           // Unrelated label opacity on hover
  glowActive: 6,            // Active node glow blur
  glowHover: 4,             // Hover glow blur
  /* Light theme */
  lightBg: "#ffffff",
  lightNode: "#888888",
  lightNodeActive: "#333333",
  lightNodeHover: "#111111",
  lightEdge: "rgba(0,0,0,0.1)",
  lightEdgeActive: "rgba(0,0,0,0.3)",
  lightEdgeHover: "rgba(0,0,0,0.5)",
  lightLabel: "rgba(0,0,0,0.4)",
  lightLabelActive: "rgba(0,0,0,0.85)",
  lightLabelHover: "rgba(0,0,0,0.8)",
};

/* ------------------------------------------------------------------ */
/*  D3 Graph Renderer                                                  */
/* ------------------------------------------------------------------ */

function renderD3Graph(
  svgEl: SVGSVGElement,
  data: GraphData,
  options: {
    currentSlug?: string;
    showAllLabels?: boolean;
    width: number;
    height: number;
    onNavigate?: (slug: string) => void;
  }
) {
  const { currentSlug, showAllLabels, width, height, onNavigate } = options;
  const isCompact = !showAllLabels && !!currentSlug;

  const isLight =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("light");

  // Theme-adaptive colors
  const T = isLight
    ? {
        bg: C.lightBg,
        node: C.lightNode,
        nodeActive: C.lightNodeActive,
        nodeHover: C.lightNodeHover,
        edge: C.lightEdge,
        edgeActive: C.lightEdgeActive,
        edgeHover: C.lightEdgeHover,
        label: C.lightLabel,
        labelActive: C.lightLabelActive,
        labelHover: C.lightLabelHover,
      }
    : {
        bg: C.bg,
        node: C.node,
        nodeActive: C.nodeActive,
        nodeHover: C.nodeHover,
        edge: C.edge,
        edgeActive: C.edgeActive,
        edgeHover: C.edgeHover,
        label: C.label,
        labelActive: C.labelActive,
        labelHover: C.labelHover,
      };

  // Clear previous
  d3.select(svgEl).selectAll("*").remove();
  const svg = d3
    .select(svgEl)
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`);

  // Pure black (or white) background — NO grid, NO dots
  svg
    .append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", T.bg)
    .attr("rx", isCompact ? 8 : 0)
    .attr("pointer-events", "none");

  /* ---------- Determine visible nodes ---------- */
  const connectedIds = new Set<string>();
  if (currentSlug) {
    connectedIds.add(currentSlug);
    for (const e of data.edges) {
      if (e.source === currentSlug) connectedIds.add(e.target);
      if (e.target === currentSlug) connectedIds.add(e.source);
    }
  }

  const visibleNodes = currentSlug && !showAllLabels
    ? data.nodes.filter((n) => connectedIds.has(n.id))
    : data.nodes.filter((n) => n.connections > 0);

  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
  const visibleLinks: { source: string; target: string }[] = data.edges.filter(
    (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
  );

  if (visibleNodes.length === 0) return null;

  /* ---------- Build simulation data ---------- */
  const cx = width / 2;
  const cy = height / 2;
  const spreadRadius = isCompact
    ? Math.min(width, height) * 0.18
    : Math.min(width, height) * 0.32;

  const simNodes: SimNode[] = visibleNodes.map((n, i) => {
    const angle = (i / visibleNodes.length) * Math.PI * 2 - Math.PI / 2;
    const jitter = isCompact ? 15 : 30;
    return {
      ...n,
      isCurrent: n.id === currentSlug,
      isConnected: currentSlug ? connectedIds.has(n.id) : n.connections > 0,
      x: cx + Math.cos(angle) * spreadRadius + (Math.random() - 0.5) * jitter,
      y: cy + Math.sin(angle) * spreadRadius + (Math.random() - 0.5) * jitter,
    };
  });

  const simLinks: SimLink[] = visibleLinks.map((e) => ({
    source: e.source,
    target: e.target,
  }));

  /* ---------- SVG Defs ---------- */
  const defs = svg.append("defs");

  // Subtle white glow for active/current node
  const glowId = `glow-${Date.now()}`;
  const glow = defs
    .append("filter")
    .attr("id", glowId)
    .attr("x", "-200%")
    .attr("y", "-200%")
    .attr("width", "500%")
    .attr("height", "500%");
  glow
    .append("feGaussianBlur")
    .attr("stdDeviation", C.glowActive)
    .attr("result", "b");
  const gm = glow.append("feMerge");
  gm.append("feMergeNode").attr("in", "b");
  gm.append("feMergeNode").attr("in", "SourceGraphic");

  // Hover glow
  const hGlowId = `hglow-${Date.now()}`;
  const hglow = defs
    .append("filter")
    .attr("id", hGlowId)
    .attr("x", "-150%")
    .attr("y", "-150%")
    .attr("width", "400%")
    .attr("height", "400%");
  hglow
    .append("feGaussianBlur")
    .attr("stdDeviation", C.glowHover)
    .attr("result", "b");
  const hm = hglow.append("feMerge");
  hm.append("feMergeNode").attr("in", "b");
  hm.append("feMergeNode").attr("in", "SourceGraphic");

  /* ---------- Main group (zoom/pan) ---------- */
  const g = svg.append("g");

  /* ---------- EDGES ---------- */
  const linkSel = g
    .append("g")
    .selectAll<SVGLineElement, SimLink>("line")
    .data(simLinks)
    .join("line")
    .attr("stroke", (d) => {
      const sid = d.source as string;
      const tid = d.target as string;
      if (currentSlug && (sid === currentSlug || tid === currentSlug)) return T.edgeActive;
      return T.edge;
    })
    .attr("stroke-width", (d) => {
      const sid = d.source as string;
      const tid = d.target as string;
      if (currentSlug && (sid === currentSlug || tid === currentSlug)) return 1.2;
      return 0.8;
    })
    .attr("stroke-linecap", "round")
    .attr("opacity", 0);

  // Fade in edges
  linkSel.transition().duration(600).delay(100).attr("opacity", 1);

  /* ---------- NODES ---------- */
  // Node radii — active node is significantly larger (like Obsidian's "Home")
  // In full graph: scale by connection count for visual hierarchy
  const baseNodeR = isCompact ? 4 : 4.5;
  const activeR = isCompact ? 8 : 10;
  const maxConn = Math.max(1, ...simNodes.map((n) => n.connections));

  function getNodeR(d: SimNode): number {
    if (d.isCurrent) return activeR;
    if (isCompact) return baseNodeR;
    // Scale 4.5 → 7 based on connections
    const t = d.connections / maxConn;
    return baseNodeR + t * 2.5;
  }

  const nodeSel = g
    .append("g")
    .selectAll<SVGCircleElement, SimNode>("circle")
    .data(simNodes, (d) => d.id)
    .join("circle")
    .attr("r", 0) // Start at 0 for fade-in
    .attr("fill", (d) => {
      if (d.isCurrent) return T.nodeActive;
      // In full graph, brighter nodes for more connections
      if (!isCompact) {
        const t = d.connections / maxConn;
        const brightness = Math.round(160 + t * 72); // #a0 → #e0
        return `rgb(${brightness},${brightness},${brightness})`;
      }
      return T.node;
    })
    .attr("cursor", "pointer")
    .style("filter", (d) => (d.isCurrent ? `url(#${glowId})` : "none"));

  // Fade-in nodes
  nodeSel
    .transition()
    .duration(400)
    .delay((_d, i) => 50 + i * 40)
    .attr("r", getNodeR);

  /* ---------- LABELS ---------- */
  const labelGroup = g.append("g");

  // Show labels for: all nodes in full mode, connected nodes in compact mode
  const showLabels = showAllLabels
    ? simNodes
    : currentSlug
      ? simNodes.filter((n) => connectedIds.has(n.id))
      : [];

  const labelFs = isCompact ? 9 : 11;
  const labelMax = isCompact ? 20 : 40;

  const labelSel = labelGroup
    .selectAll<SVGTextElement, SimNode>("text")
    .data(showLabels, (d) => d.id)
    .join("text")
    .text((d) => truncate(d.title, labelMax))
    .attr("text-anchor", "middle")
    .attr("fill", (d) => {
      if (d.isCurrent) return T.labelActive;
      return T.label;
    })
    .attr("font-size", `${labelFs}px`)
    .attr("font-family", "system-ui, -apple-system, sans-serif")
    .attr("font-weight", (d) => (d.isCurrent ? "600" : "400"))
    .attr("pointer-events", "none")
    .attr("opacity", 0);

  labelSel
    .transition()
    .duration(400)
    .delay((_d, i) => 150 + i * 40)
    .attr("opacity", 1);

  // Hover label for unlabeled nodes (full graph mode)
  const hoverLabel = labelGroup
    .append("text")
    .attr("text-anchor", "middle")
    .attr("fill", T.labelHover)
    .attr("font-size", "11px")
    .attr("font-family", "system-ui, -apple-system, sans-serif")
    .attr("font-weight", "500")
    .attr("pointer-events", "none")
    .attr("opacity", 0);

  /* ---------- HOVER ---------- */
  let hoveredNode: SimNode | null = null;

  nodeSel
    .on("mouseenter", function (_ev, d: SimNode) {
      hoveredNode = d;

      // Enlarge hovered node + glow
      d3.select(this)
        .transition()
        .duration(120)
        .attr("r", getNodeR(d) + 3)
        .attr("fill", T.nodeHover)
        .style("filter", `url(#${hGlowId})`);

      // Show hover label if not already labeled
      if (!showLabels.some((n) => n.id === d.id)) {
        hoverLabel.attr("opacity", 1).text(truncate(d.title, 40));
      }

      // Find neighbors
      const nb = new Set<string>();
      nb.add(d.id);
      simLinks.forEach((l) => {
        const s = l.source as unknown as SimNode;
        const t = l.target as unknown as SimNode;
        if (s.id === d.id) nb.add(t.id);
        if (t.id === d.id) nb.add(s.id);
      });

      // Highlight connected edges, dim unrelated
      linkSel
        .transition()
        .duration(120)
        .attr("stroke", (l) => {
          const s = l.source as unknown as SimNode;
          const t = l.target as unknown as SimNode;
          if (s.id === d.id || t.id === d.id) return T.edgeHover;
          return T.edge;
        })
        .attr("stroke-width", (l) => {
          const s = l.source as unknown as SimNode;
          const t = l.target as unknown as SimNode;
          if (s.id === d.id || t.id === d.id) return 1.5;
          return 0.8;
        })
        .attr("opacity", (l) => {
          const s = l.source as unknown as SimNode;
          const t = l.target as unknown as SimNode;
          return s.id === d.id || t.id === d.id ? 1 : C.dimEdge;
        });

      // Dim non-neighbor nodes, brighten neighbors
      nodeSel
        .transition()
        .duration(120)
        .attr("opacity", (n) => (n.id === d.id || nb.has(n.id) ? 1 : C.dimNode))
        .attr("fill", (n) => {
          if (n.id === d.id) return T.nodeHover;
          if (n.isCurrent) return T.nodeActive;
          return nb.has(n.id) ? T.node : T.node;
        });

      // Dim non-neighbor labels
      labelSel
        .transition()
        .duration(120)
        .attr("opacity", (n) => (n.id === d.id || nb.has(n.id) ? 1 : C.dimLabel));
    })
    .on("mousemove", function (ev: MouseEvent) {
      if (hoveredNode) {
        const transform = d3.zoomTransform(svgEl);
        const [mx, my] = d3.pointer(ev, svgEl);
        hoverLabel
          .attr("x", (mx - transform.x) / transform.k)
          .attr("y", (my - transform.y) / transform.k + 18); // Label BELOW cursor
      }
    })
    .on("mouseleave", function (_ev, d: SimNode) {
      hoveredNode = null;

      // Restore node
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", getNodeR(d))
        .attr("fill", d.isCurrent ? T.nodeActive : T.node)
        .style("filter", d.isCurrent ? `url(#${glowId})` : "none")
        .attr("opacity", 1);

      // Restore all nodes
      nodeSel
        .transition()
        .duration(200)
        .attr("opacity", 1)
        .attr("fill", (n) => {
          if (n.isCurrent) return T.nodeActive;
          if (!isCompact) {
            const t = n.connections / maxConn;
            const brightness = Math.round(160 + t * 72);
            return `rgb(${brightness},${brightness},${brightness})`;
          }
          return T.node;
        });

      // Restore edges
      linkSel
        .transition()
        .duration(200)
        .attr("stroke", (l) => {
          const sid = l.source as string;
          const tid = l.target as string;
          if (currentSlug && (sid === currentSlug || tid === currentSlug)) return T.edgeActive;
          return T.edge;
        })
        .attr("stroke-width", (l) => {
          const sid = l.source as string;
          const tid = l.target as string;
          if (currentSlug && (sid === currentSlug || tid === currentSlug)) return 1.2;
          return 0.8;
        })
        .attr("opacity", 1);

      // Restore labels
      labelSel.transition().duration(200).attr("opacity", 1);
      hoverLabel.attr("opacity", 0);
    })
    .on("click", (_ev: MouseEvent, d: SimNode) => {
      if (onNavigate && d.id !== currentSlug) onNavigate(d.id);
    });

  /* ---------- DRAG ---------- */
  let simulation: d3.Simulation<SimNode, SimLink> | null = null;

  const drag = d3
    .drag<SVGCircleElement, SimNode>()
    .on("start", (ev, d) => {
      if (!ev.active) simulation?.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    })
    .on("drag", (ev, d) => {
      d.fx = ev.x;
      d.fy = ev.y;
    })
    .on("end", (ev, d) => {
      if (!ev.active) simulation?.alphaTarget(0);
      if (d.isCurrent) {
        d.fx = cx;
        d.fy = cy;
      } else {
        d.fx = null;
        d.fy = null;
      }
    });

  nodeSel.call(drag);

  /* ---------- FORCE SIMULATION ---------- */
  const currentNode = simNodes.find((n) => n.isCurrent);
  if (currentNode) {
    currentNode.fx = cx;
    currentNode.fy = cy;
  }

  simulation = d3
    .forceSimulation<SimNode>(simNodes)
    .force(
      "link",
      d3
        .forceLink<SimNode, SimLink>(simLinks)
        .id((d) => d.id)
        .distance(isCompact ? 80 : 120)
        .strength(0.5)
    )
    .force(
      "charge",
      d3
        .forceManyBody<SimNode>()
        .strength((d) => {
          if (d.isCurrent) return -40;
          return isCompact ? -60 : -80;
        })
        .distanceMax(isCompact ? 250 : 400)
        .distanceMin(10)
    )
    .force(
      "center",
      d3.forceCenter(cx, cy).strength(currentSlug ? 0 : 0.02)
    )
    .force(
      "collision",
      d3
        .forceCollide<SimNode>()
        .radius((d) => {
          const r = getNodeR(d);
          return r + (isCompact ? 16 : 28);
        })
        .strength(0.8)
        .iterations(3)
    )
    .force("x", d3.forceX(cx).strength(currentSlug ? 0.008 : 0.012))
    .force("y", d3.forceY(cy).strength(currentSlug ? 0.008 : 0.012))
    .alphaDecay(0.008)
    .velocityDecay(0.25)
    .alpha(1.2);

  /* ---------- TICK ---------- */
  simulation.on("tick", () => {
    simNodes.forEach((d) => {
      if (d.x !== undefined && d.y !== undefined) {
        const r = getNodeR(d);
        d.x = Math.max(r, Math.min(width - r, d.x));
        d.y = Math.max(r, Math.min(height - r, d.y));
      }
    });

    linkSel
      .attr("x1", (d) => (d.source as unknown as SimNode).x ?? 0)
      .attr("y1", (d) => (d.source as unknown as SimNode).y ?? 0)
      .attr("x2", (d) => (d.target as unknown as SimNode).x ?? 0)
      .attr("y2", (d) => (d.target as unknown as SimNode).y ?? 0);

    nodeSel.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);

    // Labels positioned BELOW nodes
    labelSel
      .attr("x", (d) => d.x ?? 0)
      .attr("y", (d) => {
        const r = getNodeR(d);
        return (d.y ?? 0) + r + 14;
      });
  });

  // Subtle reheat
  const reheatInterval = setInterval(() => {
    if (simulation && simulation.alpha() < 0.03) {
      simulation.alpha(0.06).restart();
    }
  }, 10000);

  /* ---------- ZOOM ---------- */
  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.3, 6])
    .clickDistance(4)
    .on("zoom", (ev) => {
      g.attr("transform", ev.transform);
    });

  svg.call(zoom);

  if (!isCompact) {
    svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(0.85));
  }

  return () => {
    clearInterval(reheatInterval);
    simulation?.stop();
    svg.on(".zoom", null);
  };
}

/* ================================================================== */
/*  ArticleGraph — sidebar graph                                        */
/* ================================================================== */

interface ArticleGraphProps {
  currentSlug: string;
  onNavigate?: (slug: string) => void;
}

export function ArticleGraph({ currentSlug, onNavigate }: ArticleGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [renderTrigger, setRenderTrigger] = useState(0);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchGraphData();
        if (cancelled) return;
        let connCount = 0;
        for (const e of data.edges) {
          if (e.source === currentSlug || e.target === currentSlug) connCount++;
        }
        if (connCount > 0) setGraphData(data);
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, [currentSlug]);

  useEffect(() => {
    if (!graphData || !svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const svg = svgRef.current;
    const w = container.clientWidth;
    const h = 300;
    if (w < 50) {
      const timer = setTimeout(() => setRenderTrigger((n) => n + 1), 100);
      return () => clearTimeout(timer);
    }

    if (stopRef.current) stopRef.current();
    stopRef.current = renderD3Graph(svg, graphData, {
      currentSlug,
      showAllLabels: false,
      width: w,
      height: h,
      onNavigate,
    });

    return () => { stopRef.current?.(); };
  }, [graphData, renderTrigger, currentSlug, onNavigate]);

  if (!graphData) return null;

  return (
    <div ref={containerRef} className="article-graph-sidebar">
      <div className="article-graph-header">
        <div className="flex items-center gap-1.5">
          <Network className="h-3 w-3 text-[var(--text-muted)]" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Connected Notes
          </span>
        </div>
      </div>
      <svg
        ref={svgRef}
        style={{ width: "100%", display: "block", borderRadius: "0.5rem", height: 300 }}
      />
      <p className="text-[10px] text-[var(--text-faint)] text-center mt-1.5">
        Drag nodes · Scroll to zoom
      </p>
    </div>
  );
}

/* ================================================================== */
/*  FullGraphModal                                                      */
/* ================================================================== */

interface FullGraphModalProps {
  open: boolean;
  onClose: () => void;
  onNavigate?: (slug: string) => void;
}

export function FullGraphModal({ open, onClose, onNavigate }: FullGraphModalProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const onNavigateRef = useRef(onNavigate);
  useEffect(() => {
    onNavigateRef.current = onNavigate;
  }, [onNavigate]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Fetch data, wait for animation, then render
  useEffect(() => {
    if (!open) {
      stopRef.current?.();
      stopRef.current = null;
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const dataPromise = fetchGraphData();
        await new Promise<void>((r) => setTimeout(r, 380));

        if (cancelled) return;
        const data = await dataPromise;
        if (cancelled) return;

        const container = containerRef.current;
        const svg = svgRef.current;
        if (!container || !svg) return;

        let w = container.clientWidth;
        let h = container.clientHeight;
        for (let retry = 0; retry < 5 && (w < 100 || h < 100); retry++) {
          await new Promise<void>((r) => setTimeout(r, 60));
          if (cancelled) return;
          w = container.clientWidth;
          h = container.clientHeight;
        }

        if (w < 100 || h < 100) return;

        stopRef.current = renderD3Graph(svg, data, {
          showAllLabels: true,
          width: w,
          height: h,
          onNavigate: onNavigateRef.current,
        });
      } catch {
        /* silent */
      }
    })();

    return () => {
      cancelled = true;
      stopRef.current?.();
      stopRef.current = null;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="full-graph-overlay"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="full-graph-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="full-graph-modal-header">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-[var(--text-muted)]" />
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Knowledge Graph
                </h2>
                <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-surface-2)] px-2 py-0.5 rounded-full">
                  All Notes
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={containerRef} className="full-graph-modal-body">
              <svg ref={svgRef} style={{ width: "100%", height: "100%", display: "block" }} />
            </div>

            <div className="full-graph-modal-footer">
              <span className="text-[10px] text-[var(--text-faint)]">
                Scroll to zoom · Drag nodes to rearrange · Click to navigate
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ================================================================== */
/*  GraphToggleButton                                                  */
/* ================================================================== */

interface GraphToggleButtonProps {
  onClick: () => void;
}

export function GraphToggleButton({ onClick }: GraphToggleButtonProps) {
  return (
    <button onClick={onClick} className="graph-toggle-btn group" title="View Knowledge Graph">
      <Network className="h-4 w-4" />
      <span className="graph-toggle-label">
        <Maximize2 className="h-3 w-3" />
      </span>
    </button>
  );
}