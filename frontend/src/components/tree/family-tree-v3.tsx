/**
 * @project AncestorTree
 * @file src/components/tree/family-tree-v3.tsx
 * @description Interactive family tree optimized with D3.js for rendering and zooming
 * @version 3.5.0 - Click-Outside Hook + Perfect Keyboard Navigation
 */

'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { NODE_HEIGHT, NODE_WIDTH } from '@/constants';
import { useTreeData } from '@/hooks/use-families';
import { useSearchPeople, useSearchPeopleAdvanced } from '@/hooks/use-people';
import { getInitials } from '@/lib/format-utils';
import { buildTreeLayout } from '@/lib/helper';
import type { Person } from '@/types';
import * as d3 from 'd3';
import {
  AlertCircle,
  RotateCcw,
  Search,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ViewMode = 'all' | 'ancestors' | 'descendants';

export function FamilyTreeV3() {
  const { data, isLoading, error } = useTreeData();

  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('all');

  // Search state
  const [filterSearch, setFilterSearch] = useState('');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Ref cho toàn bộ khu vực Search (Input + Dropdown) để bắt sự kiện Click Outside
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // FEATURE: Click ra ngoài tự đóng dropdown (Thay thế hoàn hảo cho Popover)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setFilterDropdownOpen(false);
      }
    };
    // Dùng mousedown để bắt nhạy hơn click
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filterSearch);
      setFocusedIndex(-1); // Reset vị trí phím
    }, 300);
    return () => clearTimeout(timer);
  }, [filterSearch]);

  const { data: searchResults, isFetching: isSearching } =
    useSearchPeopleAdvanced(debouncedSearch);

  // Xử lý Lên/Xuống/Enter siêu mượt
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!filterDropdownOpen || !searchResults || searchResults.length === 0)
      return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev =>
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < searchResults.length) {
        focusOnPerson(searchResults[focusedIndex]);
      }
    } else if (e.key === 'Escape') {
      setFilterDropdownOpen(false);
    }
  };

  // D3 Refs
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const zoomBehavior = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(
    null
  );

  const layout = useMemo(() => {
    if (!data || data.people.length === 0) return null;
    return buildTreeLayout(
      data,
      collapsedNodes,
      viewMode,
      selectedPerson?.id || null,
      null
    );
  }, [data, collapsedNodes, viewMode, selectedPerson?.id]);

  useEffect(() => {
    if (!svgRef.current || !layout || layout.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const { nodes, connections, offsetX } = layout;

    if (svg.select('g.main-container').empty()) {
      svg
        .append('rect')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('fill', 'transparent')
        .attr('class', 'zoom-capture');
      const mainContainer = svg.append('g').attr('class', 'main-container');
      mainContainer.append('g').attr('class', 'links-layer');
      mainContainer.append('g').attr('class', 'nodes-layer');

      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 3])
        .on('zoom', event => {
          mainContainer.attr('transform', event.transform);
        });

      svg.call(zoom);
      svg.on('dblclick.zoom', null);
      zoomBehavior.current = zoom;

      if (wrapperRef.current) {
        const { clientWidth } = wrapperRef.current;
        svg.call(
          zoom.translateTo,
          layout.width / 2 - offsetX,
          layout.height / 3
        );
        svg.call(zoom.scaleTo, clientWidth < 768 ? 0.7 : 1);
      }
    }

    const mainContainer = svg.select('g.main-container');
    const nodesLayer = mainContainer.select('g.nodes-layer');
    const linksLayer = mainContainer.select('g.links-layer');

    mainContainer
      .transition()
      .duration(500)
      .attr('transform', () => d3.zoomTransform(svg.node()!).toString());

    // --- RENDER LINKS ---
    const linkBinding = linksLayer
      .selectAll('g.link')
      .data(connections, (d: any) => d.id);
    const linkEnter = linkBinding
      .enter()
      .append('g')
      .attr('class', 'link')
      .style('opacity', 0);

    linkEnter.each(function (d: any) {
      const g = d3.select(this);
      const startX = d.x1 + offsetX;
      const startY = d.y1;

      if (d.type === 'couple') {
        g.append('line')
          .attr('class', 'text-pink-400 stroke-current')
          .attr('stroke-width', 2)
          .attr('x1', startX)
          .attr('y1', startY)
          .attr('x2', startX)
          .attr('y2', startY);
      } else {
        g.append('path')
          .attr('class', 'text-muted-foreground stroke-current fill-none')
          .attr('stroke-width', 1.5)
          .attr('d', `M ${startX} ${startY} L ${startX} ${startY}`);
      }
    });

    const linkUpdate = linkEnter
      .merge(linkBinding as any)
      .transition()
      .duration(500)
      .style('opacity', 1);

    linkUpdate.each(function (d: any) {
      const g = d3.select(this);
      const x1 = d.x1 + offsetX;
      const x2 = d.x2 + offsetX;
      const y1 = d.y1;
      const y2 = d.y2;

      if (d.type === 'couple') {
        g.select('line')
          .attr('x1', x1)
          .attr('y1', y1)
          .attr('x2', x2)
          .attr('y2', y2);
      } else {
        const midY = y1 + (y2 - y1) / 2;
        const radius = 10;
        let pathData = '';

        if (Math.abs(x1 - x2) < radius * 2) {
          pathData = `M ${x1} ${y1} L ${x2} ${y2}`;
        } else {
          const dirX = x2 > x1 ? 1 : -1;
          pathData = `M ${x1} ${y1} L ${x1} ${midY - radius} Q ${x1} ${midY} ${x1 + radius * dirX} ${midY} L ${x2 - radius * dirX} ${midY} Q ${x2} ${midY} ${x2} ${midY + radius} L ${x2} ${y2}`;
        }
        g.select('path').attr('d', pathData.trim());
      }
    });

    linkBinding.exit().transition().duration(300).style('opacity', 0).remove();

    // --- RENDER NODES ---
    const nodeBinding = nodesLayer
      .selectAll('g.node')
      .data(nodes, (d: any) => d.person.id);

    const nodeEnter = nodeBinding
      .enter()
      .append('g')
      .attr('class', 'node cursor-pointer')
      .attr('transform', (d: any) => `translate(${d.x}, ${d.y - 20})`)
      .style('opacity', 0)
      .on('click', (event, d: any) => setSelectedPerson(d.person));

    nodeEnter
      .append('foreignObject')
      .attr('width', NODE_WIDTH)
      .attr('height', NODE_HEIGHT)
      .html((d: any) => {
        const p = d.person;
        const genderColor =
          p.gender === 1 ? 'border-blue-400' : 'border-pink-400';
        const isSelected = selectedPerson?.id === p.id;
        const selectedRing = isSelected
          ? 'ring-2 ring-primary ring-offset-2'
          : '';
        const isDead = !p.is_living
          ? `<span class="text-[9px] text-muted-foreground pointer-events-none absolute top-0.5 right-1.5">†</span>`
          : '';
        const avatarHtml = p.avatar_url
          ? `<img src="${p.avatar_url}" class="h-6 w-6 mb-0.5 rounded-full object-cover pointer-events-none border border-muted shadow-sm" loading="lazy" />`
          : `<div class="h-6 w-6 mb-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[9px] font-bold border border-muted shadow-sm pointer-events-none">${getInitials(p.display_name)}</div>`;

        return `
          <div class="h-full bg-card border-[1.5px] ${genderColor} ${selectedRing} rounded-md shadow-sm hover:shadow-md transition-all p-1.5 flex flex-col items-center justify-center relative select-none">
            ${avatarHtml}
            <span class="text-[10px] font-medium text-center line-clamp-2 leading-tight pointer-events-none px-0.5">${p.display_name}</span>
            ${isDead}
          </div>
        `;
      });

    nodeEnter.each(function (d: any) {
      if (d.hasChildren) {
        const g = d3.select(this);
        const btn = g
          .append('g')
          .attr('class', 'collapse-btn cursor-pointer')
          .attr('transform', `translate(${NODE_WIDTH / 2}, ${NODE_HEIGHT})`)
          .on('click', (event, d: any) => {
            event.stopPropagation();
            handleToggleCollapse(d.person.id);
          });
        btn
          .append('circle')
          .attr('r', 8)
          .attr(
            'class',
            'fill-background stroke-border hover:fill-muted transition-colors'
          )
          .attr('stroke-width', 1);
        btn
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('class', 'text-[10px] font-bold fill-foreground select-none')
          .text(d.isCollapsed ? '+' : '-');
      }
    });

    nodeEnter
      .merge(nodeBinding as any)
      .transition()
      .duration(500)
      .attr('transform', (d: any) => `translate(${d.x + offsetX}, ${d.y})`)
      .style('opacity', 1);

    nodesLayer
      .selectAll('g.node')
      .select('foreignObject > div')
      .attr('class', (d: any) => {
        const genderColor =
          d.person.gender === 1 ? 'border-blue-400' : 'border-pink-400';
        const isSelected = selectedPerson?.id === d.person.id;
        const selectedRing = isSelected
          ? 'ring-2 ring-primary ring-offset-2'
          : '';
        return `h-full bg-card border-[1.5px] ${genderColor} ${selectedRing} rounded-md shadow-sm hover:shadow-md transition-all p-1.5 flex flex-col items-center justify-center relative select-none`;
      });

    nodesLayer
      .selectAll('g.node')
      .select('g.collapse-btn text')
      .text((d: any) => (d.isCollapsed ? '+' : '-'));

    nodeBinding
      .exit()
      .transition()
      .duration(300)
      .attr('transform', (d: any) => `translate(${d.x + offsetX}, ${d.y + 20})`)
      .style('opacity', 0)
      .remove();
  }, [layout, selectedPerson?.id]);

  const handleZoomIn = () =>
    svgRef.current &&
    d3
      .select(svgRef.current)
      .transition()
      .call(zoomBehavior.current!.scaleBy, 1.3);
  const handleZoomOut = () =>
    svgRef.current &&
    d3
      .select(svgRef.current)
      .transition()
      .call(zoomBehavior.current!.scaleBy, 0.7);
  const handleResetZoom = () =>
    svgRef.current &&
    d3
      .select(svgRef.current)
      .transition()
      .call(zoomBehavior.current!.scaleTo, 1);

  const handleToggleCollapse = (personId: string) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(personId)) next.delete(personId);
      else next.add(personId);
      return next;
    });
  };

  const handleExpandAll = useCallback(() => setCollapsedNodes(new Set()), []);

  const focusOnPerson = useCallback(
    (person: Person) => {
      if (
        !svgRef.current ||
        !wrapperRef.current ||
        !zoomBehavior.current ||
        !layout
      )
        return;

      const node = layout.nodes.find(n => n.person.id === person.id);
      if (!node) return;

      const { clientWidth, clientHeight } = wrapperRef.current;
      const scale = 1.2;

      const x =
        -(node.x + layout.offsetX + NODE_WIDTH / 2) * scale + clientWidth / 2;
      const y = -(node.y + NODE_HEIGHT / 2) * scale + clientHeight / 2;

      d3.select(svgRef.current)
        .transition()
        .duration(750)
        .call(
          zoomBehavior.current.transform,
          d3.zoomIdentity.translate(x, y).scale(scale)
        );

      setSelectedPerson(person);
      setFilterDropdownOpen(false);
      setFilterSearch('');
    },
    [layout]
  );

  if (error)
    return (
      <div className='flex flex-col items-center justify-center h-[85vh] text-destructive bg-destructive/5 rounded-xl border border-destructive/20 p-6'>
        <AlertCircle className='h-10 w-10 mb-2 opacity-80' />
        <h3 className='font-semibold text-lg'>Đã có lỗi xảy ra</h3>
        <p className='text-sm opacity-80'>{error.message}</p>
      </div>
    );

  if (isLoading)
    return (
      <div className='flex items-center justify-center h-[85vh]'>
        <Skeleton className='h-full w-full rounded-xl' />
      </div>
    );

  return (
    <div className='space-y-4 w-full'>
      <div className='flex flex-wrap items-center gap-3 relative z-40 bg-muted/40 p-2 rounded-lg border'>
        {/* NATIVE CONTAINER VỚI HOOK CLICK OUTSIDE */}
        <div className='relative w-64' ref={searchContainerRef}>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <input
            type='text'
            placeholder='Tìm theo tên...'
            value={filterSearch}
            onChange={e => {
              setFilterSearch(e.target.value);
              setFilterDropdownOpen(e.target.value.length >= 2);
            }}
            onFocus={() =>
              filterSearch.length >= 2 && setFilterDropdownOpen(true)
            }
            onKeyDown={handleSearchKeyDown} // Bàn phím không bị kẹt nữa!
            className='pl-8 pr-3 py-1.5 text-sm border rounded-md bg-background w-full focus:outline-none focus:ring-2 focus:ring-primary shadow-sm'
          />

          {filterDropdownOpen && debouncedSearch.length >= 2 && (
            <div className='absolute z-50 top-full mt-1 bg-background border rounded-md shadow-lg w-full max-h-56 overflow-y-auto'>
              {isSearching ? (
                <div className='p-3 text-sm text-center text-muted-foreground'>
                  Đang tìm kiếm...
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                searchResults.map((person, index) => {
                  const isFocused = index === focusedIndex;
                  return (
                    <button
                      key={person.id}
                      onMouseDown={e => {
                        e.preventDefault();
                        focusOnPerson(person);
                      }}
                      onMouseEnter={() => setFocusedIndex(index)}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2 transition-colors ${
                        isFocused ? 'bg-muted' : 'hover:bg-muted/50'
                      }`}>
                      <Avatar className='h-6 w-6'>
                        <AvatarImage src={person.avatar_url || ''} />
                        <AvatarFallback className='text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'>
                          {getInitials(person.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className='flex flex-col'>
                        <p className='text-sm font-medium truncate'>
                          {person.display_name}
                        </p>
                        <p className='text-xs text-muted-foreground truncate'>
                          Chi {person.chi} - Đời {person.generation}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className='p-3 text-sm text-center text-muted-foreground'>
                  Không tìm thấy kết quả
                </div>
              )}
            </div>
          )}
        </div>

        <div className='h-6 w-px bg-border mx-1 hidden sm:block'></div>

        <div className='flex items-center gap-1 border rounded-lg p-1 bg-background shadow-sm'>
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7'
            onClick={handleZoomOut}>
            <ZoomOut className='h-4 w-4' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7'
            onClick={handleZoomIn}>
            <ZoomIn className='h-4 w-4' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7'
            onClick={handleResetZoom}>
            <RotateCcw className='h-4 w-4' />
          </Button>
        </div>

        <Select
          value={viewMode}
          onValueChange={v => setViewMode(v as ViewMode)}>
          <SelectTrigger className='w-36 bg-background h-9 shadow-sm'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tất cả</SelectItem>
            <SelectItem value='ancestors'>Tổ tiên</SelectItem>
            <SelectItem value='descendants'>Con cháu</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant='outline'
          size='sm'
          className='h-9 shadow-sm'
          onClick={handleExpandAll}>
          Mở rộng tất cả
        </Button>
      </div>

      {/* D3 Canvas Area */}
      <div
        ref={wrapperRef}
        className='border rounded-xl bg-slate-50/50 dark:bg-slate-900/20 overflow-hidden relative shadow-inner w-full h-[85vh]'>
        <svg
          ref={svgRef}
          className='w-full h-full cursor-grab active:cursor-grabbing outline-none'
          style={{ display: 'block' }}
        />
        <div className='absolute bottom-4 left-4 text-xs text-muted-foreground pointer-events-none opacity-50 font-medium select-none'>
          Dùng chuột/trackpad để cuộn, thu phóng hoặc kéo thả
        </div>
      </div>

      {/* Selected Person Card */}
      {selectedPerson && (
        <Card className='fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md shadow-2xl animate-in fade-in slide-in-from-bottom-8'>
          <CardContent className='p-4 flex items-center justify-between bg-background rounded-xl'>
            <div className='flex items-center gap-4'>
              <Avatar className='h-12 w-12 border-2 border-primary/10'>
                <AvatarImage src={selectedPerson.avatar_url || ''} />
                <AvatarFallback className='bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-lg'>
                  {getInitials(selectedPerson.display_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className='font-semibold text-base line-clamp-1'>
                  {selectedPerson.display_name}
                </h3>
                <p className='text-sm text-muted-foreground mt-0.5'>
                  Đời {selectedPerson.generation}
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Button asChild size='sm' className='rounded-full px-6'>
                <Link href={`/people/${selectedPerson.id}`}>Chi tiết</Link>
              </Button>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setSelectedPerson(null)}
                className='rounded-full h-8 w-8 text-muted-foreground'>
                <X className='h-4 w-4' />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
