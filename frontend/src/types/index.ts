// ═══════════════════════════════════════════════════════════════════════════
// Types for Gia Phả Điện Tử
// ═══════════════════════════════════════════════════════════════════════════

// ─── Person ───────────────────────────────────────────────────────────────────

export interface Person {
  id: string;
  handle: string;
  display_name: string;
  first_name?: string;
  middle_name?: string;
  surname?: string;
  pen_name?: string;    // Tên tự (courtesy name)
  taboo_name?: string;  // Tên húy (taboo name)
  gender: 1 | 2; // 1=Male, 2=Female
  generation: number;
  chi?: number;
  
  // Birth
  birth_date?: string;
  birth_year?: number;
  birth_place?: string;
  
  // Death
  death_date?: string;
  death_year?: number;
  death_place?: string;
  death_lunar?: string; // "15/7" format
  
  // Status
  is_living: boolean;
  is_patrilineal: boolean;
  
  // Contact
  phone?: string;
  email?: string;
  zalo?: string;
  facebook?: string;
  address?: string;
  hometown?: string;
  
  // Bio
  occupation?: string;
  biography?: string;
  notes?: string;
  avatar_url?: string;
  
  // Privacy: 0=public, 1=members only, 2=private
  privacy_level: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export type CreatePersonInput = Omit<Person, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePersonInput = Partial<CreatePersonInput>;

// ─── Family ───────────────────────────────────────────────────────────────────

export interface Family {
  id: string;
  handle: string;
  father_id?: string;
  mother_id?: string;
  marriage_date?: string;
  marriage_place?: string;
  divorce_date?: string;
  notes?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FamilyWithRelations extends Family {
  father?: Person;
  mother?: Person;
  children: Person[];
}

// ─── Child (Junction) ─────────────────────────────────────────────────────────

export interface Child {
  id: string;
  family_id: string;
  person_id: string;
  sort_order: number;
  created_at: string;
}

// ─── Profile (User) ───────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  /** FK → people.id: which person in the tree this user IS */
  linked_person?: string;
  /** FK → people.id: subtree root this user can edit (null = global editor) */
  edit_root_person_id?: string;
  avatar_url?: string;
  is_suspended?: boolean;
  suspension_reason?: string;
  created_at: string;
  updated_at: string;
}

// ─── Contribution ─────────────────────────────────────────────────────────────

export type ContributionStatus = 'pending' | 'approved' | 'rejected';
export type ChangeType = 'create' | 'update' | 'delete';

export interface Contribution {
  id: string;
  author_id: string;
  target_person: string;
  change_type: ChangeType;
  changes: Record<string, unknown>;
  reason?: string;
  status: ContributionStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
}

// ─── Event (Memorial) ─────────────────────────────────────────────────────────

export type EventType = 'gio' | 'hop_ho' | 'le_tet' | 'other';

export interface Event {
  id: string;
  title: string;
  description?: string;
  event_date?: string;
  event_lunar?: string;
  event_type: EventType;
  person_id?: string;
  location?: string;
  recurring: boolean;
  created_at: string;
}

// ─── Tree Layout ──────────────────────────────────────────────────────────────

export interface TreeNode {
  person: Person;
  x: number;
  y: number;
  generation: number;
}

export interface TreeConnection {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  type: 'parent-child' | 'couple';
}

export interface TreeLayout {
  nodes: TreeNode[];
  connections: TreeConnection[];
  width: number;
  height: number;
  generations: number;
}

// ─── Lunar Calendar ───────────────────────────────────────────────────────────

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  leap: boolean;
}

// ─── Media ────────────────────────────────────────────────────────────────────

export type MediaType = 'photo' | 'document' | 'video';

