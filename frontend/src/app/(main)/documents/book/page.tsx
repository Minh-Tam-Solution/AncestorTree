/**
 * @project AncestorTree
 * @file src/app/(main)/documents/book/page.tsx
 * @description Printable family chronicle book view
 * @version 1.0.0
 * @updated 2026-02-25
 */

'use client';

import Link from 'next/link';
import { useTreeData } from '@/hooks/use-families';
import { generateBookData } from '@/lib/book-generator';
import type { BookChapter, BookPerson } from '@/lib/book-generator';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Printer, User, Users, Heart } from 'lucide-react';
import { CLAN_FULL_NAME } from '@/lib/clan-config';

function PersonEntry({ entry }: { entry: BookPerson }) {
  const { person, father, mother, spouses, children, zodiacYear } = entry;

  return (
    <div className="book-person py-4">
      <div className="flex items-start gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
          person.gender === 1 ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
        }`}>
          {person.gender === 1 ? '♂' : '♀'}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-base">
            {person.display_name}
            {!person.is_living && ' †'}
          </h4>

          <div className="text-sm text-muted-foreground space-y-0.5 mt-1">
            {/* Birth/Death */}
            {(person.birth_year || person.death_year) && (
              <p>
                {person.birth_year && `Sinh: ${person.birth_year}`}
                {zodiacYear && ` (${zodiacYear})`}
                {person.death_year && ` — Mất: ${person.death_year}`}
                {person.death_lunar && ` (Âm lịch: ${person.death_lunar})`}
              </p>
            )}

            {/* Places */}
            {person.birth_place && <p>Nơi sinh: {person.birth_place}</p>}
            {person.hometown && <p>Quê quán: {person.hometown}</p>}

            {/* Occupation */}
            {person.occupation && <p>Nghề nghiệp: {person.occupation}</p>}

            {/* Parents */}
            {(father || mother) && (
              <p className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Cha mẹ: {father?.display_name || '?'} & {mother?.display_name || '?'}
              </p>
            )}

            {/* Spouse(s) */}
            {spouses.length > 0 && (
              <p className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {person.gender === 1 ? 'Vợ' : 'Chồng'}: {spouses.map(s => s.display_name).join(', ')}
              </p>
            )}

            {/* Children */}
            {children.length > 0 && (
              <p className="flex items-start gap-1">
                <User className="h-3 w-3 mt-0.5" />
                <span>
                  Con ({children.length}): {children.map(c => c.display_name).join(', ')}
                </span>
              </p>
            )}

            {/* Biography excerpt */}
            {person.biography && (
              <p className="mt-1 italic line-clamp-3">{person.biography}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChapterSection({ chapter }: { chapter: BookChapter }) {
  const totalPeople = chapter.branches.reduce((sum, b) => sum + b.people.length, 0);

  return (
    <section className="book-chapter">
      <div className="bg-emerald-50 rounded-lg p-4 mb-4">
        <h2 className="text-xl font-bold text-emerald-900">{chapter.title}</h2>
        <p className="text-sm text-emerald-700">{totalPeople} thành viên</p>
      </div>

      {chapter.branches.map((branch, bIdx) => (
        <div key={bIdx} className="mb-6">
          {branch.chi !== null && chapter.branches.length > 1 && (
            <h3 className="text-base font-semibold text-muted-foreground mb-2 pl-2 border-l-2 border-emerald-300">
              Chi {branch.chi}
            </h3>
          )}
          <div className="divide-y">
            {branch.people.map((entry) => (
              <PersonEntry key={entry.person.id} entry={entry} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export default function BookPage() {
  const { data: treeData, isLoading, error } = useTreeData();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !treeData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">
              {error ? `Lỗi: ${error.message}` : 'Không có dữ liệu'}
            </p>
            <Button asChild variant="outline">
              <Link href="/documents">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const chapters = generateBookData(treeData);
  const totalPeople = chapters.reduce(
    (sum, ch) => sum + ch.branches.reduce((s, b) => s + b.people.length, 0),
    0
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Controls (hidden in print) */}
      <div className="flex items-center justify-between mb-6 no-print">
        <Button asChild variant="ghost" size="sm">
          <Link href="/documents">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tài liệu
          </Link>
        </Button>
        <Button onClick={() => window.print()} size="sm">
          <Printer className="h-4 w-4 mr-2" />
          In / Lưu PDF
        </Button>
      </div>

      {/* Book Content */}
      <div className="book-content space-y-8">
        {/* Cover */}
        <div className="book-cover text-center py-12 border-b-2 border-emerald-600">
          <h1 className="text-3xl md:text-4xl font-bold text-emerald-900 mb-2">
            Gia Phả
          </h1>
          <h2 className="text-xl md:text-2xl font-semibold text-emerald-700 mb-4">
            {CLAN_FULL_NAME}
          </h2>
          <p className="text-muted-foreground italic mb-6">
            &ldquo;Gìn giữ tinh hoa - Tiếp bước cha ông&rdquo;
          </p>
          <Separator className="max-w-xs mx-auto" />
          <div className="mt-6 text-sm text-muted-foreground space-y-1">
            <p>{totalPeople} thành viên · {chapters.length} đời</p>
            <p>Xuất bản: {new Date().toLocaleDateString('vi-VN')}</p>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="book-toc">
          <h2 className="text-lg font-bold mb-3">Mục lục</h2>
          <div className="space-y-1">
            {chapters.map((ch) => {
              const count = ch.branches.reduce((s, b) => s + b.people.length, 0);
              return (
                <div key={ch.generation} className="flex justify-between text-sm border-b border-dotted pb-1">
                  <span>{ch.title}</span>
                  <span className="text-muted-foreground">{count} người</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chapters */}
        {chapters.map((chapter) => (
          <ChapterSection key={chapter.generation} chapter={chapter} />
        ))}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground border-t pt-6">
          <p>Gia Phả Điện Tử - {CLAN_FULL_NAME}</p>
          <p>Được tạo bởi AncestorTree · {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}
