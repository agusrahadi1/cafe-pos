export interface SavedCustomerOrder {
  orderId: string;
  orderNumber: string;
  tableToken?: string;
  tableNumber?: string | number | null;
  totalAmount?: number;
  status?: string;
  itemCount?: number;
  firstItemName?: string;
  createdAt: string;
}

const STORAGE_KEY = 'cafe_customer_my_orders';

export function getSavedCustomerOrders(): SavedCustomerOrder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Keep orders from last 48 hours only
    const cutoff = Date.now() - 48 * 60 * 60 * 1000;
    return parsed.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return !isNaN(t) && t > cutoff;
    });
  } catch {
    return [];
  }
}

export function saveCustomerOrder(order: {
  orderId: string;
  orderNumber: string;
  tableToken?: string;
  tableNumber?: string | number | null;
  totalAmount?: number;
  status?: string;
  itemCount?: number;
  firstItemName?: string;
}) {
  if (typeof window === 'undefined') return;
  try {
    const current = getSavedCustomerOrders();
    const filtered = current.filter((o) => o.orderId !== order.orderId);
    const updated: SavedCustomerOrder[] = [
      {
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        tableToken: order.tableToken || '',
        tableNumber: order.tableNumber,
        totalAmount: order.totalAmount,
        status: order.status || 'PENDING_PAYMENT',
        itemCount: order.itemCount,
        firstItemName: order.firstItemName,
        createdAt: new Date().toISOString(),
      },
      ...filtered,
    ].slice(0, 15);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save customer order locally:', e);
  }
}

export function updateSavedOrderStatus(orderId: string, status: string) {
  if (typeof window === 'undefined') return;
  try {
    const current = getSavedCustomerOrders();
    const updated = current.map((o) => (o.orderId === orderId ? { ...o, status } : o));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

