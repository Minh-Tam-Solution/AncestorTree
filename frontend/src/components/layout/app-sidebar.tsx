/**
 * @project AncestorTree
 * @file src/components/layout/app-sidebar.tsx
 * @description Main navigation sidebar component
 * @version 2.0.0
 * @updated 2026-02-25
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home,
  GitBranchPlus,
  Users,
  BookUser,
  Calendar,
  FileText,
  Settings,
  UserCog,
  ClipboardList,
  LogOut,
  LogIn,
  UserPlus,
  ChevronUp,
  Trophy,
  BookOpen,
  ScrollText,
  RotateCcw,
  FileArchive,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

const mainNavItems = [
  { title: 'Trang chủ', url: '/', icon: Home },
  { title: 'Cây gia phả', url: '/tree', icon: GitBranchPlus },
  { title: 'Thành viên', url: '/people', icon: Users },
  { title: 'Danh bạ', url: '/directory', icon: BookUser },
  { title: 'Lịch cúng lễ', url: '/events', icon: Calendar },
  { title: 'Đề xuất', url: '/contributions', icon: ClipboardList },
  { title: 'Vinh danh', url: '/achievements', icon: Trophy },
  { title: 'Quỹ khuyến học', url: '/fund', icon: BookOpen },
  { title: 'Hương ước', url: '/charter', icon: ScrollText },
  { title: 'Cầu đương', url: '/cau-duong', icon: RotateCcw },
  { title: 'Tài liệu', url: '/documents', icon: FileText },
  { title: 'Hướng dẫn', url: '/help', icon: HelpCircle },
];

const adminNavItems = [
  { title: 'Bảng điều khiển', url: '/admin', icon: Settings },
  { title: 'Người dùng', url: '/admin/users', icon: UserCog },
  { title: 'Đề xuất chỉnh sửa', url: '/admin/contributions', icon: ClipboardList },
  { title: 'QL Vinh danh', url: '/admin/achievements', icon: Trophy },
  { title: 'QL Quỹ & Học bổng', url: '/admin/fund', icon: BookOpen },
  { title: 'QL Hương ước', url: '/admin/charter', icon: ScrollText },
  { title: 'QL Cầu đương', url: '/admin/cau-duong', icon: RotateCcw },
  { title: 'QL Tài liệu', url: '/admin/documents', icon: FileText },
  ...(process.env.NEXT_PUBLIC_DESKTOP_MODE === 'true'
    ? [{ title: 'Xuất / Nhập dữ liệu', url: '/admin/import-export', icon: FileArchive }]
    : []),
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, profile, isAdmin, isEditor, signOut } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            Đ
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Họ Đặng</span>
            <span className="text-xs text-muted-foreground">làng Kỷ Các</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu chính</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={item.url === '/' ? pathname === '/' : pathname.startsWith(item.url)}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(isAdmin || isEditor) && (
          <SidebarGroup>
            <SidebarGroupLabel>Quản trị</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={item.url === '/admin' ? pathname === '/admin' : pathname.startsWith(item.url)}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          {user ? (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="w-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-sm">
                      <span className="font-medium">{profile?.full_name || user?.email}</span>
                      <span className="text-xs text-muted-foreground capitalize">{profile?.role || 'viewer'}</span>
                    </div>
                    <ChevronUp className="ml-auto h-4 w-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ) : (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/login'}>
                  <Link href="/login">
                    <LogIn className="h-4 w-4" />
                    <span>Đăng nhập</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/register'}>
                  <Link href="/register">
                    <UserPlus className="h-4 w-4" />
                    <span>Đăng ký</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