export interface Media {
  id: string;
  person_id: string;
  type: MediaType;
  url: string;
  caption?: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export type CreateMediaInput = Omit<Media, 'id' | 'created_at'>;

// ─── Achievement (Vinh danh) ──────────────────────────────────────────────────

export type AchievementCategory = 'hoc_tap' | 'su_nghiep' | 'cong_hien' | 'other';

export interface Achievement {
  id: string;
  person_id: string;
  title: string;
  category: AchievementCategory;
  description?: string;
  year?: number;
  awarded_by?: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export type CreateAchievementInput = Omit<Achievement, 'id' | 'created_at' | 'updated_at'>;
export type UpdateAchievementInput = Partial<CreateAchievementInput>;

// ─── Fund Transaction (Quỹ khuyến học) ───────────────────────────────────────

export type FundTransactionType = 'income' | 'expense';
export type FundCategory = 'dong_gop' | 'hoc_bong' | 'khen_thuong' | 'other';

export interface FundTransaction {
  id: string;
  type: FundTransactionType;
  category: FundCategory;
  amount: number;
  donor_name?: string;
  donor_person_id?: string;
  recipient_id?: string;
  description?: string;
  transaction_date: string;
  academic_year?: string;
  created_by?: string;
  created_at: string;
}

export type CreateFundTransactionInput = Omit<FundTransaction, 'id' | 'created_at'>;

export interface FundBalance {
  income: number;
  expense: number;
  balance: number;
}

// ─── Scholarship (Học bổng & Khen thưởng) ────────────────────────────────────

export type ScholarshipType = 'hoc_bong' | 'khen_thuong';
export type ScholarshipStatus = 'pending' | 'approved' | 'paid';

export interface Scholarship {
  id: string;
  person_id: string;
  type: ScholarshipType;
  amount: number;
  reason?: string;
  academic_year: string;
  school?: string;
  grade_level?: string;
  status: ScholarshipStatus;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

export type CreateScholarshipInput = Omit<Scholarship, 'id' | 'approved_by' | 'approved_at' | 'created_at'>;

// ─── Clan Article (Hương ước) ─────────────────────────────────────────────────

export type ClanArticleCategory = 'gia_huan' | 'quy_uoc' | 'loi_dan';

export interface ClanArticle {
  id: string;
  title: string;
  content: string;
  category: ClanArticleCategory;
  sort_order: number;
  is_featured: boolean;
  author_id?: string;
  created_at: string;
  updated_at: string;
}

export type CreateClanArticleInput = Omit<ClanArticle, 'id' | 'created_at' | 'updated_at'>;
export type UpdateClanArticleInput = Partial<CreateClanArticleInput>;

// ─── Clan Document (Kho tài liệu) ───────────────────────────────────────────

export type DocumentCategory = 'anh_lich_su' | 'giay_to' | 'ban_do' | 'video' | 'bai_viet' | 'khac';

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  anh_lich_su: 'Ảnh lịch sử',
  giay_to: 'Giấy tờ',
  ban_do: 'Bản đồ',
  video: 'Video',
  bai_viet: 'Bài viết',
  khac: 'Khác',
};

export interface ClanDocument {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  category: DocumentCategory;
  tags?: string;
  person_id?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export type CreateClanDocumentInput = Omit<ClanDocument, 'id' | 'created_at' | 'updated_at'>;
export type UpdateClanDocumentInput = Partial<CreateClanDocumentInput>;

// ─── Cầu đương (Ceremony Rotation) ───────────────────────────────────────────

export interface CauDuongPool {
  id: string;
  name: string;
  ancestor_id: string;
  min_generation: number;
  max_age_lunar: number;   // Tuổi âm tối đa (mặc định 70)
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CauDuongCeremonyType = 'tet' | 'ram_thang_gieng' | 'gio_to' | 'ram_thang_bay';
export type CauDuongStatus = 'scheduled' | 'completed' | 'delegated' | 'rescheduled' | 'cancelled';

export const CAU_DUONG_CEREMONY_LABELS: Record<CauDuongCeremonyType, string> = {
  tet: 'Tết Nguyên Đán (1/1 AL)',
  ram_thang_gieng: 'Rằm tháng Giêng (15/1 AL)',
  gio_to: 'Giỗ tổ Can Thăng (15/3 AL)',
  ram_thang_bay: 'Rằm tháng Bảy (15/7 AL)',
};

export const CAU_DUONG_CEREMONY_ORDER: CauDuongCeremonyType[] = [
  'tet', 'ram_thang_gieng', 'gio_to', 'ram_thang_bay',
];

export interface CauDuongAssignment {
  id: string;
  pool_id: string;
  year: number;
  ceremony_type: CauDuongCeremonyType;
  host_person_id?: string;          // Người được phân công
  actual_host_person_id?: string;   // Người thực sự thực hiện (nếu ủy quyền)
  status: CauDuongStatus;
  scheduled_date?: string;          // Ngày dự kiến (dương lịch)
  actual_date?: string;             // Ngày thực hiện (nếu đổi)
  reason?: string;                  // Lý do ủy quyền / đổi ngày
  notes?: string;
  rotation_index?: number;          // Vị trí trong danh sách DFS khi phân công
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Thành viên đủ điều kiện làm Cầu đương (kết quả DFS)
export interface CauDuongEligibleMember {
  person: Person;
  dfsIndex: number;    // Thứ tự trong danh sách DFS (0-based)
  ageLunar: number;    // Tuổi âm hiện tại
  isMarried: boolean;  // Đã lập gia đình (là cha trong bảng families)
}

// ─── Person Relations ─────────────────────────────────────────────────────────

export interface PersonRelations {
  parentFamily: {
    family: Family;
    father: Person | null;
    mother: Person | null;
    siblings: Person[];
  } | null;
  ownFamilies: Array<{
    family: Family;
    spouse: Person | null;
    children: Person[];
  }>;
}

// ─── Clan Settings ────────────────────────────────────────────────────────────

export interface ClanSettings {
  id: string;
  clan_name: string;
  clan_full_name: string;
  clan_founding_year?: number;
  clan_origin?: string;
  clan_patriarch?: string;
  clan_description?: string;
  contact_email?: string;
  contact_phone?: string;
  updated_at: string;
  updated_by?: string;
}

export type UpdateClanSettingsInput = Partial<Omit<ClanSettings, 'id' | 'updated_at' | 'updated_by'>>;

// ─── Zodiac ───────────────────────────────────────────────────────────────────

export const CAN = ['Canh', 'Tân', 'Nhâm', 'Quý', 'Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ'] as const;
export const CHI = ['Thân', 'Dậu', 'Tuất', 'Hợi', 'Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi'] as const;

export function getZodiacYear(year: number): string {
  return `${CAN[year % 10]} ${CHI[year % 12]}`;
}
