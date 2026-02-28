/**
 * @project AncestorTree
 * @file src/components/layout/header-user.tsx
 * @description Compact user badge for the top header bar.
 *              Shows avatar + name, opens a dropdown with profile / security / sign-out shortcuts.
 * @version 1.0.0
 * @updated 2026-02-28
 */

'use client';

import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserCircle, ShieldCheck, LogOut } from 'lucide-react';

function getInitials(name?: string | null, email?: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(' ');
    return parts[parts.length - 1].charAt(0).toUpperCase();
  }
  return (email?.charAt(0) ?? '?').toUpperCase();
}

const roleLabels: Record<string, string> = {
  admin:  'Quản trị viên',
  editor: 'Biên tập viên',
  viewer: 'Người xem',
};

export function HeaderUser() {
  const { user, profile, signOut } = useAuth();
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Tài khoản"
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-emerald-600 text-white text-xs font-semibold">
              {getInitials(profile?.full_name, user.email)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:block text-sm font-medium max-w-[140px] truncate">
            {profile?.full_name || user.email}
          </span>
          <span className="hidden md:block text-xs text-muted-foreground">
            {roleLabels[profile?.role ?? 'viewer']}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
          {user.email}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings/profile">
            <UserCircle className="mr-2 h-4 w-4" />
            Hồ sơ cá nhân
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/security">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Bảo mật (MFA)
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut()}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
