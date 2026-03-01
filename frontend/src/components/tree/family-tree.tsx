/**
 * @project AncestorTree
 * @file src/components/tree/family-tree.tsx
 * @description Interactive family tree with zoom, pan, collapse/expand, filters, minimap
 * @version 2.0.0 - Sprint 3 Enhanced
 * @updated 2026-02-24
 */

'use client';

import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTreeData } from '@/hooks/use-families';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  User,
  ChevronDown,
  ChevronRight,
  Move,
  Maximize2,
  Users,
  ArrowUpFromLine,
  ArrowDownFromLine,
  Search,
  X,
  GitBranch,
} from 'lucide-react';
import type { Person } from '@/types';
import type { TreeData } from '@/lib/supabase-data';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const NODE_WIDTH = 120;
const NODE_HEIGHT = 80;
const LEVEL_HEIGHT = 140;
const SIBLING_GAP = 20;
const BRANCH_GAP = 60; // wider gap between siblings whose subtrees have children
const MINIMAP_WIDTH = 160;
const MINIMAP_HEIGHT = 100;

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

type ViewMode = 'all' | 'ancestors' | 'descendants';

interface TreeNodeData {
  person: Person;
  x: number;
  y: number;
  isCollapsed: boolean;
  hasChildren: boolean;
  isVisible: boolean;
}

