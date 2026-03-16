/**
 * @project AncestorTree
 * @file src/lib/format-utils.ts
 * @description Shared formatting utilities — relative time, initials
 * @version 1.0.0
 * @updated 2026-03-09
 */

import { removeVietnameseTones } from './helper';

export function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} tháng trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

export function getInitials(name: string): string {
  let normalizedName = removeVietnameseTones(name);

  const parts = normalizedName.trim().split(' ');
  return parts.length > 1
    ? (parts[parts.length - 1][0] ?? '?').toUpperCase()
    : (parts[0][0] ?? '?').toUpperCase();
}
