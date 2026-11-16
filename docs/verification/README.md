# Kiểm chứng local ngày 16/11/2026

Đối chiếu hai đề BrewLite và Assignment 2. Hai AI kiểm tra độc lập yêu cầu/tài liệu và mã nguồn/nghiệp vụ; các phát hiện đã được đối chiếu và kiểm thử lại.

| Kiểm tra | Kết quả |
| --- | --- |
| ESLint | Đạt |
| Unit | 45/45, gồm các test tái hiện lỗi trước khi sửa |
| HTTP/PostgreSQL integration | 17/17 trên database test riêng |
| Mobile browser E2E | 5/5 |
| Build API và web | Đạt |
| Docker build Node 22, npm ci theo lockfile | Đạt |
| GitHub Actions actionlint, deploy/rollback sh -n | Đạt cú pháp; chưa thay thế lần chạy hosted |
| Menu p95, 30 request sau warm-up | 53,9 ms trong lượt kiểm tra cuối, dưới 500 ms |
| Docker smoke | Web, manifest, service worker, products, promotions, health/ready trả 200 |

Các lỗi đã sửa: đơn mới ghi đè đơn có URL VNPay; retry ghi đè trạng thái PAID; callback thiếu kiểm tra transaction status; đơn lỗi không hết hạn/hoàn điểm; quyết toán dùng snapshot cũ; báo hoàn tiền VNPay khi chưa hoàn; thiếu controller khuyến mãi. Bổ sung POST /payments với Idempotency-Key: sáu request đồng thời chỉ tạo một Payment và trả cùng URL trong điều kiện kiểm thử. Hai giao dịch mua ly cuối chỉ một đơn PAID, tồn kho không âm, callback lặp không cộng điểm/trừ kho lần nữa; bên thua được hoàn điểm đã dùng.

PWA có manifest, icon, service worker và trang ngoại tuyến. Chỉ trang ngoại tuyến công khai được cache; đặt hàng/thanh toán cần kết nối mạng. Xem [desktop](desktop.png) và [mobile](mobile.png).

Giao dịch NCB thật trên môi trường Sandbox đã thực hiện ở lượt kiểm tra trước: đơn BLU6JR7VD2, 50.000đ, giao dịch 15739042. Sau rebuild Docker đã đọc lại từ API: PAID và Payment SUCCESS. Bộ test tự động dùng chữ ký test riêng, không thay thế kiểm thử ngân hàng Sandbox hay IPN qua URL public.

## Phần còn cần minh chứng ngoài local

- CI trên GitHub, branch protection và lịch sử PR/review theo đúng trình tự yêu cầu.
- Production HTTPS, proxy/DNS, secrets, registry, backup, smoke và diễn tập rollback thực tế.
- Phân công nhóm, Sprint/issue board, review/retrospective và video bàn giao thực tế.
- Deployment diagram hiện mô tả phương án VPS; cần cập nhật theo nền tảng triển khai thật.

Giới hạn còn biết: các lần thử VNPay dùng chung order reference; callback lỗi đến muộn từ lần cũ có thể đưa lần thử mới sang PAYMENT_FAILED, và thành công sau đó cần đối soát/hoàn tiền. Hoàn tiền VNPay được ghi REFUND_PENDING; chưa tích hợp API hoàn tiền tự động. Không có thu tiền thật hoặc production được xác minh.

README và docs/deployment.md chứa lệnh tái hiện. Secret merchant nằm trong .env được Git bỏ qua.
