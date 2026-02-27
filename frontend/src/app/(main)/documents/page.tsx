/**
 * @project AncestorTree
 * @file src/app/(main)/documents/page.tsx
 * @description Documents hub - GEDCOM export and book view
 * @version 2.0.0
 * @updated 2026-02-25
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTreeData } from '@/hooks/use-families';
import { generateGedcom, validateGedcom, downloadGedcom } from '@/lib/gedcom-export';
import { Download, BookOpen, Loader2, CheckCircle2, AlertTriangle, Archive } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentsPage() {
  const { data: treeData, isLoading: isTreeLoading } = useTreeData();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportGedcom = () => {
    if (!treeData) {
      toast.error('Chưa có dữ liệu gia phả để xuất');
      return;
    }

    setIsExporting(true);
    try {
      const content = generateGedcom(treeData);
      const validation = validateGedcom(content);

      if (!validation.valid) {
        toast.warning(`File GEDCOM có ${validation.errors.length} cảnh báo nhưng vẫn có thể sử dụng`);
      }

      downloadGedcom(content);
      toast.success('Xuất file GEDCOM thành công');
    } catch {
      toast.error('Lỗi khi xuất file GEDCOM');
    } finally {
      setIsExporting(false);
    }
  };

  const peopleCount = treeData?.people.filter(p => p.privacy_level !== 2).length || 0;
  const familyCount = treeData?.families.length || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Tài liệu</h1>
        <p className="text-muted-foreground">Lưu trữ, xuất dữ liệu và in ấn gia phả</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* GEDCOM Export */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <Download className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle>Xuất GEDCOM</CardTitle>
                <CardDescription>Xuất dữ liệu theo chuẩn quốc tế GEDCOM 5.5.1</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              File GEDCOM (.ged) là chuẩn trao đổi dữ liệu phả hệ quốc tế,
              tương thích với hầu hết phần mềm gia phả như FamilySearch, Gramps, MyHeritage.
            </p>

            {treeData && (
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {peopleCount} thành viên
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {familyCount} gia đình
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Thông tin cá nhân (privacy_level = 2) sẽ không được xuất</span>
            </div>

            <Button
              onClick={handleExportGedcom}
              disabled={isTreeLoading || isExporting || !treeData}
              className="w-full"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isTreeLoading ? 'Đang tải dữ liệu...' : 'Tải file GEDCOM'}
            </Button>
          </CardContent>
        </Card>

        {/* Book View */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle>Gia Phả Sách</CardTitle>
                <CardDescription>Xem và in gia phả dạng sách truyền thống</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Trình bày gia phả theo từng đời, từng chi với đầy đủ thông tin
              thành viên. Hỗ trợ in trực tiếp hoặc lưu PDF.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/documents/book">
                <BookOpen className="h-4 w-4 mr-2" />
                Xem Gia Phả Sách
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Document Library */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <Archive className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle>Kho tài liệu</CardTitle>
                <CardDescription>Lưu trữ ảnh lịch sử, giấy tờ, bản đồ, video</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Kho lưu giữ ký ức dòng họ: ảnh cũ, gia phả giấy đã số hóa, bản đồ làng,
              video lễ hội, bài viết lịch sử.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/documents/library">
                <Archive className="h-4 w-4 mr-2" />
                Xem Kho tài liệu
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
