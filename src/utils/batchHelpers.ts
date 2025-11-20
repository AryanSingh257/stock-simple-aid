import { Batch } from "@/types/batch";
import { Product } from "@/types/product";

export const calculateBatchStatus = (quantity: number, expiryDate: string): "active" | "out_of_stock" | "expired" => {
  if (quantity === 0) return "out_of_stock";
  
  const today = new Date();
  const expiry = new Date(expiryDate);
  
  if (expiry < today) return "expired";
  
  return "active";
};

export const updateBatchStatuses = (batches: Batch[]): Batch[] => {
  return batches.map(batch => ({
    ...batch,
    status: calculateBatchStatus(batch.quantity, batch.expiryDate)
  }));
};

export const getTotalQuantityFromBatches = (batches: Batch[]): number => {
  return batches.reduce((total, batch) => {
    // Only count active and expiring batches, not expired ones
    if (batch.status !== "expired") {
      return total + batch.quantity;
    }
    return total;
  }, 0);
};

export const getEarliestExpiryDate = (batches: Batch[]): string | undefined => {
  const activeBatches = batches.filter(b => b.status === "active" && b.quantity > 0);
  if (activeBatches.length === 0) return undefined;
  
  return activeBatches.reduce((earliest, batch) => {
    return new Date(batch.expiryDate) < new Date(earliest) ? batch.expiryDate : earliest;
  }, activeBatches[0].expiryDate);
};

export const syncProductWithBatches = (product: Product): Product => {
  if (!product.batches || product.batches.length === 0) {
    return product;
  }

  const updatedBatches = updateBatchStatuses(product.batches);
  const totalQuantity = getTotalQuantityFromBatches(updatedBatches);
  const earliestExpiry = getEarliestExpiryDate(updatedBatches);

  return {
    ...product,
    batches: updatedBatches,
    quantity: totalQuantity,
    expiryDate: earliestExpiry,
  };
};
