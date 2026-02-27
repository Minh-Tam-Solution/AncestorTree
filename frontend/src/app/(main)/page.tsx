/**
 * @project AncestorTree
 * @file src/app/(main)/page.tsx
 * @description Homepage with hero, features, stats, and upcoming events
 * @version 1.0.0
 * @updated 2026-02-24
 */

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitBranchPlus, Calendar, Users, ArrowRight } from 'lucide-react';
import { StatsCard } from '@/components/home/stats-card';
import { FeaturedCharter } from '@/components/home/featured-charter';
import { CLAN_FULL_NAME } from '@/lib/clan-config';

const features = [
  {
    title: 'Cây Gia Phả',
    description: 'Khám phá cội nguồn và các thế hệ trong dòng tộc qua sơ đồ trực quan.',
    icon: GitBranchPlus,
    href: '/tree',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    title: 'Lịch Cúng Lễ',
    description: 'Theo dõi các ngày giỗ chạp, lễ tết và sự kiện quan trọng của dòng họ.',
    icon: Calendar,
    href: '/events',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  {
    title: 'Thành Viên',
    description: 'Danh sách thành viên và thông tin liên lạc để gắn kết tình thân.',
    icon: Users,
    href: '/people',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-800 to-emerald-950 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            {CLAN_FULL_NAME}
          </h1>
          <p className="text-lg md:text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            &ldquo;Gìn giữ tinh hoa - Tiếp bước cha ông&rdquo;
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link href="/tree">
                <GitBranchPlus className="mr-2 h-5 w-5" />
                Xem Gia Phả
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
              <Link href="/people">
                <Users className="mr-2 h-5 w-5" />
                Danh sách thành viên
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" asChild className="group-hover:translate-x-1 transition-transform">
                  <Link href={feature.href}>
                    Xem ngay
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats Section - Dynamic */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <StatsCard />
      </section>

      {/* Featured Charter */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <FeaturedCharter />
      </section>

      {/* Upcoming Events */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <Card>
          <CardHeader>
            <CardTitle>🕯️ Ngày giỗ sắp tới</CardTitle>
            <CardDescription>Các ngày giỗ trong 30 ngày tới</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>Chưa có dữ liệu ngày giỗ</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/people">Thêm thành viên để quản lý ngày giỗ</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
