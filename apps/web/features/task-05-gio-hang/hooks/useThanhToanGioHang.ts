import { useState } from 'react';
import type { CartItem, PromotionItem } from '../../dung-chung/kieu-du-lieu-chung';
import { API } from '../../dung-chung/cau-hinh-api';
import { displayOrderCode } from '../../dung-chung/ma-don-hang';
import type { PaymentMethodType } from '../BoChonPhuongThucThanhToan';
import { rutGonThongBaoNguyenLieu } from '../thong-bao-gio-hang';

export interface ConfirmationResult {
  success: boolean;
  orderId: string;
  orderCode?: string;
  status: string;
  total: number;
  method: string;
  message?: string;
}

export interface UseCartCheckoutProps {
  token: string;
  cart: CartItem[];
  voucher: string;
  voucherApplied: boolean;
  selectedPromo: PromotionItem | null;
  usePoints?: boolean;
  actualPointsUsed?: number;
  onCheckoutSuccess?: (data: any) => void;
  setCart: (c: CartItem[]) => void;
  clearCart?: () => void;
  setModal: (m: string) => void;
  setAuthError: (e: string) => void;
  loadCartFromDatabase: () => Promise<void>;
  cartOverStockInfo?: { id?: string; name: string; totalQty: number; liveStock: number }[];
  inventoryError?: string | null;
  setInventoryError?: (err: string | null) => void;
  validateCartInventory?: (customCart?: CartItem[]) => Promise<boolean>;
}

