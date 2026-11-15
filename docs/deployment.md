# Triển khai và khôi phục BrewLite

Local đã có cấu hình Docker và kiểm thử. Chưa có URL production, lịch sử CI/CD hosted hoặc minh chứng rollback thực tế được xác minh trong tài liệu này.

## Chạy local

Tạo `.env` từ `.env.example` nếu chưa có, rồi chạy `docker compose up -d --build`. Web ở `http://localhost:3000`, quản trị ở `/admin`, API ở `http://localhost:4000`; kiểm tra `/health` và `/health/ready`. Database local dùng `DB_PORT` trong `.env` (mặc định 5437). Khi chạy Prisma trên host, `DATABASE_URL` phải dùng cùng cổng host này.

Root Dockerfile có hai target `api` và `web`. Production và database test dùng Compose riêng; không đưa dữ liệu test vào database demo/production.

## Chuẩn bị production trên VPS

1. Cài Docker Engine/Compose; cấu hình DNS, TLS và reverse proxy HTTPS vào web/API loopback 3000/4000.
2. Cấu hình quyền pull GHCR nếu image riêng tư. Không ghi mật khẩu registry vào mã nguồn hoặc log.
3. Tạo `.env.production` trên VPS, giới hạn quyền đọc. Các biến cần có: `IMAGE_OWNER` (tên chủ GHCR viết thường), `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `JWT_SECRET`, `STAFF_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `WEB_ORIGIN`, `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_RETURN_URL`. Dùng credentials database phù hợp khi ghép URL; không công bố giá trị thực.
4. Compose production không publish cổng PostgreSQL. Dữ liệu nằm trong volume riêng; cấu hình backup trước migration.
5. Callback/return VNPay phải dùng URL API public đúng môi trường merchant; local Sandbox không phải bằng chứng production hoạt động.

## GitHub Actions

`.github/workflows/ci.yml` chạy cài đặt, lint, unit test, build, integration và E2E trên database riêng. Cần cấu hình required status checks/ruleset trên GitHub để chặn merge khi quality gate thất bại; tệp YAML không tự cấu hình bảo vệ nhánh.

`.github/workflows/delivery.yml` chạy theo tag hoặc thủ công, gọi quality gate, build/push hai image theo SHA rồi deploy và smoke test. Repository variables: `ENABLE_DEPLOY`, `PUBLIC_API_URL`, `PUBLIC_WEB_URL`. Secrets cho môi trường production: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`. Chỉ bật `ENABLE_DEPLOY=true` sau khi cấu hình và kiểm tra hạ tầng thật.

## Triển khai và rollback

Tại thư mục BrewLite trên VPS:

```sh
sh scripts/trien-khai.sh <commit-sha-da-push-image>
sh scripts/khoi-phuc-phien-ban.sh
```

Script triển khai pull image, chờ database healthy, chạy migration, rồi cập nhật API/web và ghi tag. Workflow kiểm tra URL web và API readiness; thất bại sẽ dừng và gọi rollback. Migration phải tương thích phiên bản trước. Rollback image không tự hoàn nguyên database.

## Minh chứng cần bổ sung

URL HTTPS web/API; log health và smoke test; PR/CI thành công và phát hiện lỗi; required checks; registry/tag/release notes; backup/rollback đã diễn tập; video demo, Sprint Review và Retrospective thật. Không thay các minh chứng này bằng ảnh localhost.
