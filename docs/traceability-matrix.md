# Ma trận truy vết BrewLite

Các đường dẫn dưới đây tính từ thư mục gốc. Kết quả local không thay thế minh chứng production hoặc lịch sử thực hiện tuần tự Task 1 đến Task 5.

| Mã | Use-case / story | Thiết kế | Code / API | Kiểm thử |
| --- | --- | --- | --- | --- |
| FR-01 | US-01 Xem món | use-cases, activity-checkout, domain | GET /products; task-02-san-pham | san-pham.spec.ts; WEB-T01 |
| FR-02 | US-02 Tùy chọn | UC-01, domain | GET /products/:id; tinh-gia-mon.ts | nghiep-vu.spec.ts; E2E đặt món |
| FR-03 | US-03 Giỏ hàng | activity-checkout | /cart; task-05-gio-hang | INT-T01; E2E giỏ hàng |
| FR-04 | US-04 Xác thực | sequence-checkout | /auth/register, /auth/login; JWT guard | INT-T02; kiểm thử quyền truy cập |
| FR-05 | UC-01 Đặt đơn | activity-checkout, sequence-checkout | POST /orders; task-06-don-hang | INT-T03; E2E chính |
| FR-06 | UC-01 Thanh toán | sequence-checkout; ADR-002 | /payments/vnpay; retry-payment | Unit chữ ký/retry; integration IPN; Postman bước 1–8 |
| FR-07 | US-07 Theo dõi | domain, sequence-checkout | GET /orders/me; task-09-lich-su-don-hang | INT-T05; E2E chống URL success giả |
| FR-08 | US-08 Pha chế / hủy | OrderStatus; máy trạng thái | may-trang-thai-don-hang.ts; PATCH /admin/orders/:id/status | Unit trạng thái; E2E quản trị và xác nhận hủy |
| FR-09 | UC-01 Gửi lặp | sequence-checkout; intent duy nhất | POST /payments; Idempotency-Key | Integration intent đồng thời, IPN lặp |
| FR-10 | UC-01 Ly cuối | domain; Ingredient.version | task-10-ton-kho | Integration cạnh tranh nguyên liệu |
| FR-11 | UC-01 Ưu đãi | domain, transaction | promotion / loyalty settlement | Unit giá/điểm; integration callback và hủy |
| FR-12 | US-12 Nhân viên | actor quản trị; guard | task-10-quan-tri; bao-ve.guard.ts | Khách nhận 403; integration danh sách đơn |
| NFR-01 | Hiệu năng menu | Kiến trúc API | GET /products | PERF-T01: p95 local dưới 500 ms |
| NFR-02 | Bảo mật | Ranh giới JWT / secret | DTO, bcrypt, JWT, chữ ký VNPay | Unit/integration chữ ký và phân quyền |
| NFR-03 | Khả dụng / mobile | UI; health | /health, /health/ready; xử lý lỗi mạng | E2E mobile 390 px, thông báo lỗi và bộ lọc rỗng |
| NFR-04 | Tái tạo | ADR-001; Docker | Dockerfile, Compose, Prisma migration/seed | Build, migration/seed và test database riêng |
| NFR-05 | Phát hành | deployment; pipeline | ci.yml, delivery.yml; scripts triển khai/khôi phục | Cần minh chứng CI/CD hosted, HTTPS và rollback thật |
| NFR-06 | PWA | Kiến trúc web | manifest.ts, sw.js, offline.html | pwa.spec.ts; cài đặt HTTPS production cần xác minh |

Nguồn sơ đồ và hình xuất nằm trong `docs/diagrams`. SRS và UC-01 nằm trong `docs/requirements`. Báo cáo LaTeX có hình nằm trong `docs/bao-cao-latex`.

Thanh toán của dự án là VNPay Sandbox thay ví/thẻ mô phỏng; không tự xác nhận PAID và không giả callback trong Postman. Bộ Postman dừng sau khi lấy `payment_url`; bước xác nhận sau thanh toán chỉ chạy khi đã hoàn tất Sandbox. Các bài integration/E2E hợp đồng dùng khóa ký test riêng trên database test.

Các kết quả cần được chốt lại trên commit nộp bài; minh chứng nghiệm thu, triển khai và lịch sử Sprint cần được bổ sung riêng.
