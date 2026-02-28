# Vietnamese Grammar Fix — Moby Dick Progress

**Book:** Moby-Dick or, The Whale — Cá voi trắng (Herman Melville)
**EPUB:** `books/Moby-Dick or, The Whale -- Ca voi trang - Herman Melville.epub`
**Extracted:** `books/Moby-Dick or, The Whale -- Ca voi trang - Herman Melville/`
**Total files:** 143 (split2–split143 + titlepage)
**Started:** 2026-02-28

## Progress

| #   | Chapter               | File            | Fixes | Status  |
| --- | --------------------- | --------------- | ----- | ------- |
| —   | Dedication            | split2          | 1     | Done    |
| I   | Ảo Vọng               | split4          | 3     | Done    |
| II  | Khăn gói              | split5          | 3     | Done    |
| III | Quán Cá Voi Phun Nước | split6          | 10    | Done    |
| IV  | Tấm Chăn Bông         | split7          | —     | Pending |
| V–… | …                     | split8–split143 | —     | Pending |

**Total fixes so far: 17**

## Fix Log

### Dedication (split2) — 1 fix

1. `niềm ngưỡng` → `niềm ngưỡng mộ` (missing word)

### Chapter I (split4) — 3 fixes

1. `nhưng đám người` → `những đám người` (nhưng→những)
2. `nhưng người này` → `những người này` (nhưng→những)
3. `nhứng miền biển` → `những miền biển` (nhứng→những)

### Chapter II (split5) — 3 fixes

1. `cùng còn nơi nào` → `cũng còn nơi nào` (cùng→cũng)
2. `xúi quẩy` → `xui quẩy` (xúi→xui)
3. `đá được đặt xuống` → `đã được đặt xuống` (đá→đã)

### Chapter III (split6) — 10 fixes

1. `tiền sánh` → `tiền sảnh` (sánh→sảnh)
2. `thầu thập` → `thu thập` (wrong word)
3. `cùng có thể` → `cũng có thể` (cùng→cũng)
4. `thiết tuồng` → `thiết tưởng` (tuồng→tưởng)
5. `mối cầy` → `mỗi cây` (mối cầy→mỗi cây)
6. `bao lầu` → `bao lâu` (lầu→lâu)
7. `vung bóng tối` → `vùng bóng tối` (vung→vùng)
8. `chuyên đó` → `chuyện đó` (chuyên→chuyện)
9. Removed stray `đêm,` breaking sentence flow
10. `một lân nữa` → `một lần nữa` (lân→lần)

## Common Error Patterns

- Missing/wrong Vietnamese diacritics (nhưng→những, cùng→cũng, vung→vùng)
- Homophone confusion (đá/đã, chuyên/chuyện, sánh/sảnh)
- Typos (mối cầy→mỗi cây, thiết tuồng→thiết tưởng)
- Missing words (ngưỡng→ngưỡng mộ)

## Commits

- `3dd0e0e` — feat(books): fix Vietnamese grammar in Moby Dick translation (Ch.I–III + dedication)
