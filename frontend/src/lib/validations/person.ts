/**
 * @project AncestorTree
 * @file src/lib/validations/person.ts
 * @description Zod validation schemas for person forms
 * @version 1.1.0
 * @updated 2026-02-28
 */

import { z } from 'zod';

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1600;

// Helper: optional numeric field (empty string → undefined)
const numericString = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
  z.number().optional()
);

const requiredNumericString = z.preprocess(
  (val) => Number(val),
  z.number()
);

// Lunar date format: DD/MM where day 1-30, month 1-12
const lunarDateSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      const match = val.match(/^(\d{1,2})\/(\d{1,2})$/);
      if (!match) return false;
      const day = parseInt(match[1]);
      const month = parseInt(match[2]);
      return day >= 1 && day <= 30 && month >= 1 && month <= 12;
    },
    { message: 'Ngày âm lịch không hợp lệ. VD: 15/7 (ngày/tháng)' }
  );

const yearSchema = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
  z
    .number()
    .min(MIN_YEAR, `Năm phải từ ${MIN_YEAR} trở lên`)
    .max(CURRENT_YEAR, `Năm không thể vượt quá ${CURRENT_YEAR}`)
    .optional()
);

export const personSchema = z
  .object({
    handle: z
      .string()
      .min(1, 'Handle là bắt buộc')
      .regex(/^[a-z0-9-]+$/, 'Handle chỉ chứa chữ thường, số và dấu gạch ngang'),
    display_name: z.string().min(1, 'Tên hiển thị là bắt buộc').max(100, 'Tên quá dài'),
    first_name: z.string().max(50).optional(),
    middle_name: z.string().max(50).optional(),
    surname: z.string().max(50).optional(),
    pen_name: z.string().max(100).optional(),
    taboo_name: z.string().max(100).optional(),
    gender: z.preprocess((val) => Number(val), z.union([z.literal(1), z.literal(2)])),
    generation: z.preprocess(
      (val) => Number(val),
      z.number().min(1, 'Đời phải từ 1 trở lên').max(20, 'Đời tối đa là 20')
    ),
    chi: numericString,

    // Birth
    birth_date: z.string().optional(),
    birth_year: yearSchema,
    birth_place: z.string().max(200).optional(),

    // Death
    death_date: z.string().optional(),
    death_year: yearSchema,
    death_place: z.string().max(200).optional(),
    death_lunar: lunarDateSchema,

    // Status
    is_living: z.boolean(),
    is_patrilineal: z.boolean(),

    // Contact
    phone: z.string().max(20).optional(),
    email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    zalo: z.string().max(20).optional(),
    facebook: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
    address: z.string().max(500).optional(),
    hometown: z.string().max(200).optional(),

    // Bio
    occupation: z.string().max(200).optional(),
    biography: z.string().max(5000).optional(),
    notes: z.string().max(2000).optional(),
    avatar_url: z.string().url('URL không hợp lệ').optional().or(z.literal('')),

    // Privacy
    privacy_level: requiredNumericString,
  })
  .superRefine((data, ctx) => {
    // death_year must be >= birth_year
    if (data.birth_year && data.death_year && data.death_year < data.birth_year) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Năm mất phải sau năm sinh',
        path: ['death_year'],
      });
    }
    // If is_living=false, death_lunar format already validated above
    // death_date must be after birth_date if both provided
    if (data.birth_date && data.death_date && data.death_date < data.birth_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ngày mất phải sau ngày sinh',
        path: ['death_date'],
      });
    }
  });

export type PersonFormData = z.infer<typeof personSchema>;

export const defaultPersonValues: PersonFormData = {
  handle: '',
  display_name: '',
  first_name: '',
  middle_name: '',
  surname: '',
  pen_name: '',
  taboo_name: '',
  gender: 1,
  generation: 1,
  chi: undefined,
  birth_date: '',
  birth_year: undefined,
  birth_place: '',
  death_date: '',
  death_year: undefined,
  death_place: '',
  death_lunar: '',
  is_living: true,
  is_patrilineal: true,
  phone: '',
  email: '',
  zalo: '',
  facebook: '',
  address: '',
  hometown: '',
  occupation: '',
  biography: '',
  notes: '',
  avatar_url: '',
  privacy_level: 1,
};
