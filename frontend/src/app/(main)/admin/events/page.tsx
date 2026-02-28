/**
 * @project AncestorTree
 * @file src/app/(main)/admin/events/page.tsx
 * @description Admin event management page — full CRUD for lịch sự kiện
 * @version 1.0.0
 * @updated 2026-02-28
 */

'use client';

import { useState, useMemo } from 'react';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/use-events';
import { usePeople } from '@/hooks/use-people';
import { useSearchPeople } from '@/hooks/use-people';
import { parseLunarString } from '@/lib/lunar-calendar';
import { EVENT_TYPE_LABELS } from '@/components/events/event-constants';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Calendar, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/auth-provider';
import Link from 'next/link';
import type { Event, EventType, Person } from '@/types';

type CreateEventInput = Omit<Event, 'id' | 'created_at'>;

const EVENT_TYPE_OPTIONS = Object.entries(EVENT_TYPE_LABELS).map(([value, { label }]) => ({
  value: value as EventType,
  label,
}));

function EventForm({
  event,
  onSubmit,
  isPending,
}: {
  event?: Event;
  onSubmit: (data: CreateEventInput) => void;
  isPending: boolean;
}) {
  const [eventType, setEventType] = useState<EventType>(event?.event_type || 'gio');
  const [title, setTitle] = useState(event?.title || '');
  const [eventLunar, setEventLunar] = useState(event?.event_lunar || '');
  const [lunarError, setLunarError] = useState('');
  const [eventDate, setEventDate] = useState(event?.event_date || '');
  const [location, setLocation] = useState(event?.location || '');
  const [description, setDescription] = useState(event?.description || '');
  const [recurring, setRecurring] = useState(event?.recurring ?? true);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [personQuery, setPersonQuery] = useState('');
  const [personDropOpen, setPersonDropOpen] = useState(false);

  // Resolve initial person if editing
  const { data: people } = usePeople();
  const initialPerson = useMemo(() => {
    if (!event?.person_id || !people) return null;
    return people.find(p => p.id === event.person_id) || null;
  }, [event?.person_id, people]);

  const resolvedPerson = selectedPerson ?? initialPerson;

  const { data: searchResults, isFetching } = useSearchPeople(personQuery);

  const validateLunar = (value: string) => {
    setEventLunar(value);
    if (!value) { setLunarError(''); return; }
    setLunarError(parseLunarString(value) ? '' : 'Sai định dạng. VD: 15/7 (ngày/tháng)');
  };

  const handleSelectPerson = (person: Person) => {
    setSelectedPerson(person);
    setPersonQuery('');
    setPersonDropOpen(false);
    if (eventType === 'gio' && !title) {
      setTitle(`Giỗ ${person.display_name}`);
      if (person.death_lunar) {
        setEventLunar(person.death_lunar);
        setLunarError('');
      }
    }
  };

  const handleClearPerson = () => {
    setSelectedPerson(null);
    setPersonQuery('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề');
      return;
    }
    if (eventLunar && !parseLunarString(eventLunar)) {
      toast.error('Ngày âm lịch không hợp lệ');
      return;
    }
    onSubmit({
      title: title.trim(),
      event_type: eventType,
      person_id: resolvedPerson?.id || undefined,
      event_lunar: eventLunar || undefined,
      event_date: eventDate || undefined,
      location: location || undefined,
      description: description || undefined,
      recurring,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Loại sự kiện *</Label>
        <Select value={eventType} onValueChange={v => setEventType(v as EventType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {EVENT_TYPE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Tiêu đề *</Label>
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="VD: Giỗ Ông Nội, Họp họ Xuân 2026"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Ngày âm lịch (DD/MM)</Label>
          <Input
            value={eventLunar}
            onChange={e => validateLunar(e.target.value)}
            placeholder="15/7"
            className={lunarError ? 'border-destructive' : ''}
          />
          {lunarError && <p className="text-xs text-destructive mt-1">{lunarError}</p>}
        </div>
        <div>
          <Label>Ngày dương lịch</Label>
          <Input
            type="date"
            value={eventDate}
            onChange={e => setEventDate(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label>Thành viên liên quan (tùy chọn)</Label>
        {resolvedPerson ? (
          <div className="flex items-center gap-2 p-2 rounded-md border bg-muted/50 mt-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
              resolvedPerson.gender === 1 ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
            }`}>
              {resolvedPerson.display_name.slice(-1)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{resolvedPerson.display_name}</p>
              <p className="text-xs text-muted-foreground">Đời {resolvedPerson.generation}</p>
            </div>
            <Button variant="ghost" size="sm" type="button" className="h-7 w-7 p-0 shrink-0" onClick={handleClearPerson}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="relative mt-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên... (gõ tối thiểu 2 ký tự)"
              value={personQuery}
              onChange={e => {
                setPersonQuery(e.target.value);
                setPersonDropOpen(e.target.value.length >= 2);
              }}
              onFocus={() => personQuery.length >= 2 && setPersonDropOpen(true)}
              onBlur={() => setTimeout(() => setPersonDropOpen(false), 150)}
              className="pl-9"
            />
            {personDropOpen && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-52 overflow-y-auto">
                {isFetching ? (
                  <p className="p-3 text-sm text-muted-foreground">Đang tìm...</p>
                ) : !searchResults?.length ? (
                  <p className="p-3 text-sm text-muted-foreground">Không tìm thấy thành viên</p>
                ) : (
                  searchResults.map(person => (
                    <button
                      key={person.id}
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent transition-colors"
                      onMouseDown={e => { e.preventDefault(); handleSelectPerson(person); }}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                        person.gender === 1 ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                      }`}>
                        {person.display_name.slice(-1)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{person.display_name}</p>
                        <p className="text-xs text-muted-foreground">Đời {person.generation}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <Label>Địa điểm</Label>
        <Input
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder="VD: Nhà thờ họ, Xóm Lâm Thịnh"
        />
      </div>

      <div>
        <Label>Ghi chú</Label>
        <Textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
          placeholder="Thông tin thêm về sự kiện..."
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="recurring"
          checked={recurring}
          onChange={e => setRecurring(e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="recurring" className="font-normal">Lặp lại hàng năm</Label>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Đang lưu...' : (event ? 'Cập nhật' : 'Thêm mới')}
      </Button>
    </form>
  );
}

export default function AdminEventsPage() {
  const { isEditor } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Event | undefined>();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all');

  const { data: events, isLoading } = useEvents();
  const { data: people } = usePeople();
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();

  const peopleMap = useMemo(() => {
    const map = new Map<string, Person>();
    for (const p of people || []) map.set(p.id, p);
    return map;
  }, [people]);

  const filtered = useMemo(() => {
    let items = events || [];
    if (typeFilter !== 'all') items = items.filter(e => e.event_type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(e => e.title.toLowerCase().includes(q));
    }
    return items;
  }, [events, search, typeFilter]);

  if (!isEditor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Bạn cần quyền biên tập viên để truy cập trang này</p>
            <Button asChild className="mt-4"><Link href="/">Về trang chủ</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreate = async (data: CreateEventInput) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Đã thêm sự kiện');
      setDialogOpen(false);
    } catch {
      toast.error('Lỗi khi thêm sự kiện');
    }
  };

  const handleUpdate = async (data: CreateEventInput) => {
    if (!editingItem) return;
    try {
      await updateMutation.mutateAsync({ id: editingItem.id, input: data });
      toast.success('Đã cập nhật sự kiện');
      setDialogOpen(false);
      setEditingItem(undefined);
    } catch {
      toast.error('Lỗi khi cập nhật');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Đã xóa sự kiện');
    } catch {
      toast.error('Lỗi khi xóa');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Lịch sự kiện</h1>
          <p className="text-muted-foreground">Thêm, sửa, xóa ngày giỗ và sự kiện dòng họ</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingItem(undefined); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Thêm sự kiện</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Sửa sự kiện' : 'Thêm sự kiện mới'}</DialogTitle>
            </DialogHeader>
            <EventForm
              key={editingItem?.id || 'new'}
              event={editingItem}
              onSubmit={editingItem ? handleUpdate : handleCreate}
              isPending={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Tìm kiếm theo tiêu đề..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={typeFilter} onValueChange={v => setTypeFilter(v as EventType | 'all')}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Lọc loại sự kiện" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            {EVENT_TYPE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Card key={i}><CardContent className="p-4 h-16" /></Card>)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>{search || typeFilter !== 'all' ? 'Không tìm thấy sự kiện phù hợp' : 'Chưa có sự kiện nào'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(ev => {
            const typeInfo = EVENT_TYPE_LABELS[ev.event_type];
            const TypeIcon = typeInfo.icon;
            const person = ev.person_id ? peopleMap.get(ev.person_id) : undefined;
            return (
              <Card key={ev.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${typeInfo.color}`}>
                      <TypeIcon className="h-3 w-3" />
                      {typeInfo.label}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{ev.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {ev.event_lunar && `${ev.event_lunar} ÂL`}
                        {ev.event_lunar && ev.event_date && ' · '}
                        {ev.event_date && new Date(ev.event_date).toLocaleDateString('vi-VN')}
                        {person && ` · ${person.display_name}`}
                        {ev.recurring && ' · Hàng năm'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => { setEditingItem(ev); setDialogOpen(true); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xóa sự kiện?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Xóa &quot;{ev.title}&quot;. Hành động này không thể hoàn tác.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(ev.id)}>Xóa</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
