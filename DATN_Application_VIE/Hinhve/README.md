# Sơ đồ Chương 4 — JPMaster (draw.io)

Thư mục chứa các file `.drawio` để import vào [diagrams.net](https://app.diagrams.net).

## Cách mở

1. Truy cập https://app.diagrams.net hoặc mở draw.io Desktop
2. **File → Open from → Device**
3. Chọn file `.drawio` trong thư mục này
4. Nếu file có nhiều tab → chọn tab ở thanh dưới cùng
5. Chỉnh sửa (nếu cần) → **File → Export as → PNG** (Zoom 200%, Border 10px)

## Danh sách file

| File | Tab / Nội dung | Hình LaTeX export |
|------|----------------|-------------------|
| `01-kien-truc-tong-the.drawio` | Kiến trúc tổng thể | `fig-architecture.png` |
| `02-package-tong-quan.drawio` | Package diagram 4 tầng | `fig-package-overview.png` |
| `03-package-chi-tiet.drawio` | Package chi tiết BE + FE | `fig-package-detail.png` |
| `04-so-do-lop.drawio` | Class diagram tổng thể | `fig-class-overall.png` |
| `05-sequence-diagrams.drawio` | Tab 5: Thanh toán | `fig-seq-payment.png` |
| | Tab 6: Học bài | `fig-seq-learning.png` |
| | Tab 7: Flashcard + AI | `fig-seq-ai.png` |
| `06-erd.drawio` | ERD 30 bảng (nhóm domain) | `fig-erd.png` |
| `07-trien-khai.drawio` | Mô hình triển khai dev + prod | `fig-deployment.png` |
| `08-wireframe-giao-dien.drawio` | Tab 10–13: 4 wireframe UI | `fig-ui-home.png` … `fig-ui-flashcard-ai.png` |

## Export vào LaTeX

Sau khi export PNG, đặt file vào cùng thư mục `Hinhve/` và dùng:

```latex
\includegraphics[width=0.92\textwidth]{Hinhve/fig-architecture.png}
```

## Ghi chú

- Sơ đồ đã có sẵn nội dung JPMaster (module, API, bảng DB thực tế)
- Bạn có thể kéo chỉnh bố cục, thêm/bớt chi tiết trước khi export
- Screenshot sản phẩm thật (§4.3.3) **không** nằm trong draw.io — chụp từ app đang chạy
