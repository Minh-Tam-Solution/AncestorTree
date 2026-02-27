/**
 * @project AncestorTree
 * @file src/app/layout.tsx
 * @description Root layout with providers (Auth, Tooltip, Toaster)
 * @version 2.0.0
 * @updated 2026-02-25
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { CLAN_NAME, CLAN_FULL_NAME } from "@/lib/clan-config";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: `Gia Phả Điện Tử - ${CLAN_FULL_NAME}`,
    template: `%s | Gia Phả ${CLAN_NAME}`,
  },
  description: `Phần mềm quản lý gia phả điện tử cho ${CLAN_FULL_NAME}. Lưu trữ thông tin dòng họ, cây gia phả, lịch giỗ chạp.`,
  keywords: ['gia phả', 'gia phả điện tử', CLAN_NAME, 'dòng họ', 'cây gia phả', 'phả hệ'],
  authors: [{ name: CLAN_FULL_NAME }],
  openGraph: {
    title: `Gia Phả Điện Tử - ${CLAN_FULL_NAME}`,
    description: 'Gìn giữ tinh hoa - Tiếp bước cha ông',
    type: 'website',
    locale: 'vi_VN',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <QueryProvider>
          <AuthProvider>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
