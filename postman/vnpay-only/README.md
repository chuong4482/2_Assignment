# Cách chạy Postman

## 1. Khởi động backend

Tại thư mục gốc Assignment 1, tạo `.env` nếu chưa có:

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
```

Điền cấu hình VNPay Sandbox trong `.env`:

```dotenv
VNPAY_TMN_CODE=<merchant-code>
VNPAY_HASH_SECRET=<merchant-secret>
VNPAY_RETURN_URL=http://localhost:4000/payments/vnpay/return
```

Bật Docker Desktop và chạy:

```powershell
docker compose up -d --build
```

Nếu backend đã chạy và vừa sửa `.env`, chạy lại:

```powershell
docker compose up -d --force-recreate api
```

## 2. Import vào Postman

Chọn **Import**, chọn ba file trong thư mục này:

- `01-api-vnpay.postman_collection.json`
- `02-after-vnpay.postman_collection.json`
- `local.postman_environment.json`

Chọn environment **BrewLite Assignment 1 — Local VNPay**, đặt `baseUrl` là `http://localhost:4000`.

## 3. Chạy test API

1. Mở collection **01 API tự động — VNPay only**.
2. Chọn **Run collection**.
3. Chọn toàn bộ request, giữ đúng thứ tự, đặt **Iterations = 1**.
4. Bấm **Run** và xem kết quả test.

## 4. Thanh toán và test sau thanh toán

1. Lấy biến `paymentUrl` trong environment sau khi collection 01 chạy xong.
2. Mở URL bằng trình duyệt và thanh toán trên VNPay Sandbox bằng thông tin test của merchant.
3. Chờ chuyển về ứng dụng.
4. Giữ nguyên environment và chạy collection **02 Sau thanh toán VNPay Sandbox**.

Không chạy lại collection 01 giữa bước thanh toán và collection 02 vì tài khoản, token và mã đơn sẽ được tạo mới.

## 5. Chạy bằng dòng lệnh

Tại thư mục gốc Assignment 1:

```powershell
npx.cmd newman run postman/vnpay-only/01-api-vnpay.postman_collection.json -e postman/vnpay-only/local.postman_environment.json
```

## 6. Hai tài khoản mua ly cuối

Chạy theo [hướng dẫn test ly cuối](LAST-ITEM.md): import collection `03-last-item-setup`, `04-last-item-verify` và environment `last-item`, điền tài khoản quản lý, chạy chuẩn bị → thanh toán hai URL VNPay → chạy kiểm tra.