export function useCartCheckout({
  token,
  cart,
  voucher,
  voucherApplied,
  selectedPromo,
  usePoints,
  actualPointsUsed,
  onCheckoutSuccess,
  setCart,
  clearCart,
  setModal,
  setAuthError,
  loadCartFromDatabase,
  cartOverStockInfo,
  inventoryError,
  setInventoryError,
  validateCartInventory,
}: UseCartCheckoutProps) {
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'confirmation'>('cart');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>('VNPay');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [vnpayStatus, setVnpayStatus] = useState<string>('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [currentOrderCode, setCurrentOrderCode] = useState<string | null>(null);

  // Bước 3 -> Bước 4: Chuyển từ giỏ hàng sang màn hình thanh toán
  async function handleProceedToCheckout(): Promise<void> {
    if (cart.length === 0) {
      alert('Giỏ hàng của bạn đang trống! Vui lòng chọn món trước khi thanh toán.');
      return;
    }

    if (!token) {
      setModal('login');
      setAuthError('Vui lòng đăng nhập tài khoản trước khi thanh toán đơn hàng.');
      return;
    }

    if (cartOverStockInfo && cartOverStockInfo.length > 0) {
      alert('⚠️ Một số sản phẩm trong giỏ đã hết hàng hoặc vượt tồn kho! Vui lòng điều chỉnh lại giỏ hàng.');
      return;
    }

    if (inventoryError) {
      alert(rutGonThongBaoNguyenLieu(`⚠️ ${inventoryError}\nVui lòng giảm bớt số lượng món để có thể tiếp tục thanh toán.`));
      return;
    }

    if (validateCartInventory) {
      const isOk = await validateCartInventory(cart);
      if (!isOk) {
        alert('⚠️ Nguyên liệu trong kho không đủ để pha chế số lượng món này. Vui lòng kiểm tra lại giỏ hàng!');
        return;
      }
    }

    setCurrentOrderId(null);
    setCurrentOrderCode(null);
    setCheckoutStep('checkout');
  }

  // Bước 4 -> Bước 5: Xác nhận trả tiền (Ví / Thẻ / VNPay)
  async function handleConfirmPayment() {
    if (cart.length === 0) {
      alert('Giỏ hàng trống!');
      setCheckoutStep('cart');
      return;
    }

    if (!token) {
      setModal('login');
      setAuthError('Vui lòng đăng nhập tài khoản trước khi thanh toán đơn hàng.');
      return;
    }

    setIsProcessingPayment(true);
    setVnpayStatus('redirecting');

    try {
      const promoCode = voucherApplied ? (selectedPromo ? selectedPromo.code : voucher) : undefined;
      const pointsUsedToSend = usePoints && actualPointsUsed && actualPointsUsed > 0 ? actualPointsUsed : undefined;

      let orderId = currentOrderId;

      // 1. Chỉ tạo đơn hàng PENDING mới nếu chưa có đơn hàng cho phiên checkout này
      if (!orderId) {
        const itemsToSend = cart.map((item) => ({
          productId: item.product.id,
          size: item.size || 'M',
          toppings: item.toppings || [],
          qty: item.qty,
        }));

        const orderRes = await fetch(`${API}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            items: itemsToSend,
            promotionCode: promoCode,
            pointsUsed: pointsUsedToSend,
            paymentMethod: selectedPaymentMethod,
          }),
        });

        if (!orderRes.ok) {
          setIsProcessingPayment(false);
          setVnpayStatus('');
          const err = await orderRes.json().catch(() => ({}));
          if (orderRes.status === 409) {
            const msg = err.message || 'Sản phẩm trong giỏ đã hết hàng hoặc tồn kho vừa thay đổi!';
            if (setInventoryError) setInventoryError(rutGonThongBaoNguyenLieu(msg));
            alert(rutGonThongBaoNguyenLieu(`⚠️ ${msg}\nVui lòng kiểm tra lại giỏ hàng.`));
          } else {
            alert(rutGonThongBaoNguyenLieu(`⚠️ ${err.message || 'Không thể tạo đơn hàng, vui lòng thử lại sau.'}`));
          }
          await loadCartFromDatabase();
          if (validateCartInventory) void validateCartInventory();
          setCheckoutStep('cart');
          return;
        }

        const createdOrderData = await orderRes.json();
        const orderObj = createdOrderData.order || createdOrderData;
        orderId = orderObj.id || createdOrderData.orderId;
        const resolvedCode = displayOrderCode({ id: orderId, code: orderObj.code });
        setCurrentOrderCode(resolvedCode);
        setCurrentOrderId(orderId);
      }

      const response = await fetch(`${API}/orders/${orderId}/retry-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ method: 'VNPay' }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        throw new Error(message || 'Không thể tạo liên kết thanh toán VNPay. Vui lòng thử lại.');
      }
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      if (data.success && data.order?.status === 'PAID' && data.order.total === 0) {
        void fetch(`${API}/cart`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
        if (clearCart) clearCart(); else setCart([]);
        setCurrentOrderId(null);
        onCheckoutSuccess?.(data.order);
        setConfirmationResult({
          success: true, orderId, orderCode: displayOrderCode(data.order),
          status: 'PAID', total: 0, method: 'VNPay',
          message: 'Đơn hàng 0đ đã được xác nhận thành công.',
        });
        setCheckoutStep('confirmation');
        return;
      }
      throw new Error('VNPay chưa trả về liên kết thanh toán. Vui lòng thử lại.');
    } catch (err: any) {
      console.error('Lỗi khi thực hiện thanh toán:', err);
      alert(rutGonThongBaoNguyenLieu(err?.message || 'Đã xảy ra lỗi kết nối khi đặt hàng. Giỏ hàng của bạn được giữ nguyên.'));
    } finally {
      setIsProcessingPayment(false);
      setVnpayStatus('');
    }
  }

  function handleRetryPayment() {
    setCheckoutStep('checkout');
  }

  function resetCheckout() {
    setCheckoutStep('cart');
    setConfirmationResult(null);
    setCurrentOrderId(null);
    setCurrentOrderCode(null);
    setIsProcessingPayment(false);
  }

  const tienHanhDatHang = handleProceedToCheckout;
  const xacNhanThanhToan = handleConfirmPayment;
  const thuLaiThanhToan = handleRetryPayment;
  const datLaiTrangThaiThanhToan = resetCheckout;

  return {
    checkoutStep,
    setCheckoutStep,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    isProcessingPayment,
    vnpayStatus,
    confirmationResult,
    handleProceedToCheckout,
    tienHanhDatHang,
    handleConfirmPayment,
    xacNhanThanhToan,
    handleRetryPayment,
    thuLaiThanhToan,
    resetCheckout,
    datLaiTrangThaiThanhToan,
    // Alias tương thích cũ
    handleCheckout: handleProceedToCheckout,
  };
}
