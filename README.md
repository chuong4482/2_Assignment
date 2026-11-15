# Chạy BrewLite

Báo cáo có hình và mã nguồn LaTeX: [báo cáo BrewLite](docs/bao-cao-latex/bao-cao-brewlite.tex), [hướng dẫn biên dịch](docs/bao-cao-latex/huong-dan-bien-dich.txt). Ma trận yêu cầu–thiết kế–code–test nằm trong [tài liệu truy vết](docs/traceability-matrix.md).

Cấu trúc thư mục và ranh giới các thành phần theo Assignment 2 được mô tả trong [tài liệu kiến trúc](docs/architecture/tong-quan.md#repository-boundaries-assignment-2). Thư mục `task-*` trong mã nguồn là cách chia tính năng kế thừa từ Assignment 1, không phải năm giai đoạn của Assignment 2.

## 1. Chuẩn bị

Các sơ đồ trong `docs/diagrams` đã có nội dung tiếng Việt, kèm bản nguồn Mermaid (`.mmd`), hình SVG và PNG:

- [Use-case tổng quát](docs/diagrams/use-cases.png)
- [Use-case đặt và thanh toán](docs/diagrams/use-case-checkout.png)
- [Hoạt động đặt và thanh toán](docs/diagrams/activity-checkout.png)
- [Trình tự đặt và thanh toán](docs/diagrams/sequence-checkout.png)
- [Lớp nghiệp vụ](docs/diagrams/domain.png)
- [Triển khai hệ thống](docs/diagrams/deployment.png)

Tên lớp gốc, mã trạng thái, đường dẫn API và tên công nghệ được giữ khi cần đối chiếu với mã nguồn. Sơ đồ triển khai hiện mô tả phương án VPS, chưa phải minh chứng production hoạt động.

Cài và mở Docker Desktop (Linux containers). Chạy các lệnh PowerShell bên dưới tại thư mục gốc dự án.

Tạo file cấu hình nếu chưa có:

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
```

Điền thông tin merchant VNPay Sandbox hợp lệ trong `.env`:

```dotenv
VNPAY_TMN_CODE=<ma-merchant-sandbox>
VNPAY_HASH_SECRET=<secret-cua-merchant-sandbox>
VNPAY_RETURN_URL=http://localhost:4000/payments/vnpay/return
WEB_ORIGIN=http://localhost:3000
```

Không dùng nguyên giá trị mẫu. Thông tin merchant phải do VNPay cấp và khớp môi trường Sandbox. Đây là giao dịch thử nghiệm qua cổng VNPay, không trừ tiền thật. Muốn thu tiền thật cần tài khoản merchant production và tích hợp production riêng; bản hiện tại sử dụng cổng Sandbox.

Dockerfile ở thư mục gốc có hai target `api` và `web`; Docker Compose tự chọn target tương ứng. Cấu hình local dùng chung `.env` ở thư mục gốc. Cấu hình production và database kiểm thử được giữ riêng.

## 2. Khởi động

```powershell
docker compose up -d --build
docker compose ps
docker compose logs --tail 100 api web
```

Lần đầu cần chờ build, migration và seed database hoàn tất. Nếu khởi động báo lỗi, xem log trước khi tiếp tục.

- Website: http://localhost:3000
- Quản trị: http://localhost:3000/admin
- API health: http://localhost:4000/health
- Kết nối database: http://localhost:4000/health/ready

Tài khoản quản trị dùng `ADMIN_EMAIL` và `ADMIN_PASSWORD` trong `.env` (mặc định mẫu: `admin@brewlite.local` / `Admin123!`). Khách hàng đăng ký tài khoản trên website.

Docker tự kết nối API tới database nội bộ. Cổng database trên máy lấy từ `DB_PORT` trong `.env` (mặc định `5437`). Khi chạy API/Prisma ngoài Docker, `DATABASE_URL` cần dùng cùng cổng này.

## 3. Thanh toán đơn hàng

1. Đăng ký hoặc đăng nhập tài khoản khách hàng.
2. Chọn món còn hàng, size, topping và thêm vào giỏ.
3. Mở giỏ hàng, kiểm tra tổng tiền rồi chọn thanh toán VNPay.
4. Xác nhận để chuyển sang trang VNPay Sandbox. Dùng thông tin thẻ/tài khoản thử nghiệm do VNPay cung cấp cho Sandbox và hoàn tất xác thực.
5. Chờ VNPay chuyển về website. Mở **Đơn hàng** tại http://localhost:3000/orders và kiểm tra đơn chuyển sang trạng thái đã thanh toán (`PAID`, hoặc trạng thái xử lý tiếp theo).

Chỉ tạo đơn hoặc mở được trang VNPay chưa có nghĩa là thanh toán thành công. Đơn có tổng tiền lớn hơn 0 phải hoàn tất giao dịch tại VNPay; đơn 0đ được xác nhận trực tiếp. Khi giao dịch thất bại, vào **Đơn hàng** để thử thanh toán lại.

Nếu không tạo được liên kết thanh toán, kiểm tra `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET` và log API. Nếu VNPay báo lỗi merchant/chữ ký, kiểm tra lại thông tin Sandbox. Sau khi sửa `.env`, chạy:

```powershell
docker compose up -d --force-recreate api
docker compose logs --tail 100 api
```

Thực hiện thanh toán trên cùng máy đang chạy ứng dụng vì địa chỉ trả về hiện là `localhost`.


Tại VNPay, chọn **Thẻ nội địa và tài khoản ngân hàng → NCB**, nhập thông tin trên, đồng ý điều khoản và xác nhận OTP.

## 4. Dừng hoặc chạy lại

```powershell
docker compose down
```

Chạy lại:

```powershell
docker compose up -d
```

Lệnh dừng trên giữ nguyên dữ liệu database. Sau khi sửa mã nguồn, chạy lại `docker compose up -d --build`.

## 5. Chạy kiểm thử và build

### Postman theo luồng VNPay

Import [collection luồng VNPay](postman/kiem-thu-luong-vnpay.postman_collection.json). Bản YAML trong `postman/collections` cũng đã được cập nhật cùng nội dung.

1. Chạy bước 1–8 theo thứ tự. Bộ test chọn món còn nguyên liệu, tạo tài khoản test và đơn `PENDING`, rồi lưu biến collection `payment_url`. Runner tự dừng tại bước 8, chưa xác nhận đã thanh toán.
2. Giữ lại giá trị biến sau khi Run (bật **Keep variable values** nếu phiên bản Postman có tùy chọn này). Mở `payment_url` bằng trình duyệt, hoàn tất thanh toán VNPay Sandbox trước khi liên kết hết hạn.
3. Giữ nguyên collection và các biến `jwt_token`, `order_id`, `order_total`; gửi riêng bước 9 để xác minh đơn đã được backend ghi nhận thanh toán thành công. Không chạy lại bước 1–7 giữa hai giai đoạn vì sẽ tạo tài khoản/đơn mới.

Nếu gửi bước 9 khi chưa thanh toán hoặc callback chưa được xử lý, test sẽ fail đúng thực tế. Bộ test không giả callback, không đọc khóa ký và không tự chuyển đơn sang `PAID`. Kịch bản hai tài khoản mua ly cuối là folder riêng, không chạy tự động sau bước 8.

Cần Node.js 22. Tại thư mục gốc:

```powershell
npm.cmd ci
npm.cmd run db:generate
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

Integration/E2E dùng database riêng, không chạy trên dữ liệu demo:

```powershell
docker compose -f docker-compose.test.yml up -d --wait
npm.cmd run test:setup
node tests/chay-voi-moi-truong-kiem-thu.cjs run start:prod -w apps/api
```

Giữ terminal API test mở. Trong terminal thứ hai:

```powershell
node tests/chay-voi-moi-truong-kiem-thu.cjs run test:integration
npx.cmd playwright install chromium
node tests/chay-voi-moi-truong-kiem-thu.cjs run test:e2e
```

E2E tự bật web test ở cổng `3100`, API test dùng `4100`. Dừng API test bằng `Ctrl+C`; dừng database test bằng `docker compose -f docker-compose.test.yml down`.

## 6. Chạy production và rollback

Trên VPS Linux đã cấu hình Docker, HTTPS reverse proxy, GHCR và `.env.production` theo [hướng dẫn deployment](docs/deployment.md), chạy từ thư mục dự án:

```sh
sh scripts/trien-khai.sh <commit-sha-da-push-image>
```

Quay về image của lần triển khai trước:

```sh
sh scripts/khoi-phuc-phien-ban.sh
```

Rollback image không khôi phục database. Sao lưu database trước migration; các migration khi triển khai phải tương thích với phiên bản trước.

Pipeline tự động dùng `.github/workflows/ci.yml` và `delivery.yml`. Cần cấu hình biến/secrets trên repository theo `docs/deployment.md` trước khi bật `ENABLE_DEPLOY=true`. Hiện chưa có URL production được xác minh.
