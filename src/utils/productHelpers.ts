import { Product } from "@/types/product";

// Check if total active batch quantity is low
export const isLowStock = (product: Product, threshold: number = 10): boolean => {
  if (!product.batches || product.batches.length === 0) {
    return product.quantity < threshold;
  }
  
  const totalActiveQty = product.batches
    .filter(b => b.status !== "expired")
    .reduce((sum, b) => sum + b.quantity, 0);
  
  return totalActiveQty < threshold;
};

// Check if ANY batch is expiring soon based on batch expiry dates
export const isExpiringSoon = (product: Product, daysThreshold: number = 14): boolean => {
  if (!product.batches || product.batches.length === 0) {
    if (!product.expiryDate) return false;
    const today = new Date();
    const expiry = new Date(product.expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= daysThreshold && diffDays >= 0;
  }
  
  const today = new Date();
  
  return product.batches.some(batch => {
    if (batch.status === "expired" || batch.quantity === 0) return false;
    const expiry = new Date(batch.expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= daysThreshold && diffDays >= 0;
  });
};

export const sortProducts = (products: Product[], lowStockThreshold: number = 10, expiryDays: number = 14): Product[] => {
  return [...products].sort((a, b) => {
    // Priority 1: Low stock items first
    const aLowStock = isLowStock(a, lowStockThreshold);
    const bLowStock = isLowStock(b, lowStockThreshold);
    if (aLowStock && !bLowStock) return -1;
    if (!aLowStock && bLowStock) return 1;
    
    // Priority 2: Expiring items next
    const aExpiring = isExpiringSoon(a, expiryDays);
    const bExpiring = isExpiringSoon(b, expiryDays);
    if (aExpiring && !bExpiring) return -1;
    if (!aExpiring && bExpiring) return 1;
    
    // Priority 3: Sort by expiry date if both have one
    if (a.expiryDate && b.expiryDate) {
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    }
    
    // Priority 4: Sort by quantity (lowest first)
    return a.quantity - b.quantity;
  });
};

export const exportToCSV = (products: Product[]): void => {
  const headers = ["Name", "Quantity", "Expiry Date", "Cost Price", "Selling Price"];
  const rows = products.map(p => [
    p.name,
    p.quantity.toString(),
    p.expiryDate || "",
    p.costPrice?.toString() || "",
    p.sellingPrice?.toString() || ""
  ]);
  
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `inventory_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
