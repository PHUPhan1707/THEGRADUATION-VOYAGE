# DANH SÁCH ẢNH & ÂM THANH CẦN CHUẨN BỊ

Bạn chỉ cần **đặt file đúng tên, đúng thư mục** như bảng dưới. Không cần sửa code.
Khi thiếu file nào, web vẫn chạy bình thường (tự dùng hình nền mặc định), nên bạn có thể làm dần.

Tất cả nằm trong thư mục `public/`:

```
public/
├─ images/
│  ├─ main/       ← ⭐ 2 ảnh nền chính (quan trọng nhất)
│  ├─ share/      ← ảnh hiện khi gửi link qua Zalo/Messenger
│  ├─ gallery/    ← ảnh kỷ niệm + file gallery.json (chú thích)
│  ├─ closing/    ← (tuỳ chọn) nền popup "Lời kết"
│  ├─ map/        ← (tuỳ chọn) bản đồ địa điểm
│  ├─ portrait/   ← (tuỳ chọn) ảnh chân dung bạn
│  └─ _reference/ ← ảnh mẫu cũ để tham khảo (web KHÔNG dùng)
└─ audio/
   └─ bgm.mp3     ← nhạc nền
```

---

## ⭐ Mức 1 — BẮT BUỘC (làm trước)

| # | Tên file (đúng chính tả) | Đặt vào | Kích thước | Dung lượng | Dùng ở đâu |
|---|---|---|---|---|---|
| 1 | `bg-landscape.jpg` | `public/images/main/` | **2560 × 1440** (ngang 16:9) | ≤ 600 KB | Nền màn hình chính trên **máy tính / tablet ngang** |
| 2 | `bg-portrait.jpg` | `public/images/main/` | **1290 × 2796** hoặc 1080 × 1920 (dọc) | ≤ 450 KB | Nền màn hình chính trên **điện thoại** |
| 3 | `og-image.jpg` | `public/images/share/` | **1200 × 630** | ≤ 300 KB | Ảnh xem trước khi gửi link |

### ❗ Quy tắc quan trọng nhất cho ảnh nền (#1, #2)

**KHÔNG được có chữ trong ảnh.** Không cuộn thư, không bảng ngày giờ, không nút "BẢN ĐỒ / XÁC NHẬN…", không chữ "GRADUATED".
Toàn bộ chữ do web tự vẽ lên để đổi được tên khách và giờ. (Ảnh mẫu cũ của bạn có sẵn chữ nên mình đã chuyển vào `_reference/` và không dùng nữa.)

Ảnh chỉ gồm: **bầu trời + biển + tàu Going Merry + băng Mũ Rơm + bạn trong áo cử nhân.**

**Bố cục ảnh ngang `bg-landscape.jpg` (2560×1440):**
```
┌────────────────────────────────────────────────┐
│ [TRỐNG: trời/buồm]        [TRỐNG: trời/buồm]    │  ← trái & phải để chừa chỗ
│ ┌─────────┐       ┌──────────────┐  ┌────────┐  │    cho cuộn thư và bảng thông tin
│ │ chừa    │       │  BẠN + MŨ RƠM │  │ chừa   │  │
│ │ chỗ thư │       │  (ở GIỮA)     │  │ chỗ    │  │
│ │ (~40%)  │       │  40%–70% ngang│  │ bảng   │  │
│ └─────────┘       └──────────────┘  └────────┘  │
│ [dải dưới ~15%: boong tàu/gỗ, không có mặt người]│  ← để chừa thanh nút điều hướng
└────────────────────────────────────────────────┘
```
- Gương mặt bạn và các nhân vật chính đặt trong vùng **ngang 35%–70%**, **dọc 30%–80%**.
- Nửa trái (0–38%) và góc phải (72–100%) chỉ nên là trời, buồm, biển, vật trang trí nhẹ.
- ~15% dưới cùng: boong tàu / thùng gỗ, tránh mặt người.

**Bố cục ảnh dọc `bg-portrait.jpg` (1290×2796):**
```
┌──────────────┐
│ TRỐNG: trời,  │  ← 0–35% trên: chỉ trời/buồm/cờ (để đặt tiêu đề "Một lời mời…")
│ mây, buồm     │
│──────────────│
│  BẠN + MŨ RƠM │  ← 35–78%: nhân vật (mặt nằm trong 40–70% chiều cao)
│  (ở GIỮA)     │
│──────────────│
│ boong tàu     │  ← 78–100%: boong gỗ/biển, không mặt người (chừa chỗ cho 4 nút)
└──────────────┘
```

