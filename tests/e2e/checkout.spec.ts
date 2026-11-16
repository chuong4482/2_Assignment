import { test, expect } from '@playwright/test';
import { createHmac, randomUUID } from 'node:crypto';

test('E2E-T01 real UI menu → cart → VNPay redirect → signed test IPN → confirmation', async ({ page, request }) => {
  test.skip(!process.env.VNPAY_HASH_SECRET, 'Requires dedicated local test signing key; never use production secrets.');
  const api=process.env.TEST_API_URL || 'http://localhost:4000';
  const email=`e2e-${randomUUID()}@example.test`;
  const auth=await request.post(api+'/auth/register',{data:{email,password:'TestPass123!',fullName:'E2E Customer'}});
  expect(auth.status()).toBe(201);
  page.on('dialog',dialog=>dialog.accept());
  await page.goto('/');
  await page.getByRole('button',{name:'Đăng nhập',exact:true}).first().click();
  await page.getByPlaceholder('Email của bạn').fill(email);
  await page.getByPlaceholder('Mật khẩu', {exact:true}).fill('TestPass123!');
  await page.locator('form').getByRole('button',{name:'Đăng nhập',exact:true}).click();
  await expect(page.locator('.modal-overlay')).toHaveCount(0);
  await page.locator('article').first().click();
  await page.getByRole('button',{name:/Thêm vào giỏ/}).click();
  await page.getByRole('button',{name:'Giỏ hàng',exact:true}).first().click();
  await page.getByRole('button',{name:/Thanh toán/}).last().click();
  let order: {id:string;total:number}|undefined;
  page.on('response',async res=>{ if(res.url()===api+'/orders' && res.request().method()==='POST' && res.status()===201) order=await res.json(); });
  // Prevent calling the external gateway in automated tests. No product mock payment is enabled.
  await page.route('https://sandbox.vnpayment.vn/**',route=>route.fulfill({contentType:'text/html',body:'<h1>VNPay redirect boundary reached</h1>'}));
  await page.getByRole('button',{name:/Xác nhận trả/}).click();
  await expect(page).toHaveURL(/sandbox\.vnpayment\.vn/);
  expect(order).toBeDefined();
  const params={vnp_TxnRef:order!.id,vnp_Amount:String(order!.total*100),vnp_ResponseCode:'00',vnp_TransactionStatus:'00',vnp_TransactionNo:randomUUID()};
  const query=new URLSearchParams(Object.entries(params).sort(([a],[b])=>a.localeCompare(b)));
  query.set('vnp_SecureHash',createHmac('sha512',process.env.VNPAY_HASH_SECRET!).update(query.toString()).digest('hex'));
  expect((await (await request.get(api+'/payments/vnpay/ipn?'+query)).json()).RspCode).toBe('00');
  await page.goto('/orders?vnpay=success&code=00&orderId='+order!.id);
  await expect(page.getByText(/Đã thanh toán|Chờ pha chế/).first()).toBeVisible();
  await expect(page.getByText(/Thanh toán VNPay Sandbox thành công/)).toBeVisible();
});

test('WEB-T01 menu shows empty and error responses',async({page})=>{
  await page.route('**/products',route=>route.fulfill({json:[]}));
  await page.goto('/');
  await expect(page.getByText(/Hiện tại cửa hàng chưa có món/)).toBeVisible();
  await page.route('**/products',route=>route.fulfill({status:503,json:{message:'Unavailable'}}));
  await page.reload();
  await expect(page.getByRole('alert').filter({hasText:'Không thể tải danh sách thực đơn'})).toBeVisible();
  await expect(page.getByRole('button',{name:/Thử lại/})).toBeVisible();
});

test('VNPay error preserves cart and stays on checkout instead of opening a missing page', async ({ page, request }) => {
  const api=process.env.TEST_API_URL || 'http://localhost:4100';
  const email=`vnpay-error-${randomUUID()}@example.test`;
  expect((await request.post(api+'/auth/register',{data:{email,password:'TestPass123!'}})).status()).toBe(201);
  const messages: string[]=[];
  page.on('dialog',async dialog=>{messages.push(dialog.message());await dialog.accept();});
  await page.goto('/');
  await page.getByRole('button',{name:'Đăng nhập',exact:true}).first().click();
  await page.getByPlaceholder('Email của bạn').fill(email);
  await page.getByPlaceholder('Mật khẩu',{exact:true}).fill('TestPass123!');
  await page.locator('form').getByRole('button',{name:'Đăng nhập',exact:true}).click();
  await expect(page.locator('.modal-overlay')).toHaveCount(0);
  await page.locator('article').first().click();
  await page.getByRole('button',{name:/Thêm vào giỏ/}).click();
  await page.getByRole('button',{name:'Giỏ hàng',exact:true}).first().click();
  await page.getByRole('button',{name:/Thanh toán/}).last().click();
  await page.route('**/orders/*/retry-payment',route=>route.fulfill({status:400,json:{message:'VNPay chưa được cấu hình'}}));
  await page.getByRole('button',{name:/Xác nhận trả/}).click();
  await expect.poll(()=>messages.join(' ')).toContain('VNPay chưa được cấu hình');
  await expect(page).toHaveURL('http://localhost:3100/');
  await expect(page.getByRole('button',{name:/Xác nhận trả/})).toBeVisible();
  await expect(page.getByText(/Giỏ hàng trống/)).toHaveCount(0);
});

test('success URL alone cannot confirm an unpaid order or clear its cart', async ({page,request})=>{
  const api=process.env.TEST_API_URL || 'http://localhost:4100';
  const email=`return-check-${randomUUID()}@example.test`;
  const auth=await (await request.post(api+'/auth/register',{data:{email,password:'TestPass123!'}})).json();
  const headers={Authorization:`Bearer ${auth.accessToken}`};
  const product=(await (await request.get(api+'/products')).json()).find((p:{available:boolean})=>p.available);
  const item={productId:product.id,size:'M',toppings:[],qty:1};
  expect((await request.post(api+'/cart/items',{headers,data:item})).status()).toBe(201);
  const order=await (await request.post(api+'/orders',{headers,data:{items:[item],paymentMethod:'VNPay'}})).json();
  await page.addInitScript(({token,email})=>{
    localStorage.setItem('brewlite-token',token);
    localStorage.setItem('brewlite-email',email);
  },{token:auth.accessToken,email});
  await page.goto('/orders?vnpay=success&code=00&orderId='+order.id);
  await expect(page.getByText(/Chưa xác nhận thanh toán/)).toBeVisible();
  await expect(page.getByText(/Thanh toán VNPay Sandbox thành công/)).toHaveCount(0);
  const cart=await (await request.get(api+'/cart',{headers})).json();
  expect(cart.items).toHaveLength(1);
});
