/**
 * @project AncestorTree
 * @file src/app/(main)/help/page.tsx
 * @description In-app help guide — detailed usage instructions for authenticated users
 * @version 1.0.0
 * @updated 2026-02-27
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const isDesktop = process.env.NEXT_PUBLIC_DESKTOP_MODE === 'true';

// -- Section A: Navigation overview --

const navItems = [
  { name: 'Trang chủ', desc: 'Tổng quan thống kê: tổng thành viên, số đời, số gia đình, sự kiện sắp tới, hương ước nổi bật.' },
  { name: 'Cây phả hệ', desc: 'Sơ đồ cây gia phả tương tác: zoom, kéo, lọc theo gốc. Hỗ trợ 10+ đời, SVG rendering.' },
  { name: 'Thành viên', desc: 'Danh sách và quản lý thành viên: thêm, sửa, xóa, tìm kiếm. Ghi đầy đủ thông tin cá nhân.' },
  { name: 'Danh bạ', desc: 'Thư mục liên lạc: số điện thoại, email, Zalo. Chỉ hiển thị cho thành viên đã đăng nhập.' },
  { name: 'Lịch cúng lễ', desc: 'Ngày giỗ, lễ tết theo lịch âm. Tự động tính từ ngày mất âm lịch, lặp lại hàng năm.' },
  { name: 'Đề xuất', desc: 'Gửi đề xuất chỉnh sửa thông tin: thêm/sửa thành viên, sự kiện. Admin duyệt trước khi áp dụng.' },
  { name: 'Vinh danh', desc: 'Bảng vinh danh thành tích: Học tập, Sự nghiệp, Cống hiến, Khác. Ghi nhận con cháu xuất sắc.' },
  { name: 'Quỹ khuyến học', desc: 'Thu chi quỹ khuyến học minh bạch, cấp học bổng cho con cháu ưu tú. Admin quản lý.' },
  { name: 'Hương ước', desc: 'Gia huấn, quy ước, lời dặn dò của dòng họ. Lưu trữ dạng bài viết có phiên bản.' },
  { name: 'Cầu đương', desc: 'Phân công trách nhiệm cúng lễ xoay vòng giữa các gia đình. Thuật toán DFS tự động, công bằng.' },
  { name: 'Tài liệu', desc: 'Xuất gia phả dạng sách truyền thống. Sắp xếp theo đời, từ thủy tổ đến con cháu.' },
];

// -- Section B: Workflows --

const workflows = [
  {
    title: 'Thêm thành viên',
    steps: [
      'Vào Thành viên → nhấn "Thêm thành viên" (góc trên phải)',
      'Bắt buộc: Họ và tên, Giới tính',
      'Nên điền: Đời (1 = thủy tổ), Năm sinh, Ngày mất âm lịch (để tính ngày giỗ)',
      'Chọn Cha / Mẹ từ danh sách — tự động tạo quan hệ và hiển thị trên cây',
      'Tùy chọn: Tiểu sử, Nghề nghiệp, Liên lạc (SĐT, Email, Zalo)',
    ],
    tip: 'Mẹo: Nhập từ đời cao nhất (thủy tổ) trở xuống để cây gia phả hiển thị đúng.',
  },
  {
    title: 'Xem cây gia phả',
    steps: [
      'Vào Cây phả hệ từ thanh điều hướng',
      'Thu phóng: cuộn chuột hoặc pinch trên touchpad',
      'Di chuyển: click và kéo trên vùng trống',
      'Xem chi tiết: click vào thành viên → hiện popup thông tin',
      'Lọc nhánh: click thành viên → chọn "Xem cây từ đây" → chỉ hiện nhánh đó',
    ],
    tip: 'Mẹo: Khi gia phả lớn (>50 người), dùng "Xem cây từ đây" để tập trung vào một nhánh.',
  },
  {
    title: 'Quản lý sự kiện & ngày giỗ',
    steps: [
      'Ngày giỗ tự động tính từ ngày mất âm lịch (nhập ở trang thành viên)',
      'Thêm sự kiện thủ công: nhấn "Thêm sự kiện"',
      'Loại sự kiện: Giỗ (ngày giỗ), Lễ/Tết (Tết Nguyên Đán, Rằm…), Khác (họp họ…)',
      'Nhập ngày âm lịch (ví dụ: 12/3) + chọn người liên quan',
      'Bật "Lặp lại hàng năm" cho ngày giỗ và lễ tết',
    ],
    tip: 'Lưu ý: Ngày âm lịch được tự động chuyển sang dương lịch để hiển thị sự kiện sắp tới.',
  },
];

const desktopBackupWorkflow = {
  title: 'Sao lưu dữ liệu (Desktop)',
  steps: [
    'Dữ liệu lưu tại ~/AncestorTree/ (data/ancestortree.db + media/people/)',
    'Sao lưu: đóng app → copy thư mục ~/AncestorTree/ ra USB hoặc Google Drive',
    'Khôi phục: đóng app → copy thư mục từ backup về ~/AncestorTree/ → mở app',
    'Chuyển máy: sao lưu từ máy cũ → cài app trên máy mới → copy thư mục vào',
    'Nên sao lưu ít nhất 1 lần/tháng',
  ],
  tip: 'Lưu ý: Sao lưu cả thư mục data/ (database) và media/ (ảnh thành viên).',
};

// -- Section C: Roles --

const roles = [
  { role: 'Admin', permissions: 'Toàn quyền: CRUD tất cả dữ liệu, quản lý người dùng, phân quyền, cài đặt hệ thống' },
  { role: 'Editor', permissions: 'Thêm / sửa / xóa thành viên, sự kiện, thành tích, quỹ, hương ước, cầu đương' },
  { role: 'Viewer', permissions: 'Xem tất cả thông tin (bao gồm liên lạc), không chỉnh sửa được' },
  { role: 'Guest', permissions: 'Xem thông tin công khai, không thấy số điện thoại/email/Zalo' },
];

// -- Section D: Tips --

const tips = [
  'Bắt đầu từ thủy tổ — nhập thông tin từ đời cao nhất trở xuống để cây gia phả chính xác',
  'Chọn Cha/Mẹ ngay khi tạo thành viên — cây phả hệ và quan hệ gia đình tự động cập nhật',
  'Ghi ngày mất âm lịch — đây là trường quan trọng nhất để tính ngày giỗ chính xác hàng năm',
  'Sao lưu thường xuyên — dữ liệu gia phả là tài sản vô giá, sao lưu ít nhất 1 lần/tháng',
  'Dùng tìm kiếm khi gia phả lớn (>50 người) — nhanh hơn cuộn trang rất nhiều',
  'Thêm quan hệ từ trang chi tiết — mở thành viên → phần Quan hệ → Thêm con hoặc Thêm vợ/chồng',
];

// -- Section E: FAQ --

const faqItems = [
  {
    q: 'Dữ liệu có mất khi cập nhật ứng dụng không?',
    a: 'Không. Dữ liệu được lưu riêng (Desktop: ~/AncestorTree/, Web: Supabase cloud), không bị ảnh hưởng khi cập nhật.',
  },
  {
    q: 'Có thể chuyển dữ liệu từ Desktop sang Web không?',
    a: 'Có. Sử dụng tính năng Export/Import (sẽ có trong phiên bản tương lai v2.5.0).',
  },
  {
    q: 'Ứng dụng hỗ trợ bao nhiêu thành viên?',
    a: 'Không giới hạn cứng. Đã test tốt với 500+ thành viên, 10+ đời. Cây gia phả và tìm kiếm vẫn mượt.',
  },
  {
    q: 'Cách thêm quan hệ gia đình (vợ/chồng, con cái)?',
    a: 'Mở trang chi tiết thành viên → phần Quan hệ gia đình → nhấn "Thêm quan hệ" → chọn "Thêm con" hoặc "Thêm vợ/chồng". Quan hệ tự động cập nhật ở cả hai phía.',
  },
  {
    q: 'Cầu đương hoạt động như thế nào?',
    a: 'Cầu đương là phong tục phân công lo việc cúng giỗ giữa các gia đình. Ứng dụng dùng thuật toán DFS (duyệt cây theo chiều sâu) để xoay vòng tự động, đảm bảo công bằng. Admin tạo đợt mới → hệ thống phân công → có thể điều chỉnh thủ công.',
  },
];

// -- Page component --

export default function HelpPage() {
  const allWorkflows = isDesktop
    ? [...workflows, desktopBackupWorkflow]
    : workflows;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-16">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hướng dẫn sử dụng</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Hướng dẫn chi tiết các tính năng của ứng dụng Gia Phả Điện Tử.
        </p>
      </div>

      {/* Section A — Thanh điều hướng */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Thanh điều hướng</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {navItems.map((item) => (
            <div key={item.name} className="bg-gray-50 rounded-lg px-4 py-3 border">
              <p className="font-medium text-sm text-gray-900">{item.name}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section B — Hướng dẫn từng bước */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Hướng dẫn từng bước</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allWorkflows.map((workflow) => (
            <Card key={workflow.title}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{workflow.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="space-y-2">
                  {workflow.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-600">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-medium">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <p className="text-xs text-emerald-700 bg-emerald-50 rounded-md px-3 py-2">
                  {workflow.tip}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Section C — Phân quyền */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Phân quyền người dùng</h2>
        <div className="max-w-3xl mx-auto">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm border">
              <thead>
                <tr className="bg-emerald-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Vai trò</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Quyền hạn</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {roles.map((r) => (
                  <tr key={r.role}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      <Badge variant="outline">{r.role}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{r.permissions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {isDesktop && (
            <p className="text-sm text-gray-500 mt-3 text-center">
              Bản Desktop: bạn tự động là Admin — toàn quyền quản lý dữ liệu trên máy.
            </p>
          )}
        </div>
      </section>

      {/* Section D — Mẹo sử dụng */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Mẹo sử dụng</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-4xl mx-auto">
          {tips.map((tip, i) => (
            <div key={i} className="flex gap-3 bg-gray-50 rounded-lg px-4 py-3 border">
              <span className="flex-shrink-0 text-emerald-600 font-semibold text-sm">#{i + 1}</span>
              <p className="text-sm text-gray-600">{tip}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section E — Câu hỏi thường gặp */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Câu hỏi thường gặp</h2>

        {/* Desktop vs Web comparison — only in desktop mode */}
        {isDesktop && (
          <div className="max-w-3xl mx-auto mb-8">
            <h3 className="text-base font-semibold text-gray-900 mb-3 text-center">Desktop vs Web</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm border">
                <thead>
                  <tr className="bg-emerald-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900" />
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Desktop</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Web</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    { label: 'Dữ liệu', desktop: 'Lưu trên máy (SQLite)', web: 'Cloud (Supabase)' },
                    { label: 'Internet', desktop: 'Không cần', web: 'Cần kết nối' },
                    { label: 'Người dùng', desktop: '1 người (admin)', web: 'Nhiều người, phân quyền' },
                    { label: 'Cài đặt', desktop: 'Tải file, click cài', web: 'Cần Node.js, Docker' },
                    { label: 'Chức năng', desktop: 'Giống nhau 100%', web: 'Giống nhau 100%' },
                  ].map((row) => (
                    <tr key={row.label}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.label}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.desktop}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.web}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FAQ items */}
        <div className="max-w-3xl mx-auto space-y-4">
          {faqItems.map((item) => (
            <Card key={item.q}>
              <CardContent className="pt-6">
                <h4 className="font-semibold text-gray-900 mb-2">{item.q}</h4>
                <p className="text-sm text-gray-600">{item.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
