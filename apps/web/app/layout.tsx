import './globals.css';
import { CartProvider } from '../features/task-05-gio-hang/NguCanhGioHang';
import { DangKyPwa } from '../features/dung-chung/DangKyPwa';

export const metadata = {
  title: 'BrewLite — Coffee, made easy',
  description: 'Đặt đồ uống yêu thích cùng BrewLite',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <DangKyPwa />
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
