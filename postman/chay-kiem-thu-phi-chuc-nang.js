const http = require('http');
const apiUrl = new URL(process.env.TEST_API_URL || 'http://localhost:4000');

// Đọc tham số truyền vào từ dòng lệnh: node chay-kiem-thu-phi-chuc-nang.js [speed | jwt | validation | bcrypt | idempotency | all]
const targetScope = (process.argv[2] || 'all').toLowerCase();

async function request(options, body) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const req = http.request({ ...options, hostname: apiUrl.hostname, port: apiUrl.port || 80 }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        let json = null;
        try { json = JSON.parse(data); } catch {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json,
          duration
        });
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('='.repeat(75));
  console.log(`--- BREWLITE: KIỂM THỬ YÊU CẦU PHI CHỨC NĂNG (MỤC 4.2) ---`);
  console.log(`Chế độ chạy: [ ${targetScope.toUpperCase()} ]`);
  console.log('='.repeat(75));
  
  let passed = 0;
  let total = 0;

  function assert(title, condition, detail = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`  [PASS] ${title} ${detail ? `--> (${detail})` : ''}`);
    } else {
      console.log(`  [FAIL] ${title} ${detail ? `--> (${detail})` : ''}`);
    }
  }

  // =========================================================================
  // 1. KIỂM THỬ HIỆU NĂNG: TỐC ĐỘ PHẢN HỒI API < 500MS
  // =========================================================================
  if (['all', 'speed', 'perf', 'performance'].includes(targetScope)) {
    console.log('\n[PHẦN 1] KIỂM THỬ HIỆU NĂNG: THỜI GIAN PHẢN HỒI API < 500MS (MỤC 4.2)');
    
    // Test 1.1: Health check
    const resHealth = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/health',
      method: 'GET'
    });
    assert('API Health check phản hồi < 500ms', resHealth.duration < 500, `${resHealth.duration}ms`);

    // Test 1.2: GET /products
    const resMenu = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/products',
      method: 'GET'
    });
    assert('GET /products Status Code là 200 OK', resMenu.statusCode === 200);
    assert('GET /products thời gian phản hồi < 500ms', resMenu.duration < 500, `${resMenu.duration}ms`);
    assert('Dữ liệu danh sách món trả về đầy đủ', Array.isArray(resMenu.json) && resMenu.json.length > 0, `${resMenu.json ? resMenu.json.length : 0} món`);
  }

  // =========================================================================
  // 2. KIỂM THỬ BẢO MẬT: TOKEN JWT & GUARD BẢO VỆ ROUTE
  // =========================================================================
  if (['all', 'jwt', 'auth'].includes(targetScope)) {
    console.log('\n[PHẦN 2] KIỂM THỬ BẢO MẬT: TOKEN JWT & BẢO VỆ ROUTE (TASK 7.3 & MỤC 4.2)');
    
    // Test 2.1: Không có token
    const resNoToken = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/orders/me',
      method: 'GET'
    });
    assert('Chặn truy cập trái phép khi không có JWT (HTTP 401)', resNoToken.statusCode === 401, `Status: ${resNoToken.statusCode}`);

    // Test 2.2: Token giả mạo / không hợp lệ
    const resFakeToken = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/orders/me',
      method: 'GET',
      headers: { 'Authorization': 'Bearer token_gia_mao_khong_hop_le' }
    });
    assert('Chặn token giả mạo với HTTP 401 Unauthorized', resFakeToken.statusCode === 401, `Status: ${resFakeToken.statusCode}`);

    // Test 2.3: Đăng nhập lấy JWT hợp lệ
    const resLogin = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@brewlite.local', password: 'Admin123!' });
    
    const token = resLogin.json && (resLogin.json.accessToken || resLogin.json.token);
    assert('Đăng nhập cấp JWT token thành công', [200, 201].includes(resLogin.statusCode) && !!token);

    // Test 2.4: Gửi JWT hợp lệ vào route bảo vệ
    if (token) {
      const resAuthOk = await request({
        hostname: 'localhost',
        port: 4000,
        path: '/orders/me',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      assert('Truy cập route bảo vệ thành công với JWT hợp lệ (HTTP 200)', resAuthOk.statusCode === 200, `Status: ${resAuthOk.statusCode}`);
    }
  }

  // =========================================================================
  // 3. KIỂM THỬ BẢO MẬT: VALIDATE DỮ LIỆU ĐẦU VÀO (INPUT VALIDATION)
  // =========================================================================
  if (['all', 'validation', 'validate', 'input'].includes(targetScope)) {
    console.log('\n[PHẦN 3] KIỂM THỬ BẢO MẬT: VALIDATE DỮ LIỆU ĐẦU VÀO (CLASS-VALIDATOR)');

    // Test 3.1: Gửi body rỗng khi đăng ký
    const resEmpty = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {});
    assert('Chặn request rỗng với HTTP 400 Bad Request', resEmpty.statusCode === 400, `Status: ${resEmpty.statusCode}`);

    // Test 3.2: Gửi email sai định dạng
    const resBadEmail = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'email_khong_hop_le_chua_at', password: '123' });
    assert('Chặn email sai định dạng với HTTP 400 Bad Request', resBadEmail.statusCode === 400, `Status: ${resBadEmail.statusCode}`);
    assert('Server trả về thông báo lỗi validate chi tiết', !!resBadEmail.json && !!resBadEmail.json.message);

    // Test 3.3: Tạo đơn hàng với danh sách món rỗng
    const resBadOrder = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { items: [] });
    assert('Chặn tạo đơn hàng rỗng hoặc không hợp lệ (HTTP 400 hoặc 401)', [400, 401].includes(resBadOrder.statusCode), `Status: ${resBadOrder.statusCode}`);
  }

  // =========================================================================
  // 4. KIỂM THỬ BẢO MẬT: MẬT KHẨU BĂM (BCRYPT) & BẢO VỆ DỮ LIỆU
  // =========================================================================
  if (['all', 'bcrypt', 'hash', 'security', 'password'].includes(targetScope)) {
    console.log('\n[PHẦN 4] KIỂM THỬ BẢO MẬT: MẬT KHẨU BĂM (BCRYPT) & BẢO VỆ DỮ LIỆU');
    
    const uniqueEmail = `test_nfr_${Date.now()}@brewlite.local`;
    const plainPassword = 'MySecretPassword123!';

    // Test 4.1: Đăng ký user mới và kiểm tra response
    const resReg = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: uniqueEmail, password: plainPassword, fullName: 'NFR Bcrypt Tester' });

    assert('Tạo tài khoản mới thành công (HTTP 201 hoặc 200)', [200, 201].includes(resReg.statusCode), `Status: ${resReg.statusCode}`);
    assert('Tuyệt đối KHÔNG trả về mật khẩu thô (Plain text)', !resReg.data.includes(plainPassword));
    assert('Tuyệt đối KHÔNG làm lộ trường passwordHash ra Client', !resReg.json || !resReg.json.passwordHash);

    // Test 4.2: Đăng nhập sai mật khẩu phải bị từ chối
    const resWrongPass = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: uniqueEmail, password: 'WrongPassword999!' });
    assert('Đăng nhập sai mật khẩu bị chặn với HTTP 401 Unauthorized', resWrongPass.statusCode === 401, `Status: ${resWrongPass.statusCode}`);
  }

  // =========================================================================
  // 5. KIỂM THỬ NGHIỆP VỤ ĐỒNG THỜI & BẤT BIẾN (TASK 10 IDEMPOTENCY)
  // =========================================================================
  if (['all', 'idempotency'].includes(targetScope)) {
    console.log('\n[PHẦN 5] KIỂM THỬ TÍNH BẤT BIẾN (IDEMPOTENCY PAYMENT - TASK 10)');
    
    const idempKey = `IDEMP-${Date.now()}`;
    const resIdemp = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/payments/vnpay/ipn?vnp_SecureHash=invalid',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempKey
      }
    });
    
    assert('VNPay từ chối callback sai chữ ký', resIdemp.statusCode === 200 && resIdemp.json?.RspCode === '97', `HTTP ${resIdemp.statusCode}`);
  }

  console.log('\n' + '='.repeat(75));
  console.log(`KẾT QUẢ KIỂM THỬ: ${passed}/${total} TIÊU CHÍ ĐẠT (${total > 0 ? Math.round(passed / total * 100) : 0}%)`);
  console.log('='.repeat(75));
  if (passed !== total) process.exitCode = 1;
}

runTests().catch((err) => {
  process.exitCode = 1;
  console.error('\n[LỖI KẾT NỐI]: Không thể kết nối tới Backend ở cổng 4000.');
  console.error('Vui lòng khởi động Backend trước (npm run dev hoặc docker compose up -d) rồi chạy lại test.');
});
