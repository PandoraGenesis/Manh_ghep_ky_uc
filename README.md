# Mảnh Ký Ức Thất Lạc - CLB EPIC

Game web mini gửi tặng các bạn nam của CLB EPIC nhân ngày 19/11. Vượt qua 10 chặng cùng linh vật của CLB, quay vòng quay để nhận mảnh ghép, ghép đủ 10 mảnh để khôi phục bức ảnh và mở lá thư.

## Cấu trúc

```
index.html        khung trang
css/style.css     giao diện
js/game.js        toàn bộ game (10 chặng, vòng quay, ghép ảnh, lá thư)
assets/mascot.png linh vật CLB
assets/poster.jpg ảnh cuối (poster 19/11, tỉ lệ 16:9)
```

## Chạy thử

Mở `index.html` bằng trình duyệt, hoặc bật GitHub Pages: Settings → Pages → Branch `main` / thư mục `/ (root)`.

## Tùy chỉnh

Phần đầu của `js/game.js`:

- `CLUB`: tên CLB.
- `LETTER`, `SIGN`: nội dung và chữ ký lá thư.
- `PHOTO_SRC`: đường dẫn ảnh cuối. Thay `assets/poster.jpg` bằng ảnh chụp chung của CLB rồi giữ nguyên tên, hoặc đổi đường dẫn.
- `CLASSES`: ba module nâng cấp của linh vật.
