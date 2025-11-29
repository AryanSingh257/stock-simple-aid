export type BatchStatus = "active" | "expiring_soon" | "out_of_stock" | "expired";

export interface Batch {
  id: string;
  quantity: number;
  duration: number;
  durationUnit: "days" | "weeks" | "months";
  expiryDate: string;
  costPrice?: number;
  status: BatchStatus;
  dateAdded: string;
}

export type BatchFormData = Omit<Batch, "id" | "status" | "dateAdded" | "expiryDate">;
