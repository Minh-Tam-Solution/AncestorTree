-- ============================================================
-- Migration: Advanced People Search Function
-- Description: Enables the 'unaccent' extension and creates 
-- the 'search_people_advanced' RPC. This supports Vietnamese 
-- accent-insensitive searching (including 'đ' character handling).
-- ============================================================

-- 1. Kích hoạt extension hỗ trợ bỏ dấu của PostgreSQL
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Tạo function tìm kiếm nâng cao (RPC)
CREATE OR REPLACE FUNCTION search_people_advanced(search_term text, ignore_acc boolean)
RETURNS SETOF people AS $$
BEGIN
  IF ignore_acc THEN
    -- TRƯỜNG HỢP: Bỏ qua dấu (ignore_acc = true)
    -- Xử lý chữ 'đ' (vì unaccent không tự hiểu) và bỏ dấu cho cả 2 vế (cột DB và từ khóa)
    RETURN QUERY
    SELECT * FROM people
    WHERE unaccent(replace(lower(display_name), 'đ', 'd')) 
    ILIKE '%' || unaccent(replace(lower(search_term), 'đ', 'd')) || '%'
    ORDER BY display_name ASC
    LIMIT 20;
  ELSE
    -- TRƯỜNG HỢP: Giữ nguyên dấu (ignore_acc = false)
    -- Chỉ tìm kiếm không phân biệt hoa/thường (ILIKE)
    RETURN QUERY
    SELECT * FROM people
    WHERE display_name ILIKE '%' || search_term || '%'
    ORDER BY display_name ASC
    LIMIT 20;
  END IF;
END;
$$ LANGUAGE plpgsql;