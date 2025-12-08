import { Batch } from "@/types/batch";
import { Product } from "@/types/product";

export const calculateBatchStatus = (
  quantity: number, 
  expiryDate: string,
  expiryThreshold: number = 14
): "active" | "out_of_stock" | "expired" | "expiring_soon" => {
  if (quantity === 0) return "out_of_stock";
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  
  if (expiry < today) return "expired";
  
  // Check if expiring soon
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= expiryThreshold) return "expiring_soon";
  
  return "active";
};

export const updateBatchStatuses = (batches: Batch[], expiryThreshold: number = 14): Batch[] => {
  return batches.map(batch => ({
    ...batch,
    status: calculateBatchStatus(batch.quantity, batch.expiryDate, expiryThreshold)
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
  const activeBatches = batches.filter(b => (b.status === "active" || b.status === "expiring_soon") && b.quantity > 0);
  if (activeBatches.length === 0) return undefined;
  
  return activeBatches.reduce((earliest, batch) => {
    return new Date(batch.expiryDate) < new Date(earliest) ? batch.expiryDate : earliest;
  }, activeBatches[0].expiryDate);
};

export const syncProductWithBatches = (product: Product, expiryThreshold: number = 14): Product => {
  if (!product.batches || product.batches.length === 0) {
    return product;
  }

  const updatedBatches = updateBatchStatuses(product.batches, expiryThreshold);
  const totalQuantity = getTotalQuantityFromBatches(updatedBatches);
  const earliestExpiry = getEarliestExpiryDate(updatedBatches);

  return {
    ...product,
    batches: updatedBatches,
    quantity: totalQuantity,
    expiryDate: earliestExpiry,
  };
};

// FEFO: First Expired First Out - Deduct from batches that expire soonest
export const deductFromBatches = (batches: Batch[], quantityToDeduct: number, expiryThreshold: number = 14): Batch[] => {
  if (quantityToDeduct <= 0) return batches;

  // Sort batches by expiry date (earliest first), exclude expired batches
  const sortedBatches = [...batches]
    .filter(b => b.status !== "expired" && b.quantity > 0)
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  let remaining = quantityToDeduct;
  const updatedBatches = [...batches];

  for (const batch of sortedBatches) {
    if (remaining <= 0) break;

    const batchIndex = updatedBatches.findIndex(b => b.id === batch.id);
    const currentQty = updatedBatches[batchIndex].quantity;

    if (currentQty >= remaining) {
      updatedBatches[batchIndex] = {
        ...updatedBatches[batchIndex],
        quantity: currentQty - remaining,
      };
      remaining = 0;
    } else {
      updatedBatches[batchIndex] = {
        ...updatedBatches[batchIndex],
        quantity: 0,
      };
      remaining -= currentQty;
    }
  }

  // Update statuses and filter out zero-quantity batches
  const batchesWithStatus = updateBatchStatuses(updatedBatches, expiryThreshold);
  return batchesWithStatus.filter(batch => batch.quantity > 0);
};
