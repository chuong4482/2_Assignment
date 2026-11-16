# Chạy test hai tài khoản mua ly cuối

## Mở trong collection đang dùng

Trong Postman Local View, mở:

```text
BrewLite - Kiểm thử Chức Năng (Chuẩn Sơ Đồ Luồng)
└── 10 - Hai tài khoản mua ly cuối
    ├── 01 - chuẩn bị
    └── 02 - kiểm tra
```

Nhóm này nằm dưới Bước 9. Chọn environment **BrewLite — Hai tài khoản mua ly cuối**, điền `adminPassword`, chạy riêng nhóm **01 - chuẩn bị**; sau khi thanh toán cả hai URL thì chạy **02 - kiểm tra**. Nhóm chuẩn bị dừng sau khi tạo URL, không chạy tiếp phần xác nhận khi chưa thanh toán.

Nếu Postman chưa cập nhật file của dự án, mở lại thư mục dự án trong Local View. Nếu dùng Cloud View, import các file JSON theo cách dưới đây; việc thêm file local không tự xác nhận collection cloud đã cập nhật.

## 1. Import

Import ba file vào Postman:

- `03-last-item-setup.postman_collection.json`
- `04-last-item-verify.postman_collection.json`
- `last-item.postman_environment.json`

## 2. Điền environment

Chọn **BrewLite — Hai tài khoản mua ly cuối**:

| Biến | Giá trị nhập |
|---|---|
| `baseUrl` | API local, ví dụ `http://localhost:4000` |
| `adminEmail` | Email ADMIN hoặc MANAGER của môi trường test |
| `adminPassword` | Mật khẩu tài khoản trên; seed local mặc định là `Admin123!` nếu chưa đổi |
| `buyerAPassword` | Mật khẩu tài khoản A mới, tối thiểu 6 ký tự |
| `buyerBPassword` | Mật khẩu tài khoản B mới, tối thiểu 6 ký tự |

Backend phải chạy, database đã migrate/seed và cấu hình merchant VNPay Sandbox. Chỉ chạy trên local/database test.

## 3. Chuẩn bị hai tài khoản và hai đơn

Chạy toàn bộ collection **03A — Hai tài khoản tranh ly cuối: chuẩn bị**, theo thứ tự, một iteration.

Collection tạo mới một nguyên liệu tồn đúng **1**, một món test riêng có công thức **1 đơn vị/ly size M**, và hai khách hàng. Email được lưu ở `lastBuyerAEmail`, `lastBuyerBEmail`.

Giá món test là 10.000đ, size M cộng 5.000đ; mỗi đơn phải có tổng 15.000đ.

Hai request tạo đơn được gửi song song bằng script. Cả hai có thể tạo PENDING vì hệ thống chưa trừ kho ở bước này. Tồn kho vẫn là 1. Không sửa tồn kho hay công thức của món hiện có.

## 4. Thanh toán hai phiên VNPay

1. Lấy `lastPaymentUrlA` và `lastPaymentUrlB` trong environment.
2. Mở mỗi URL ở một tab trình duyệt.
3. Hoàn tất cả hai thanh toán bằng thông tin test của VNPay Sandbox, trước khi đơn hết hạn 15 phút.
4. Chờ backend xử lý return/IPN của cả hai.

Không chạy lại collection chuẩn bị giữa hai lần thanh toán, không bổ sung tồn kho món test và không hủy đơn trong lúc thử.

## 5. Kiểm tra kết quả

Giữ nguyên environment, chạy collection **03B — Hai tài khoản tranh ly cuối: kiểm tra**.

Kết quả mong đợi:

- Chỉ một đơn có trạng thái đã thanh toán và `Payment.SUCCESS`.
- Đơn còn lại `CANCELLED` và `Payment.REFUND_PENDING` vì ly cuối đã được bán. Đây là chờ đối soát/hoàn tiền, chưa phải đã hoàn tiền.
- Nguyên liệu còn 0, không âm; món hết hàng.
- Thử đặt thêm một ly bị từ chối với HTTP 409.

Chạy collection kiểm tra trước khi hoàn tất **cả hai** thanh toán sẽ báo đỏ; PENDING không được coi là đạt. Bộ này không tạo IPN thành công giả.

Việc mở hai tab không bảo đảm callback ngân hàng đến đúng cùng một thời điểm. Phần tạo đơn được gửi song song; phần thanh toán là thao tác Sandbox và kiểm kết quả cạnh tranh tồn kho. Muốn đánh giá tải/concurrency chính xác của callback cần bài kiểm thử riêng.

Sau khi xem kết quả, có thể ẩn món `LAST-CUP-...` trong quản trị. Không xóa đơn đã thanh toán; không dùng tài khoản/nguyên liệu test này cho dữ liệu kinh doanh.
