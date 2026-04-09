'use client';

import { useMemo, useState } from 'react';

interface BiogenomeEntry {
  id: string;
  scientific_name: string;
  common_name: string | null;
  taxon_class: string | null;
  taxon_order: string | null;
  taxon_family: string;
  assembly_level: string;
  species_slug: string | null;
}

interface TreeNode {
  name: string;
  rank: 'class' | 'order' | 'family' | 'species';
  children?: TreeNode[];
  entry?: BiogenomeEntry;
  sequenced?: boolean;
}

const ASSEMBLY_COLORS: Record<string, string> = {
  'Chromosome': '#00d4aa',
  'Scaffold': '#4fc3f7',
  'Contig': '#ffb74d',
  'Not sequenced': '#374151',
};

function buildTree(entries: BiogenomeEntry[]): TreeNode[] {
  const classMap = new Map<string, Map<string, Map<string, BiogenomeEntry[]>>>();

  for (const entry of entries) {
    const cls = entry.taxon_class ?? 'Unknown';
    const ord = entry.taxon_order ?? 'Unknown';
    const fam = entry.taxon_family;

    if (!classMap.has(cls)) classMap.set(cls, new Map());
    const orderMap = classMap.get(cls)!;
    if (!orderMap.has(ord)) orderMap.set(ord, new Map());
    const famMap = orderMap.get(ord)!;
    if (!famMap.has(fam)) famMap.set(fam, []);
    famMap.get(fam)!.push(entry);
  }

  const classNodes: TreeNode[] = [];
  for (const [cls, orderMap] of classMap) {
    const orderNodes: TreeNode[] = [];
    for (const [ord, famMap] of orderMap) {
      const famNodes: TreeNode[] = [];
      for (const [fam, speciesArr] of famMap) {
        const speciesNodes: TreeNode[] = speciesArr.map((e) => ({
          name: e.scientific_name,
          rank: 'species' as const,
          entry: e,
          sequenced: e.assembly_level !== 'Not sequenced',
        }));
        famNodes.push({ name: fam, rank: 'family', children: speciesNodes });
      }
      orderNodes.push({ name: ord, rank: 'order', children: famNodes });
    }
    classNodes.push({ name: cls, rank: 'class', children: orderNodes });
  }
  return classNodes;
}

interface LayoutNode {
  node: TreeNode;
  x: number;
  y: number;
  parent?: LayoutNode;
}

const LEVEL_W = 140;
const LEAF_H = 28;
const PAD_TOP = 20;
const PAD_LEFT = 16;

function layoutTree(roots: TreeNode[]): { nodes: LayoutNode[]; height: number } {
  const nodes: LayoutNode[] = [];
  let leafIndex = 0;

  function assignY(node: TreeNode, depth: number, parent?: LayoutNode): number {
    if (!node.children || node.children.length === 0) {
      const y = PAD_TOP + leafIndex * LEAF_H;
      leafIndex++;
      const ln: LayoutNode = { node, x: PAD_LEFT + depth * LEVEL_W, y, parent };
      nodes.push(ln);
      return y;
    }

    const childYs = node.children.map((c) => assignY(c, depth + 1, undefined));
    const y = (childYs[0] + childYs[childYs.length - 1]) / 2;
    const ln: LayoutNode = { node, x: PAD_LEFT + depth * LEVEL_W, y, parent };
    nodes.push(ln);

    // Update children's parent ref
    for (const c of node.children) {
      const childLayout = nodes.find((n) => n.node === c);
      if (childLayout) childLayout.parent = ln;
    }

    return y;
  }

  const rootYs = roots.map((r) => assignY(r, 0));
  const _ = rootYs; // unused but needed for side effects
  const height = leafIndex * LEAF_H + PAD_TOP * 2;

  return { nodes, height };
}

function rankColor(rank: TreeNode['rank']): string {
  switch (rank) {
    case 'class': return '#818cf8';
    case 'order': return '#38bdf8';
    case 'family': return '#34d399';
    case 'species': return '#f9fafb';
  }
}

function rankFontSize(rank: TreeNode['rank']): number {
  switch (rank) {
    case 'class': return 11;
    case 'order': return 10;
    case 'family': return 9.5;
    case 'species': return 9;
  }
}

