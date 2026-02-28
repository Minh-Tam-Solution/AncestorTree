/**
 * @project AncestorTree
 * @file src/app/(main)/directory/page.tsx
 * @description Family directory with contacts, filters, search, privacy controls
 * @version 2.0.0
 * @updated 2026-02-25
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePeople } from '@/hooks/use-people';
import { useAuth } from '@/components/auth/auth-provider';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookUser,
  Search,
  Phone,
  Mail,
  MapPin,
  Lock,
  EyeOff,
  ExternalLink,
} from 'lucide-react';
import type { Person } from '@/types';

type FilterGender = 'all' | '1' | '2';
type FilterStatus = 'all' | 'living' | 'deceased';

function getContactDisplay(person: Person, isAuthenticated: boolean, isViewer: boolean, linkedPersonId?: string) {
  const maskedResult = { phone: null, email: null, address: null, zalo: null, facebook: null, masked: true };
  // Viewer role: only see names, all contacts masked (except self)
  if (isViewer && person.id !== linkedPersonId) {
    return maskedResult;
  }
  // Privacy level 2 = private: hide contacts from everyone except the person themselves
  if (person.privacy_level === 2 && person.id !== linkedPersonId) {
    return maskedResult;
  }
  // Privacy level 1 = members only: hide contacts from non-authenticated users
  if (person.privacy_level === 1 && !isAuthenticated) {
    return maskedResult;
  }
  return {
    phone: person.phone || null,
    email: person.email || null,
    address: person.address || person.hometown || null,
    zalo: person.zalo || null,
    facebook: person.facebook || null,
    masked: false,
  };
}

export default function DirectoryPage() {
  const { data: people, isLoading } = usePeople();
  const { user, profile } = useAuth();
  const isAuthenticated = !!user;
  const isViewer = profile?.role === 'viewer';

  const [search, setSearch] = useState('');
  const [generationFilter, setGenerationFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<FilterGender>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  // Get unique generations for filter
  const generations = useMemo(() => {
    if (!people) return [];
    const gens = [...new Set(people.map(p => p.generation))].sort((a, b) => a - b);
    return gens;
  }, [people]);

  // Filter and search
  const filteredPeople = useMemo(() => {
    if (!people) return [];

    return people.filter(p => {
      // Only show living people in directory (they have contact info)
      if (statusFilter === 'living' && !p.is_living) return false;
      if (statusFilter === 'deceased' && p.is_living) return false;

      // Search — only match contact fields if user has access (ISS-04)
      if (search) {
        const q = search.toLowerCase();
        const matchName = p.display_name.toLowerCase().includes(q);
        const canSeeContacts = !isViewer && isAuthenticated && p.privacy_level !== 2 && !(p.privacy_level === 1 && !isAuthenticated);
        const isSelf = p.id === profile?.linked_person;
        const searchContacts = canSeeContacts || isSelf;
        const matchPhone = searchContacts && p.phone?.toLowerCase().includes(q);
        const matchEmail = searchContacts && p.email?.toLowerCase().includes(q);
        const matchAddress = searchContacts && p.address?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchEmail && !matchAddress) return false;
      }

      // Generation
      if (generationFilter !== 'all' && p.generation !== Number(generationFilter)) return false;

      // Gender
      if (genderFilter !== 'all' && p.gender !== Number(genderFilter)) return false;

      return true;
    });
  }, [people, search, generationFilter, genderFilter, statusFilter, isViewer, isAuthenticated, profile?.linked_person]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
            <BookUser className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Danh bạ liên lạc</h1>
            <p className="text-muted-foreground">
              Thông tin liên lạc của các thành viên trong dòng họ
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên, SĐT, email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={generationFilter} onValueChange={setGenerationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Đời" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả đời</SelectItem>
                {generations.map(g => (
                  <SelectItem key={g} value={String(g)}>Đời {g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={genderFilter} onValueChange={v => setGenderFilter(v as FilterGender)}>
              <SelectTrigger>
                <SelectValue placeholder="Giới tính" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="1">Nam</SelectItem>
                <SelectItem value="2">Nữ</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v as FilterStatus)}>
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
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardDescription>
              {isLoading ? 'Đang tải...' : `${filteredPeople.length} thành viên`}
            </CardDescription>
            {!isAuthenticated && (
              <Badge variant="outline" className="gap-1">
                <Lock className="h-3 w-3" />
                Đăng nhập để xem đầy đủ
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPeople.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              Không tìm thấy thành viên phù hợp
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Họ tên</TableHead>
                    <TableHead className="min-w-[60px]">Đời</TableHead>
                    <TableHead className="min-w-[140px]">Điện thoại</TableHead>
                    <TableHead className="min-w-[180px]">Email</TableHead>
                    <TableHead className="min-w-[200px]">Địa chỉ</TableHead>
                    <TableHead className="min-w-[80px]">Liên kết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPeople.map(person => {
                    const contact = getContactDisplay(person, isAuthenticated, !!isViewer, profile?.linked_person);
                    return (
                      <TableRow key={person.id}>
                        <TableCell>
                          <Link
                            href={`/people/${person.id}`}
                            className="flex items-center gap-3 hover:underline"
                          >
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white ${
                                person.gender === 1 ? 'bg-blue-500' : 'bg-pink-500'
                              }`}
                            >
                              {person.display_name.charAt(person.display_name.length - 1)}
                            </div>
                            <div>
                              <div className="font-medium">{person.display_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {person.gender === 1 ? 'Nam' : 'Nữ'}
                                {!person.is_living && ' · Đã mất'}
                              </div>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{person.generation}</Badge>
                        </TableCell>
                        <TableCell>
                          {contact.masked ? (
                            <span className="flex items-center gap-1 text-muted-foreground text-sm">
                              <EyeOff className="h-3 w-3" /> Ẩn
                            </span>
                          ) : contact.phone ? (
                            <a
                              href={`tel:${contact.phone}`}
                              className="flex items-center gap-1 text-sm hover:underline"
                            >
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {contact.phone}
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {contact.masked ? (
                            <span className="flex items-center gap-1 text-muted-foreground text-sm">
                              <EyeOff className="h-3 w-3" /> Ẩn
                            </span>
                          ) : contact.email ? (
                            <a
                              href={`mailto:${contact.email}`}
                              className="flex items-center gap-1 text-sm hover:underline"
                            >
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {contact.email}
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {contact.masked ? (
                            <span className="flex items-center gap-1 text-muted-foreground text-sm">
                              <EyeOff className="h-3 w-3" /> Ẩn
                            </span>
                          ) : contact.address ? (
                            <span className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="truncate max-w-[180px]">{contact.address}</span>
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {contact.masked ? (
                            <span className="flex items-center gap-1 text-muted-foreground text-sm">
                              <EyeOff className="h-3 w-3" /> Ẩn
                            </span>
                          ) : (
                            <div className="flex gap-2">
                              {contact.zalo && (
                                <Badge variant="secondary" className="text-xs">Zalo</Badge>
                              )}
                              {contact.facebook && (
                                <a href={contact.facebook} target="_blank" rel="noopener noreferrer">
                                  <Badge variant="secondary" className="text-xs gap-1">
                                    FB <ExternalLink className="h-2.5 w-2.5" />
                                  </Badge>
                                </a>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
