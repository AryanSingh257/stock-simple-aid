import { Batch } from "./batch";

export interface Product {
  id: string;
  name: string;
  quantity: number;
  expiryDate?: string;
  categoryId?: string;
  costPrice?: number;
  sellingPrice?: number;
  purchaseCount?: number;
  createdAt: string;
  batches?: Batch[];
  duration?: number;
  durationUnit?: "days" | "weeks" | "months";
}

export type ProductFormData = Omit<Product, "id" | "createdAt">;
