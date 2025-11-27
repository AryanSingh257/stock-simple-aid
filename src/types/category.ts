export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export type CategoryFormData = Omit<Category, "id" | "createdAt">;
