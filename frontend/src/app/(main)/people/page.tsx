/**
 * @project AncestorTree
 * @file src/app/(main)/people/page.tsx
 * @description People list page with search and filter
 * @version 1.0.0
 * @updated 2026-02-24
 */

'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { usePeople, useStats } from '@/hooks/use-people';
import { PersonCard } from '@/components/people/person-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, Users, Plus, X } from 'lucide-react';
import Link from 'next/link';

export default function PeoplePage() {
  const { isEditor } = useAuth();
  const { data: people, isLoading, error } = usePeople();
  const { data: stats } = useStats();
  
  const [search, setSearch] = useState('');
  const [generationFilter, setGenerationFilter] = useState<string>('all');
  const [chiFilter, setChiFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Get unique generations and chi values
  const generations = useMemo(() => {
    if (!people) return [];
    return [...new Set(people.map(p => p.generation))].sort((a, b) => a - b);
  }, [people]);

  const chiValues = useMemo(() => {
    if (!people) return [];
    return [...new Set(people.filter(p => p.chi).map(p => p.chi!))].sort((a, b) => a - b);
  }, [people]);

  // Filter people
  const filteredPeople = useMemo(() => {
    if (!people) return [];
    
    return people.filter(person => {
      // Search filter
      if (search && !person.display_name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      
      // Generation filter
      if (generationFilter !== 'all' && person.generation !== parseInt(generationFilter)) {
        return false;
      }
      
      // Chi filter
      if (chiFilter !== 'all' && person.chi !== parseInt(chiFilter)) {
        return false;
      }
      
      // Status filter
      if (statusFilter === 'living' && !person.is_living) return false;
      if (statusFilter === 'deceased' && person.is_living) return false;
      
      return true;
    });
  }, [people, search, generationFilter, chiFilter, statusFilter]);

  const hasFilters = search || generationFilter !== 'all' || chiFilter !== 'all' || statusFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setGenerationFilter('all');
    setChiFilter('all');
    setStatusFilter('all');
  };

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Lỗi khi tải dữ liệu: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Thành viên
          </h1>
          <p className="text-muted-foreground">
            {stats ? `${stats.totalPeople} người trong ${stats.totalGenerations} đời` : 'Đang tải...'}
          </p>
        </div>
        {isEditor && (
          <Button asChild>
            <Link href="/people/new">
              <Plus className="h-4 w-4 mr-2" />
              Thêm mới
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {/* Filter selects */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select value={generationFilter} onValueChange={setGenerationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn đời" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả đời</SelectItem>
                {generations.map(gen => (
                  <SelectItem key={gen} value={gen.toString()}>
                    Đời {gen}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={chiFilter} onValueChange={setChiFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn chi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chi</SelectItem>
                {chiValues.map(chi => (
                  <SelectItem key={chi} value={chi.toString()}>
                    Chi {chi}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="living">Còn sống</SelectItem>
                <SelectItem value="deceased">Đã mất</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear filters */}
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Xóa bộ lọc
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          {isLoading ? 'Đang tải...' : `Hiển thị ${filteredPeople.length} người`}
        </p>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-14 w-14 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPeople.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {hasFilters ? (
                <>
                  <p>Không tìm thấy kết quả phù hợp</p>
                  <Button variant="link" onClick={clearFilters}>
                    Xóa bộ lọc
                  </Button>
                </>
              ) : (
                <>
                  <p>Chưa có dữ liệu thành viên</p>
                  {isEditor && (
                    <Button asChild variant="link">
                      <Link href="/people/new">Thêm thành viên đầu tiên</Link>
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPeople.map(person => (
              <PersonCard key={person.id} person={person} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
