export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  timestamp: string;
  items: SaleItem[];
  totalAmount: number;
  itemCount: number;
}