interface TreeConnectionData {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: 'parent-child' | 'couple';
  isVisible: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// Tree Node Component
// ═══════════════════════════════════════════════════════════════════════════

interface TreeNodeProps {
  node: TreeNodeData;
  onSelect: (person: Person) => void;
  onToggleCollapse: (personId: string) => void;
  isSelected: boolean;
}

function TreeNode({ node, onSelect, onToggleCollapse, isSelected }: TreeNodeProps) {
  const { person, x, y, isCollapsed, hasChildren } = node;
  
  const initials = person.display_name
    .split(' ')
    .map((n) => n[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  const genderColor = person.gender === 1 ? 'border-blue-400' : 'border-pink-400';
  const selectedRing = isSelected ? 'ring-2 ring-primary ring-offset-2' : '';

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      <foreignObject x={x} y={y} width={NODE_WIDTH} height={NODE_HEIGHT}>
        <div
          className={`h-full bg-card border-2 ${genderColor} ${selectedRing} rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-all p-2 flex flex-col items-center justify-center relative`}
          onClick={() => onSelect(person)}
        >
          <Avatar className="h-8 w-8 mb-1">
            <AvatarImage src={person.avatar_url} />
            <AvatarFallback className="text-xs">
              {initials || <User className="h-3 w-3" />}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium text-center line-clamp-2 leading-tight">
            {person.display_name}
          </span>
          {!person.is_living && (
            <span className="text-[10px] text-muted-foreground">†</span>
          )}
          
          {/* Collapse/Expand button */}
          {hasChildren && (
            <button
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-background border rounded-full flex items-center justify-center shadow-sm hover:bg-muted transition-colors z-10"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse(person.id);
              }}
            >
              {isCollapsed ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          )}
        </div>
      </foreignObject>
    </motion.g>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tree Connection Component
// ═══════════════════════════════════════════════════════════════════════════

interface TreeConnectionProps {
  connection: TreeConnectionData;
}

function TreeConnection({ connection }: TreeConnectionProps) {
  const { x1, y1, x2, y2, type } = connection;

  if (type === 'couple') {
    return (
      <motion.line
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5 }}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="currentColor"
        strokeWidth={2}
        className="text-pink-400"
      />
    );
  }

  // Parent-child: draw stepped line
  const midY = y1 + (y2 - y1) / 2;
  return (
    <motion.path
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5 }}
      d={`M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="text-muted-foreground"
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Minimap Component
// ═══════════════════════════════════════════════════════════════════════════

interface MinimapProps {
  nodes: TreeNodeData[];
  viewBox: { x: number; y: number; width: number; height: number };
  treeWidth: number;
  treeHeight: number;
  onViewportClick: (x: number, y: number) => void;
}

function Minimap({ nodes, viewBox, treeWidth, treeHeight, onViewportClick }: MinimapProps) {
  const scaleX = MINIMAP_WIDTH / treeWidth;
  const scaleY = MINIMAP_HEIGHT / treeHeight;
  const scale = Math.min(scaleX, scaleY) * 0.9;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    onViewportClick(x, y);
  };

  const visibleNodes = nodes.filter(n => n.isVisible);

  return (
    <div className="absolute bottom-4 right-4 bg-background/90 border rounded-lg p-2 shadow-lg">
      <svg
        width={MINIMAP_WIDTH}
        height={MINIMAP_HEIGHT}
        className="cursor-pointer"
        onClick={handleClick}
      >
        <g transform={`scale(${scale})`}>
          {/* Nodes as dots */}
          {visibleNodes.map((node) => (
            <circle
              key={node.person.id}
              cx={node.x + NODE_WIDTH / 2}
              cy={node.y + NODE_HEIGHT / 2}
              r={4 / scale}
              className={node.person.gender === 1 ? 'fill-blue-400' : 'fill-pink-400'}
            />
          ))}
          
          {/* Viewport rectangle */}
          <rect
            x={viewBox.x}
            y={viewBox.y}
            width={viewBox.width}
            height={viewBox.height}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={2 / scale}
            className="opacity-50"
          />
        </g>
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tree Layout Builder — Hierarchical (Bottom-up subtree sizing)
// ═══════════════════════════════════════════════════════════════════════════

const COUPLE_GAP = 16;

function buildTreeLayout(
  data: TreeData,
  collapsedNodes: Set<string>,
  viewMode: ViewMode,
  focusPersonId: string | null,
  filterRootId: string | null = null
) {
  const { people, families, children } = data;

  // Build relationship maps
  const fatherToFamilies = new Map<string, typeof families>();
  const motherToFamilies = new Map<string, typeof families>();
  const childToFamily = new Map<string, (typeof families)[0]>();

  for (const family of families) {
    if (family.father_id) {
      if (!fatherToFamilies.has(family.father_id)) fatherToFamilies.set(family.father_id, []);
      fatherToFamilies.get(family.father_id)!.push(family);
    }
    if (family.mother_id) {
      if (!motherToFamilies.has(family.mother_id)) motherToFamilies.set(family.mother_id, []);
      motherToFamilies.get(family.mother_id)!.push(family);
    }
  }
  for (const child of children) {
    if (!childToFamily.has(child.person_id)) {
      const fam = families.find((f) => f.id === child.family_id);
      if (fam) childToFamily.set(child.person_id, fam);
    }
  }

  // Visible people selection
  const getVisiblePeopleIds = (): Set<string> => {
    const visible = new Set<string>();

    if (filterRootId) {
      // Branch filter: show filterRootId and all descendants (follows both father and mother families)
      const addWithDescendants = (personId: string) => {
        if (visible.has(personId)) return;
        visible.add(personId);
        const fams = [
          ...(fatherToFamilies.get(personId) || []),
          ...(motherToFamilies.get(personId) || []),
        ];
        for (const fam of fams) {
          if (fam.father_id && fam.father_id !== personId) visible.add(fam.father_id);
          if (fam.mother_id && fam.mother_id !== personId) visible.add(fam.mother_id);
          children
            .filter((c) => c.family_id === fam.id)
            .forEach((c) => addWithDescendants(c.person_id));
        }
      };
      addWithDescendants(filterRootId);
      return visible;
    }

    if (viewMode === 'all') {
      people.forEach((p) => visible.add(p.id));
      const hideDescendants = (personId: string) => {
        const fams = fatherToFamilies.get(personId) || [];
        for (const fam of fams) {
          children
            .filter((c) => c.family_id === fam.id)
            .forEach((c) => {
              visible.delete(c.person_id);
              hideDescendants(c.person_id);
            });
        }
      };
      collapsedNodes.forEach((nodeId) => hideDescendants(nodeId));
    } else if (viewMode === 'ancestors' && focusPersonId) {
      const addAncestors = (personId: string) => {
        visible.add(personId);
        const fam = childToFamily.get(personId);
        if (fam?.father_id) addAncestors(fam.father_id);
        if (fam?.mother_id) addAncestors(fam.mother_id);
      };
      addAncestors(focusPersonId);
    } else if (viewMode === 'descendants' && focusPersonId) {
      const addDescendants = (personId: string) => {
        if (visible.has(personId)) return;
        visible.add(personId);
        const fams = [
          ...(fatherToFamilies.get(personId) || []),
          ...(motherToFamilies.get(personId) || []),
        ];
        for (const fam of fams) {
          if (fam.father_id && fam.father_id !== personId) visible.add(fam.father_id);
          if (fam.mother_id && fam.mother_id !== personId) visible.add(fam.mother_id);
          children.filter((c) => c.family_id === fam.id).forEach((c) => addDescendants(c.person_id));
        }
      };
      addDescendants(focusPersonId);
    } else {
      people.forEach((p) => visible.add(p.id));
    }

    return visible;
  };

  const visibleIds = getVisiblePeopleIds();
  const visiblePeople = people.filter((p) => visibleIds.has(p.id));

  if (visiblePeople.length === 0) {
    return { nodes: [], connections: [], width: 0, height: 0, offsetX: 0 };
  }

  // Helpers
  const getVisibleChildrenAsFather = (personId: string): string[] => {
    const fams = fatherToFamilies.get(personId) || [];
    const result: string[] = [];
    for (const fam of fams) {
      children
        .filter((c) => c.family_id === fam.id && visibleIds.has(c.person_id) && !positionedAsWife.has(c.person_id))
        .sort((a, b) => a.sort_order - b.sort_order)
        .forEach((c) => { if (!result.includes(c.person_id)) result.push(c.person_id); });
    }
    return result;
  };

  const getVisibleWife = (personId: string): string | null => {
    const fams = fatherToFamilies.get(personId) || [];
    for (const fam of fams) {
      if (fam.mother_id && visibleIds.has(fam.mother_id)) return fam.mother_id;
    }
    return null;
  };

  // Wives will be positioned adjacent to husband — mark them
  const positionedAsWife = new Set<string>();
  for (const p of visiblePeople) {
    if (p.gender === 2) {
      const fams = motherToFamilies.get(p.id) || [];
      if (fams.some((f) => f.father_id && visibleIds.has(f.father_id))) {
        positionedAsWife.add(p.id);
      }
    }
  }

  // Root nodes: not a wife, and no visible father
  const roots: string[] = [];
  for (const p of visiblePeople) {
    if (positionedAsWife.has(p.id)) continue;
    const parentFam = childToFamily.get(p.id);
    if (!parentFam?.father_id || !visibleIds.has(parentFam.father_id)) {
      roots.push(p.id);
    }
  }

  // Gap between adjacent siblings — larger when at least one has a visible subtree
  const siblingGap = (childA: string, childB: string): number => {
    const aHasKids = !collapsedNodes.has(childA) && getVisibleChildrenAsFather(childA).length > 0;
    const bHasKids = !collapsedNodes.has(childB) && getVisibleChildrenAsFather(childB).length > 0;
    return (aHasKids || bHasKids) ? BRANCH_GAP : SIBLING_GAP;
  };

  // Bottom-up: subtree widths
  const subtreeWidths = new Map<string, number>();
  const computeSubtreeWidth = (personId: string): number => {
    if (subtreeWidths.has(personId)) return subtreeWidths.get(personId)!;
    const wife = getVisibleWife(personId);
    const visChildren = collapsedNodes.has(personId) ? [] : getVisibleChildrenAsFather(personId);
    const coupleWidth = NODE_WIDTH + (wife ? COUPLE_GAP + NODE_WIDTH : 0);
    let childrenWidth = 0;
    if (visChildren.length > 0) {
      for (let i = 0; i < visChildren.length; i++) {
        childrenWidth += computeSubtreeWidth(visChildren[i]);
        if (i < visChildren.length - 1) {
          childrenWidth += siblingGap(visChildren[i], visChildren[i + 1]);
        }
      }
    }
    const result = Math.max(coupleWidth, childrenWidth);
    subtreeWidths.set(personId, result);
    return result;
  };
  for (const root of roots) computeSubtreeWidth(root);

  // Top-down: assign X positions
  const xPositions = new Map<string, number>();
  const assignPositions = (personId: string, startX: number) => {
    const sw = subtreeWidths.get(personId) || NODE_WIDTH;
    const wife = getVisibleWife(personId);
    const visChildren = collapsedNodes.has(personId) ? [] : getVisibleChildrenAsFather(personId);
    const coupleWidth = NODE_WIDTH + (wife ? COUPLE_GAP + NODE_WIDTH : 0);
    const centerX = startX + sw / 2;

    // Center couple unit
    const fatherX = centerX - coupleWidth / 2;
    xPositions.set(personId, fatherX);
    if (wife) xPositions.set(wife, fatherX + NODE_WIDTH + COUPLE_GAP);

    // Children spread centered under couple
    if (visChildren.length > 0) {
      let totalChildW = 0;
      for (let i = 0; i < visChildren.length; i++) {
        totalChildW += (subtreeWidths.get(visChildren[i]) || NODE_WIDTH);
        if (i < visChildren.length - 1) {
          totalChildW += siblingGap(visChildren[i], visChildren[i + 1]);
        }
      }
      let childX = centerX - totalChildW / 2;
      for (let i = 0; i < visChildren.length; i++) {
        assignPositions(visChildren[i], childX);
        childX += (subtreeWidths.get(visChildren[i]) || NODE_WIDTH);
        if (i < visChildren.length - 1) {
          childX += siblingGap(visChildren[i], visChildren[i + 1]);
        }
      }
    }
  };

  let rootStartX = 0;
  for (const root of roots) {
    assignPositions(root, rootStartX);
    rootStartX += (subtreeWidths.get(root) || NODE_WIDTH) + SIBLING_GAP * 2;
  }

  const minGen = Math.min(...visiblePeople.map((p) => p.generation || 1));
  const nodes: TreeNodeData[] = [];
  for (const person of visiblePeople) {
    if (!xPositions.has(person.id)) continue;
    nodes.push({
      person,
      x: xPositions.get(person.id)!,
      y: (person.generation - minGen) * LEVEL_HEIGHT + 20,
      isCollapsed: collapsedNodes.has(person.id),
      hasChildren: getVisibleChildrenAsFather(person.id).length > 0,
      isVisible: true,
    });
  }

  // Build connections
  const connections: TreeConnectionData[] = [];
  const personPos = new Map(nodes.map((n) => [n.person.id, { x: n.x, y: n.y }]));

  for (const family of families) {
    const fatherPos = family.father_id ? personPos.get(family.father_id) : null;
    const motherPos = family.mother_id ? personPos.get(family.mother_id) : null;
    if (!fatherPos && !motherPos) continue;

    // Couple line (horizontal, between nodes)
    if (fatherPos && motherPos) {
      connections.push({
        id: `couple-${family.id}`,
        x1: fatherPos.x + NODE_WIDTH,
        y1: fatherPos.y + NODE_HEIGHT / 2,
        x2: motherPos.x,
        y2: motherPos.y + NODE_HEIGHT / 2,
        type: 'couple',
        isVisible: true,
      });
    }

    const parentIsCollapsed =
      (family.father_id && collapsedNodes.has(family.father_id)) ||
      (!family.father_id && family.mother_id && collapsedNodes.has(family.mother_id));
    if (parentIsCollapsed) continue;

    const parentPos = fatherPos ?? motherPos!;
    const familyCenterX =
      fatherPos && motherPos
        ? (fatherPos.x + NODE_WIDTH + motherPos.x) / 2
        : parentPos.x + NODE_WIDTH / 2;

    children.filter((c) => c.family_id === family.id).forEach((child) => {
      const childPos = personPos.get(child.person_id);
      if (childPos) {
        connections.push({
          id: `child-${family.id}-${child.person_id}`,
          x1: familyCenterX,
          y1: parentPos.y + NODE_HEIGHT,
          x2: childPos.x + NODE_WIDTH / 2,
          y2: childPos.y,
          type: 'parent-child',
          isVisible: true,
        });
      }
    });
  }

  // Bounds
  let minX = Infinity, maxX = -Infinity, maxY = 0;
  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    maxX = Math.max(maxX, n.x + NODE_WIDTH);
    maxY = Math.max(maxY, n.y + NODE_HEIGHT);
  }
  if (!isFinite(minX)) { minX = 0; maxX = 0; }

  return {
    nodes,
    connections,
    width: maxX - minX + 100,
    height: maxY + 50,
    offsetX: -minX + 50,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Family Tree Component
// ═══════════════════════════════════════════════════════════════════════════

export function FamilyTree() {
  const { data, isLoading, error } = useTreeData();

  // State
  const [scale, setScale] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 0.7 : 1
  );
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [showMinimap, setShowMinimap] = useState(true);
  // Lazy init from ?root= URL param (component is ssr:false so window is always available here)
  const [filterRootId, setFilterRootId] = useState<string | null>(() =>
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('root')
      : null
  );
  const [filterSearch, setFilterSearch] = useState('');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  // Auto-collapse: for large trees (>50 people), collapse gen 3+ on first load
  const autoCollapseApplied = useRef(false);
  useEffect(() => {
    if (!data || autoCollapseApplied.current) return;
    if (data.people.length <= 50) return;
    autoCollapseApplied.current = true;

    const minGen = Math.min(...data.people.map(p => p.generation || 1));
    const collapseFromGen = minGen + 2; // gen 3+ (relative)

    const fathersWithChildren = new Set<string>();
    for (const family of data.families) {
      if (family.father_id && data.children.some(c => c.family_id === family.id)) {
        fathersWithChildren.add(family.father_id);
      }
    }

    const toCollapse = new Set<string>();
    for (const person of data.people) {
      if (person.generation >= collapseFromGen && fathersWithChildren.has(person.id)) {
        toCollapse.add(person.id);
      }
    }

    if (toCollapse.size > 0) setCollapsedNodes(toCollapse);
  }, [data]);

  const handleSetFilterRoot = useCallback((person: Person | null) => {
    setFilterRootId(person?.id ?? null);
    setFilterSearch('');
    setFilterDropdownOpen(false);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (person) params.set('root', person.id);
      else params.delete('root');
      window.history.replaceState(null, '', params.toString() ? `?${params.toString()}` : window.location.pathname);
    }
  }, []);

  const filterRootPerson = filterRootId
    ? data?.people.find((p) => p.id === filterRootId) ?? null
    : null;

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  // Track container size via ResizeObserver (avoids reading refs during render)
  const containerCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      containerRef.current = node;
      setContainerSize({ width: node.clientWidth, height: node.clientHeight });
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
        }
      });
      observer.observe(node);
      return () => observer.disconnect();
    }
  }, []);

  // Layout
  const layout = useMemo(() => {
    if (!data || data.people.length === 0) return null;
    return buildTreeLayout(data, collapsedNodes, viewMode, selectedPerson?.id || null, filterRootId);
  }, [data, collapsedNodes, viewMode, selectedPerson?.id, filterRootId]);

  // Handlers
  const handleZoomIn = () => setScale((s) => Math.min(s + 0.1, 2));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.1, 0.3));
  const handleReset = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const handleToggleCollapse = useCallback((personId: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) {
        next.delete(personId);
      } else {
        next.add(personId);
      }
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    setCollapsedNodes(new Set());
  }, []);

  const handleCollapseAll = useCallback(() => {
    if (!data) return;
    const minGen = Math.min(...data.people.map(p => p.generation || 1));
    const fathersWithChildren = new Set<string>();
    for (const family of data.families) {
      if (family.father_id && data.children.some(c => c.family_id === family.id)) {
        fathersWithChildren.add(family.father_id);
      }
    }
    const toCollapse = new Set<string>();
    for (const person of data.people) {
      if (person.generation > minGen && fathersWithChildren.has(person.id)) {
        toCollapse.add(person.id);
      }
    }
    setCollapsedNodes(toCollapse);
  }, [data]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsPanning(true);
      setPanStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPanning && e.touches.length === 1) {
      setPan({
        x: e.touches[0].clientX - panStart.x,
        y: e.touches[0].clientY - panStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setScale((s) => Math.max(0.3, Math.min(2, s + delta)));
  };

  // Minimap viewport click
  const handleMinimapClick = (x: number, y: number) => {
    if (!containerRef.current || !layout) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPan({
      x: -(x - rect.width / 2 / scale),
      y: -(y - rect.height / 2 / scale),
    });
  };

  // View mode change
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode !== 'all' && !selectedPerson && data?.people.length) {
      setSelectedPerson(data.people[0]);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="space-y-4 text-center">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-64 w-96" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-12 text-center">
          <p className="text-destructive">Lỗi khi tải dữ liệu: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!layout || layout.nodes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p>Chưa có dữ liệu để hiển thị cây gia phả</p>
          <Button asChild variant="link" className="mt-2">
            <Link href="/people/new">Thêm thành viên đầu tiên</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const viewBox = {
    x: -pan.x / scale,
    y: -pan.y / scale,
    width: containerSize.width / scale,
    height: containerSize.height / scale,
  };

  return (
    <div className="space-y-4">
      {/* Branch filter */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/40 rounded-lg border border-dashed">
        <GitBranch className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium shrink-0">Xem nhánh từ:</span>

        {filterRootPerson ? (
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-md px-3 py-1">
            <span className="text-sm font-medium">{filterRootPerson.display_name}</span>
            <span className="text-xs text-muted-foreground">Đời {filterRootPerson.generation}</span>
            <button
              onClick={() => handleSetFilterRoot(null)}
              className="ml-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-2.5 top-1.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm thành viên..."
                value={filterSearch}
                onChange={(e) => {
                  setFilterSearch(e.target.value);
                  setFilterDropdownOpen(e.target.value.length >= 2);
                }}
                onFocus={() => filterSearch.length >= 2 && setFilterDropdownOpen(true)}
                onBlur={() => setTimeout(() => setFilterDropdownOpen(false), 200)}
                className="pl-8 pr-3 py-1 text-sm border rounded-md bg-background w-48 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {filterDropdownOpen && data?.people && (
              <div className="absolute z-50 top-full mt-1 bg-background border rounded-md shadow-lg w-64 max-h-48 overflow-y-auto">
                {data.people
                  .filter((p) =>
                    filterSearch.length >= 2 &&
                    p.display_name.toLowerCase().includes(filterSearch.toLowerCase())
                  )
                  .slice(0, 10)
                  .map((person) => (
                    <button
                      key={person.id}
                      onMouseDown={() => handleSetFilterRoot(person)}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors"
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                          person.gender === 1 ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                        }`}
                      >
                        {person.display_name.slice(-1)}
                      </div>
                      <div>
                        <p className="text-xs font-medium">{person.display_name}</p>
                        <p className="text-[10px] text-muted-foreground">Đời {person.generation}</p>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        {filterRootPerson && (
          <span className="text-xs text-muted-foreground ml-auto">
            Nhánh {filterRootPerson.display_name} · Đời {filterRootPerson.generation}
          </span>
        )}
        {!filterRootPerson && (
          <span className="text-xs text-muted-foreground ml-auto">Đang xem: Toàn bộ gia phả</span>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Zoom controls */}
        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* View mode filter */}
        <Select value={viewMode} onValueChange={(v) => handleViewModeChange(v as ViewMode)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Tất cả
              </span>
            </SelectItem>
            <SelectItem value="ancestors">
              <span className="flex items-center gap-2">
                <ArrowUpFromLine className="h-4 w-4" />
                Tổ tiên
              </span>
            </SelectItem>
            <SelectItem value="descendants">
              <span className="flex items-center gap-2">
                <ArrowDownFromLine className="h-4 w-4" />
                Con cháu
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Expand / Collapse all */}
        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleExpandAll}>
            <ChevronDown className="h-3 w-3 mr-1" />
            Mở rộng
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleCollapseAll}>
            <ChevronRight className="h-3 w-3 mr-1" />
            Thu gọn
          </Button>
        </div>

        {/* Toggle minimap */}
        <Button
          variant={showMinimap ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setShowMinimap(!showMinimap)}
          className="hidden md:flex"
        >
          <Maximize2 className="h-4 w-4 mr-2" />
          Minimap
        </Button>

        {/* Pan indicator */}
        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <Move className="h-3 w-3" />
          <span className="hidden sm:inline">Kéo để di chuyển</span>
        </div>
      </div>

      {/* View mode info */}
      {viewMode !== 'all' && selectedPerson && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {viewMode === 'ancestors' ? 'Tổ tiên của' : 'Con cháu của'}: {selectedPerson.display_name}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('all')}
          >
            Xem tất cả
          </Button>
        </div>
      )}

      {/* Tree container */}
      <div
        ref={containerCallbackRef}
        className="border rounded-lg bg-muted/30 overflow-hidden relative select-none"
        style={{ height: '60vh', cursor: isPanning ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <svg
          width="100%"
          height="100%"
          style={{ minWidth: '100%', minHeight: '100%' }}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
            <g transform={`translate(${layout.offsetX}, 0)`}>
              {/* Connections first (behind nodes) */}
              <AnimatePresence>
                {layout.connections.map((conn) => (
                  <TreeConnection key={conn.id} connection={conn} />
                ))}
              </AnimatePresence>

              {/* Nodes */}
              <AnimatePresence>
                {layout.nodes.map((node) => (
                  <TreeNode
                    key={node.person.id}
                    node={node}
                    onSelect={setSelectedPerson}
                    onToggleCollapse={handleToggleCollapse}
                    isSelected={selectedPerson?.id === node.person.id}
                  />
                ))}
              </AnimatePresence>
            </g>
          </g>
        </svg>

        {/* Minimap */}
        {showMinimap && layout.nodes.length > 3 && (
          <Minimap
            nodes={layout.nodes}
            viewBox={viewBox}
            treeWidth={layout.width}
            treeHeight={layout.height}
            onViewportClick={handleMinimapClick}
          />
        )}
      </div>

      {/* Selected person info */}
      <AnimatePresence>
        {selectedPerson && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedPerson.avatar_url} />
                    <AvatarFallback>
                      {selectedPerson.display_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedPerson.display_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Đời {selectedPerson.generation}
                      {selectedPerson.chi && ` • Chi ${selectedPerson.chi}`}
                      {!selectedPerson.is_living && ' • Đã mất'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {viewMode === 'all' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewModeChange('ancestors')}
                      >
                        <ArrowUpFromLine className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Tổ tiên</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewModeChange('descendants')}
                      >
                        <ArrowDownFromLine className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Con cháu</span>
                      </Button>
                    </>
                  )}
                  <Button asChild size="sm">
                    <Link href={`/people/${selectedPerson.id}`}>
                      Xem chi tiết
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