**Gợi ý prompt nếu bạn tạo bằng AI (ChatGPT / Gemini / Midjourney)**, kèm ảnh chân dung của bạn:
```
Anime illustration in One Piece art style. A Vietnamese young man in a black graduation gown
holding a diploma, standing at the center, surrounded by the Straw Hat Pirates (Luffy, Zoro,
Nami, Usopp, Sanji, Chopper, Robin, Franky, Brook) cheerfully posing on the deck of the Thousand
Sunny / Going Merry under a bright blue sky. Wide 16:9 composition (OR vertical 9:19.5).
IMPORTANT: no text, no letters, no logos, no banners, no scroll, no frames, no UI.
Keep the left 38% and the top-right area calm (sky, sails, sea) with no faces.
Keep the bottom 15% as plain wooden deck. High resolution, vivid colors.
```
Nếu AI vẫn vẽ chữ, hãy nhờ: *"Regenerate with absolutely no text or writing anywhere"*, hoặc tự xóa chữ bằng công cụ xóa vật thể.

### Cách xuất file
- Lưu định dạng **JPG chất lượng ~80%** (dùng squoosh.app để nén cho nhẹ).
- Tên file **viết thường, không dấu, không khoảng trắng**.

### Ảnh chia sẻ `og-image.jpg` (1200×630)
Ảnh đẹp nhất của thiệp (có thể cắt từ ảnh nền) và **được phép có chữ** như "THE GRADUATION VOYAGE – Phan An Phú – 28/11/2026". Đặt nội dung quan trọng trong vùng giữa 900×450 vì Zalo/Facebook hay cắt viền.

---

## 🎵 Mức 2 — Nhạc nền

| # | Tên file | Đặt vào | Yêu cầu |
|---|---|---|---|
| 4 | `bgm.mp3` | `public/audio/` | MP3, **≤ 3 MB**, 60–120 giây, loop mượt (đầu/cuối không bị ngắt đột ngột), 128 kbps |

Nhạc phát khi khách bấm **"MỞ THƯ MỜI"**. Không có file này thì nút nhạc tự ẩn.
Nên dùng nhạc bạn có quyền sử dụng (bản cover, nhạc không bản quyền) để tránh bị gỡ khi đưa lên mạng.

---

## 🖼️ Mức 3 — Gallery kỷ niệm (4–12 ảnh)

Đặt ảnh vào `public/images/gallery/` với tên **`photo-01.jpg`, `photo-02.jpg`, … `photo-12.jpg`** (tối đa 12).

| Yêu cầu | Giá trị |
|---|---|
| Tỉ lệ | Ngang 4:3 (ảnh dọc vẫn dùng được, sẽ bị cắt giữa) |
| Kích thước | cạnh dài **1600 px** |
| Dung lượng | ≤ 350 KB / ảnh |
| Nội dung gợi ý | Ảnh năm nhất, bạn bè cùng lớp, đồ án, câu lạc bộ, chuyến đi, buổi chụp kỷ yếu |

Sau đó mở file **`public/images/gallery/gallery.json`** và sửa chú thích cho từng ảnh (đã tạo sẵn 12 dòng). Ảnh nào không có file thì web tự bỏ qua.

---

## ✨ Mức 4 — Tuỳ chọn (có thì đẹp hơn, không có vẫn chạy)

| # | Tên file | Đặt vào | Kích thước | Dùng ở đâu |
|---|---|---|---|---|
| 5 | `closing-bg.jpg` | `public/images/closing/` | 1600 × 900 | Nền popup "Lời kết" (hoàng hôn, con tàu). Không có chữ. Mặc định dùng ảnh hoàng hôn cũ |
| 6 | `venue-map.jpg` | `public/images/map/` | 1200 × 800 | Bản đồ minh họa kiểu kho báu hoặc ảnh chụp bản đồ trường. **Không có chữ/ngày trong ảnh** (web tự ghim tên địa điểm lên giữa ảnh). Mặc định dùng bản đồ cũ |
| 7 | `graduate.png` | `public/images/portrait/` | 800 × 800, nền trong suốt hoặc vuông | Ảnh chân dung tròn trong popup "Lời kết" |

---

## ✅ Checklist nhanh

- [ ] `public/images/main/bg-landscape.jpg`
- [ ] `public/images/main/bg-portrait.jpg`
- [ ] `public/images/share/og-image.jpg`
- [ ] `public/audio/bgm.mp3`
- [ ] `public/images/gallery/photo-01.jpg` … (tối thiểu 4 ảnh) + sửa `gallery.json`
- [ ] (tuỳ chọn) `closing-bg.jpg`, `venue-map.jpg`, `graduate.png`

**Làm xong bạn nhắn mình**, mình sẽ chạy thử kiểm tra bố cục thật trên điện thoại/máy tính và chỉnh vị trí chữ cho khớp với ảnh.
Trong lúc chờ ảnh, web đã chạy được với hình nền biển/trời dựng bằng code để bạn xem thử bố cục.

---

## ❓ Thông tin bằng chữ cũng cần chốt (không phải ảnh)

Sửa trong `src/lib/config.ts` (hoặc qua trang `/admin` → Cài đặt):
- Giờ làm lễ (`ceremonyTime`, ví dụ `"08:00"`)
- Link Google Maps chính xác (`mapsLink`)
