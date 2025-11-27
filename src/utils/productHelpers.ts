import { Product } from "@/types/product";

export const isLowStock = (quantity: number): boolean => {
  return quantity < 10;
};

export const isExpiringSoon = (expiryDate?: string): boolean => {
  if (!expiryDate) return false;
  
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays <= 3 && diffDays >= 0;
};

export const sortProducts = (products: Product[]): Product[] => {
  return [...products].sort((a, b) => {
    // Priority 1: Low stock items first
    const aLowStock = isLowStock(a.quantity);
    const bLowStock = isLowStock(b.quantity);
    if (aLowStock && !bLowStock) return -1;
    if (!aLowStock && bLowStock) return 1;
    
    // Priority 2: Expiring items next
    const aExpiring = isExpiringSoon(a.expiryDate);
    const bExpiring = isExpiringSoon(b.expiryDate);
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
