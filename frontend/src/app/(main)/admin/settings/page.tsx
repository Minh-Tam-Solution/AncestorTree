/**
 * @project AncestorTree
 * @file src/app/(main)/admin/settings/page.tsx
 * @description Admin settings page — clan configuration overview
 * @version 1.0.0
 * @updated 2026-02-27
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Globe, Database, Info } from 'lucide-react';
import { CLAN_NAME, CLAN_FULL_NAME, CLAN_INITIAL } from '@/lib/clan-config';

const isDesktop = process.env.NEXT_PUBLIC_DESKTOP_MODE === 'true';

const configItems = [
  {
    label: 'Tên dòng họ (ngắn)',
    value: CLAN_NAME,
    env: 'NEXT_PUBLIC_CLAN_NAME',
    description: 'Hiển thị trên sidebar, tiêu đề trang',
  },
  {
    label: 'Tên dòng họ (đầy đủ)',
    value: CLAN_FULL_NAME,
    env: 'NEXT_PUBLIC_CLAN_FULL_NAME',
    description: 'Hiển thị trên trang chủ, trang đăng nhập, gia phả sách',
  },
  {
    label: 'Ký tự đại diện',
    value: CLAN_INITIAL,
    env: '(Tự động từ tên dòng họ)',
    description: 'Chữ cái đầu hiển thị trên logo sidebar và trang đăng nhập',
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Cài đặt
        </h1>
        <p className="text-muted-foreground">
          Cấu hình hệ thống gia phả điện tử
        </p>
      </div>

      {/* Clan Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Thông tin dòng họ
          </CardTitle>
          <CardDescription>
            Tùy chỉnh tên dòng họ hiển thị trên toàn bộ ứng dụng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {configItems.map((item) => (
              <div key={item.label} className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b last:border-b-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-sm">
                    {item.value}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* How to change */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            Cách thay đổi tên dòng họ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDesktop ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Bản Desktop hiện tại sử dụng tên mặc định. Để thay đổi, cần build lại ứng dụng với biến môi trường tùy chỉnh.
              </p>
              <div className="bg-muted rounded-lg p-4 font-mono text-sm space-y-1">
                <p className="text-muted-foreground"># Khi build Desktop app:</p>
                <p>NEXT_PUBLIC_CLAN_NAME=&quot;Họ Nguyễn&quot;</p>
                <p>NEXT_PUBLIC_CLAN_FULL_NAME=&quot;Họ Nguyễn làng ABC, Quảng Nam&quot;</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Chỉnh sửa file <code className="bg-muted px-1.5 py-0.5 rounded text-xs">.env.local</code> trong thư mục <code className="bg-muted px-1.5 py-0.5 rounded text-xs">frontend/</code>, sau đó khởi động lại ứng dụng.
              </p>
              <div className="bg-muted rounded-lg p-4 font-mono text-sm space-y-1">
                <p className="text-muted-foreground"># frontend/.env.local</p>
                <p>NEXT_PUBLIC_CLAN_NAME=&quot;Họ Nguyễn&quot;</p>
                <p>NEXT_PUBLIC_CLAN_FULL_NAME=&quot;Họ Nguyễn làng ABC, Quảng Nam&quot;</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Sau khi thay đổi, chạy lại <code className="bg-muted px-1.5 py-0.5 rounded text-xs">pnpm dev</code> hoặc <code className="bg-muted px-1.5 py-0.5 rounded text-xs">pnpm build</code> để áp dụng.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            Thông tin hệ thống
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Phiên bản</span>
              <Badge variant="outline">v2.2.0</Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Chế độ</span>
              <Badge variant={isDesktop ? 'default' : 'secondary'}>
                {isDesktop ? 'Desktop (Offline)' : 'Web (Online)'}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Cơ sở dữ liệu</span>
              <Badge variant="outline">
                {isDesktop ? 'SQLite (local)' : 'PostgreSQL (Supabase)'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