export default function PhylogeneticTree({ entries }: { entries: BiogenomeEntry[] }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; entry: BiogenomeEntry } | null>(null);

  const { nodes, svgWidth, svgHeight } = useMemo(() => {
    const roots = buildTree(entries);
    const { nodes, height } = layoutTree(roots);
    const maxX = Math.max(...nodes.map((n) => n.x)) + 200;
    return { nodes, svgWidth: maxX, svgHeight: height };
  }, [entries]);

  // Build edges: parent → child
  const edges: Array<{ x1: number; y1: number; x2: number; y2: number; key: string }> = [];
  for (const ln of nodes) {
    if (ln.parent) {
      edges.push({
        x1: ln.parent.x + 2,
        y1: ln.parent.y,
        x2: ln.x - 2,
        y2: ln.y,
        key: `${ln.parent.node.name}-${ln.node.name}`,
      });
    }
  }

  return (
    <div className="relative overflow-x-auto">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs">
        {Object.entries(ASSEMBLY_COLORS).map(([level, color]) => (
          <div key={level} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-gray-400">{level}</span>
          </div>
        ))}
      </div>

      <div className="relative">
        <svg
          width={svgWidth}
          height={svgHeight}
          className="font-mono select-none"
          style={{ background: 'transparent', display: 'block' }}
        >
          {/* Edges — step connectors */}
          {edges.map((e) => {
            const midX = (e.x1 + e.x2) / 2;
            const path = `M ${e.x1} ${e.y1} L ${midX} ${e.y1} L ${midX} ${e.y2} L ${e.x2} ${e.y2}`;
            return (
              <path
                key={e.key}
                d={path}
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth={1}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((ln) => {
            const isSpecies = ln.node.rank === 'species';
            const entry = ln.node.entry;
            const dotColor = entry ? ASSEMBLY_COLORS[entry.assembly_level] ?? ASSEMBLY_COLORS['Not sequenced'] : 'rgba(255,255,255,0.2)';
            const isHovered = hoveredId === entry?.id;

            return (
              <g
                key={ln.node.name + ln.x + ln.y}
                transform={`translate(${ln.x}, ${ln.y})`}
                style={{ cursor: isSpecies ? 'pointer' : 'default' }}
                onMouseEnter={() => {
                  if (entry) {
                    setHoveredId(entry.id);
                    setTooltip({ x: ln.x, y: ln.y, entry });
                  }
                }}
                onMouseLeave={() => {
                  setHoveredId(null);
                  setTooltip(null);
                }}
              >
                {/* Dot */}
                <circle
                  cx={0}
                  cy={0}
                  r={isSpecies ? 4 : 3}
                  fill={dotColor}
                  opacity={isSpecies ? 1 : 0.5}
                  stroke={isHovered ? 'white' : 'transparent'}
                  strokeWidth={1.5}
                />

                {/* Label */}
                <text
                  x={8}
                  y={4}
                  fill={rankColor(ln.node.rank)}
                  fontSize={rankFontSize(ln.node.rank)}
                  fontStyle={isSpecies ? 'italic' : 'normal'}
                  fontWeight={ln.node.rank === 'class' ? 700 : ln.node.rank === 'order' ? 600 : 400}
                  opacity={isHovered ? 1 : 0.85}
                >
                  {ln.node.name.length > 28 ? ln.node.name.slice(0, 26) + '…' : ln.node.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              left: tooltip.x + 16,
              top: tooltip.y - 60,
            }}
          >
            <div className="bg-[#0f2044] border border-teal-500/30 rounded-xl p-3 text-xs shadow-xl min-w-[200px] max-w-[260px]">
              <p className="text-white font-semibold italic mb-0.5">{tooltip.entry.scientific_name}</p>
              {tooltip.entry.common_name && (
                <p className="text-gray-400 mb-2">{tooltip.entry.common_name}</p>
              )}
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: ASSEMBLY_COLORS[tooltip.entry.assembly_level] ?? '#374151' }}
                />
                <span className="text-gray-300">{tooltip.entry.assembly_level}</span>
              </div>
              {tooltip.entry.taxon_family && (
                <p className="text-gray-500 mt-1">Family: {tooltip.entry.taxon_family}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
