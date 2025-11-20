import { Batch } from "./batch";

export interface Product {
  id: string;
  name: string;
  quantity: number;
  expiryDate?: string;
  category?: "Grocery" | "Medicine" | "Stationery" | "Other";
  costPrice?: number;
  sellingPrice?: number;
  purchaseCount?: number;
  createdAt: string;
  batches?: Batch[];
}

export type ProductFormData = Omit<Product, "id" | "createdAt">;
