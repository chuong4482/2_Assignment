export function rutGonThongBaoNguyenLieu(message: string | string[]): string {
  const text = Array.isArray(message) ? message.join(', ') : message;
  return text.includes('Không đủ nguyên liệu') ? 'Không đủ nguyên liệu' : text;
}
