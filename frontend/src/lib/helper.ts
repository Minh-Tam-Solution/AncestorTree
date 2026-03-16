import {
  BRANCH_GAP,
  COUPLE_GAP,
  LEVEL_HEIGHT,
  NODE_HEIGHT,
  NODE_WIDTH,
  SIBLING_GAP,
} from '@/constants';
import type { TreeData } from '@/lib/supabase-data';
import type { Person } from '@/types';

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

export function buildTreeLayout(
  data: TreeData,
  collapsedNodes: Set<string>,
  viewMode: ViewMode,
  focusPersonId: string | null,
  filterRootId: string | null = null
) {
  const { people, families, children } = data;

  // Pre-compute maps for O(1) performance
  const fatherToFamilies = new Map<string, typeof families>();
  const motherToFamilies = new Map<string, typeof families>();
  const childToFamily = new Map<string, (typeof families)[0]>();
  const familyToChildren = new Map<string, typeof children>();

  for (const child of children) {
    if (!familyToChildren.has(child.family_id))
      familyToChildren.set(child.family_id, []);
    familyToChildren.get(child.family_id)!.push(child);
  }

  for (const family of families) {
    if (family.father_id) {
      if (!fatherToFamilies.has(family.father_id))
        fatherToFamilies.set(family.father_id, []);
      fatherToFamilies.get(family.father_id)!.push(family);
    }
    if (family.mother_id) {
      if (!motherToFamilies.has(family.mother_id))
        motherToFamilies.set(family.mother_id, []);
      motherToFamilies.get(family.mother_id)!.push(family);
    }
  }

  for (const child of children) {
    if (!childToFamily.has(child.person_id)) {
      const fam = families.find(f => f.id === child.family_id);
      if (fam) childToFamily.set(child.person_id, fam);
    }
  }

  const getVisiblePeopleIds = (): Set<string> => {
    const visible = new Set<string>();

    if (filterRootId) {
      const addWithDescendants = (personId: string) => {
        if (visible.has(personId)) return;
        visible.add(personId);
        const fams = [
          ...(fatherToFamilies.get(personId) || []),
          ...(motherToFamilies.get(personId) || []),
        ];
        for (const fam of fams) {
          if (fam.father_id && fam.father_id !== personId)
            visible.add(fam.father_id);
          if (fam.mother_id && fam.mother_id !== personId)
            visible.add(fam.mother_id);
          const kids = familyToChildren.get(fam.id) || [];
          kids.forEach(c => addWithDescendants(c.person_id));
        }
      };
      addWithDescendants(filterRootId);
      return visible;
    }

    if (viewMode === 'all') {
      people.forEach(p => visible.add(p.id));
      const hideDescendants = (personId: string) => {
        const fams = fatherToFamilies.get(personId) || [];
        for (const fam of fams) {
          const kids = familyToChildren.get(fam.id) || [];
          kids.forEach(c => {
            visible.delete(c.person_id);
            hideDescendants(c.person_id);
          });
        }
      };
      collapsedNodes.forEach(nodeId => hideDescendants(nodeId));
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
          if (fam.father_id && fam.father_id !== personId)
            visible.add(fam.father_id);
          if (fam.mother_id && fam.mother_id !== personId)
            visible.add(fam.mother_id);
          const kids = familyToChildren.get(fam.id) || [];
          kids.forEach(c => addDescendants(c.person_id));
        }
      };
      addDescendants(focusPersonId);
    } else {
      people.forEach(p => visible.add(p.id));
    }

    return visible;
  };

  const visibleIds = getVisiblePeopleIds();
  const visiblePeople = people.filter(p => visibleIds.has(p.id));

  if (visiblePeople.length === 0) {
    return { nodes: [], connections: [], width: 0, height: 0, offsetX: 0 };
  }

  const positionedAsWife = new Set<string>();
  for (const p of visiblePeople) {
    if (p.gender === 2) {
      const fams = motherToFamilies.get(p.id) || [];
      if (fams.some(f => f.father_id && visibleIds.has(f.father_id))) {
        positionedAsWife.add(p.id);
      }
    }
  }

  const getVisibleChildrenAsFather = (personId: string): string[] => {
    const fams = fatherToFamilies.get(personId) || [];
    const result: string[] = [];
    for (const fam of fams) {
      const kids = familyToChildren.get(fam.id) || [];
      kids
        .filter(
          c => visibleIds.has(c.person_id) && !positionedAsWife.has(c.person_id)
        )
        .sort((a, b) => a.sort_order - b.sort_order)
        .forEach(c => {
          if (!result.includes(c.person_id)) result.push(c.person_id);
        });
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

  const roots: string[] = [];
  for (const p of visiblePeople) {
    if (positionedAsWife.has(p.id)) continue;
    const parentFam = childToFamily.get(p.id);
    if (!parentFam?.father_id || !visibleIds.has(parentFam.father_id)) {
      roots.push(p.id);
    }
  }

  const siblingGap = (childA: string, childB: string): number => {
    const aHasKids =
      !collapsedNodes.has(childA) &&
      getVisibleChildrenAsFather(childA).length > 0;
    const bHasKids =
      !collapsedNodes.has(childB) &&
      getVisibleChildrenAsFather(childB).length > 0;
    return aHasKids || bHasKids ? BRANCH_GAP : SIBLING_GAP;
  };

  const subtreeWidths = new Map<string, number>();
  const computeSubtreeWidth = (personId: string): number => {
    if (subtreeWidths.has(personId)) return subtreeWidths.get(personId)!;
    const wife = getVisibleWife(personId);
    const visChildren = collapsedNodes.has(personId)
      ? []
      : getVisibleChildrenAsFather(personId);
    const coupleWidth = NODE_WIDTH + (wife ? COUPLE_GAP + NODE_WIDTH : 0);
    let childrenWidth = 0;
    if (visChildren.length > 0) {
      for (let i = 0; i < visChildren.length; i++) {
        childrenWidth += computeSubtreeWidth(visChildren[i]);
        if (i < visChildren.length - 1)
          childrenWidth += siblingGap(visChildren[i], visChildren[i + 1]);
      }
    }
    const result = Math.max(coupleWidth, childrenWidth);
    subtreeWidths.set(personId, result);
    return result;
  };
  for (const root of roots) computeSubtreeWidth(root);

  const xPositions = new Map<string, number>();
  const assignPositions = (personId: string, startX: number) => {
    const sw = subtreeWidths.get(personId) || NODE_WIDTH;
    const wife = getVisibleWife(personId);
    const visChildren = collapsedNodes.has(personId)
      ? []
      : getVisibleChildrenAsFather(personId);
    const coupleWidth = NODE_WIDTH + (wife ? COUPLE_GAP + NODE_WIDTH : 0);
    const centerX = startX + sw / 2;

    const fatherX = centerX - coupleWidth / 2;
    xPositions.set(personId, fatherX);
    if (wife) xPositions.set(wife, fatherX + NODE_WIDTH + COUPLE_GAP);

    if (visChildren.length > 0) {
      let totalChildW = 0;
      for (let i = 0; i < visChildren.length; i++) {
        totalChildW += subtreeWidths.get(visChildren[i]) || NODE_WIDTH;
        if (i < visChildren.length - 1)
          totalChildW += siblingGap(visChildren[i], visChildren[i + 1]);
      }
      let childX = centerX - totalChildW / 2;
      for (let i = 0; i < visChildren.length; i++) {
        assignPositions(visChildren[i], childX);
        childX += subtreeWidths.get(visChildren[i]) || NODE_WIDTH;
        if (i < visChildren.length - 1)
          childX += siblingGap(visChildren[i], visChildren[i + 1]);
      }
    }
  };

  let rootStartX = 0;
  for (const root of roots) {
    assignPositions(root, rootStartX);
    rootStartX += (subtreeWidths.get(root) || NODE_WIDTH) + SIBLING_GAP * 2;
  }

  const minGen = Math.min(...visiblePeople.map(p => p.generation || 1));
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

  const connections: TreeConnectionData[] = [];
  const personPos = new Map(nodes.map(n => [n.person.id, { x: n.x, y: n.y }]));

  for (const family of families) {
    const fatherPos = family.father_id ? personPos.get(family.father_id) : null;
    const motherPos = family.mother_id ? personPos.get(family.mother_id) : null;
    if (!fatherPos && !motherPos) continue;

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
      (!family.father_id &&
        family.mother_id &&
        collapsedNodes.has(family.mother_id));
    if (parentIsCollapsed) continue;

    const parentPos = fatherPos ?? motherPos!;
    const familyCenterX =
      fatherPos && motherPos
        ? (fatherPos.x + NODE_WIDTH + motherPos.x) / 2
        : parentPos.x + NODE_WIDTH / 2;

    const kids = familyToChildren.get(family.id) || [];
    kids.forEach(child => {
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

  let minX = Infinity,
    maxX = -Infinity,
    maxY = 0;
  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    maxX = Math.max(maxX, n.x + NODE_WIDTH);
    maxY = Math.max(maxY, n.y + NODE_HEIGHT);
  }
  if (!isFinite(minX)) {
    minX = 0;
    maxX = 0;
  }

  return {
    nodes,
    connections,
    width: maxX - minX + 100,
    height: maxY + 50,
    offsetX: -minX + 50,
  };
}

export const removeVietnameseTones = (str: string) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD') // Phân tách chữ cái và dấu (VD: 'á' -> 'a' + '´')
    .replace(/[\u0300-\u036f]/g, '') // Xóa các dấu đi
    .replace(/đ/g, 'd'); // Xử lý riêng chữ đ vì NFD không tách được chữ đ
};
