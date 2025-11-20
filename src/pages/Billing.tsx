import { useState, useMemo } from "react";
import { Product } from "@/types/product";
import { Sale, SaleItem } from "@/types/sale";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Navigation } from "@/components/Navigation";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Trash2, Receipt, Plus, Minus } from "lucide-react";

const Billing = () => {
  const [products, setProducts] = useLocalStorage<Product[]>("stockease-products", []);
  const [sales, setSales] = useLocalStorage<Sale[]>("stockease-sales", []);
  const [searchQuery, setSearchQuery] = useState("");
  const [billItems, setBillItems] = useState<SaleItem[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         (p.category?.toLowerCase() || "").includes(searchQuery.toLowerCase())) &&
        p.quantity > 0 &&
        (p.sellingPrice || 0) > 0
    );
  }, [products, searchQuery]);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    
    filteredProducts.forEach((product) => {
      const category = product.category || "Other";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(product);
    });

    // Sort each category by purchase count (descending), then by creation date
    Object.keys(groups).forEach((category) => {
      groups[category].sort((a, b) => {
        const countA = a.purchaseCount || 0;
        const countB = b.purchaseCount || 0;
        if (countB !== countA) {
          return countB - countA;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    });

    return groups;
  }, [filteredProducts]);

  const totalAmount = billItems.reduce((sum, item) => sum + item.subtotal, 0);
  const itemCount = billItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleIncrease = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const existingItem = billItems.find((item) => item.productId === productId);
    
    if (existingItem) {
      if (existingItem.quantity >= product.quantity) {
        toast.error("Not enough stock available");
        return;
      }
      setBillItems(
        billItems.map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.price,
              }
            : item
        )
      );
    } else {
      const newItem: SaleItem = {
        productId,
        name: product.name,
        quantity: 1,
        price: product.sellingPrice || 0,
        subtotal: product.sellingPrice || 0,
      };
      setBillItems([...billItems, newItem]);
    }
  };

  const handleDecrease = (productId: string) => {
    const existingItem = billItems.find((item) => item.productId === productId);
    if (!existingItem) return;

    if (existingItem.quantity === 1) {
      setBillItems(billItems.filter((item) => item.productId !== productId));
    } else {
      setBillItems(
        billItems.map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: item.quantity - 1,
                subtotal: (item.quantity - 1) * item.price,
              }
            : item
        )
      );
    }
  };

  const handleRemoveFromBill = (productId: string) => {
    setBillItems(billItems.filter((item) => item.productId !== productId));
  };

  const handleConfirmSale = () => {
    if (billItems.length === 0) {
      toast.error("Bill is empty");
      return;
    }

    // Update stock and purchase count
    const updatedProducts = products.map((product) => {
      const billItem = billItems.find((item) => item.productId === product.id);
      if (billItem) {
        const newQuantity = product.quantity - billItem.quantity;
        const newPurchaseCount = (product.purchaseCount || 0) + billItem.quantity;
        
        // Show alerts
        if (newQuantity < 10 && newQuantity >= 0) {
          toast.warning(`Low stock alert: ${product.name} (${newQuantity} left)`);
        }
        
        if (product.expiryDate) {
          const today = new Date();
          const expiry = new Date(product.expiryDate);
          const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 14 && diffDays >= 0) {
            toast.warning(`Near expiry: ${product.name} (${diffDays} days)`);
          }
        }
        
        return { ...product, quantity: newQuantity, purchaseCount: newPurchaseCount };
      }
      return product;
    });

    setProducts(updatedProducts);

    // Save sale
    const newSale: Sale = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      items: billItems,
      totalAmount,
      itemCount,
    };
    setSales([newSale, ...sales]);

    setBillItems([]);
    setIsSheetOpen(false);
    toast.success("Sale completed successfully");
  };

  const handleClearBill = () => {
    setBillItems([]);
    setIsSheetOpen(false);
    toast.info("Bill cleared");
  };

  const getItemQuantity = (productId: string): number => {
    const item = billItems.find((i) => i.productId === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Billing</h1>
          <p className="text-xl text-muted-foreground">Select products and create bills</p>
        </div>

        <Navigation />
        
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        <div className="space-y-8 mb-24">
          {Object.keys(groupedProducts).length === 0 ? (
            <div className="text-center py-16">
              <p className="text-2xl text-muted-foreground">
                {searchQuery ? "No products found" : "No products available for billing"}
              </p>
            </div>
          ) : (
            Object.entries(groupedProducts).map(([category, categoryProducts]) => (
              <div key={category} className="space-y-4">
                <h2 className="text-2xl font-bold border-b-2 pb-2">{category}</h2>
                {categoryProducts.map((product) => {
                  const qtyInBill = getItemQuantity(product.id);
                  const isPurchased = (product.purchaseCount || 0) > 0;
                  return (
                    <div
                      key={product.id}
                      className={`bg-card border-2 border-border rounded-lg p-6 transition-opacity ${
                        qtyInBill === 0 ? 'opacity-60' : 'opacity-100'
                      } ${isPurchased ? 'border-primary/30' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-2xl font-semibold mb-2">
                            {product.name}
                            {isPurchased && (
                              <span className="ml-3 text-sm font-normal text-muted-foreground">
                                ({product.purchaseCount} sold)
                              </span>
                            )}
                          </h3>
                          <div className="space-y-1">
                            <p className="text-lg">
                              Price: <span className="font-semibold">₹{(product.sellingPrice || 0).toFixed(2)}</span>
                            </p>
                            <p className="text-lg">
                              Stock: <span className="font-semibold">{product.quantity}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Button
                          onClick={() => handleDecrease(product.id)}
                          size="lg"
                          variant="destructive"
                          className="h-14 w-14 text-2xl"
                          disabled={qtyInBill === 0}
                        >
                          <Minus className="h-6 w-6" />
                        </Button>
                        <div className="flex-1 text-center">
                          <p className="text-xl font-semibold">Qty: {qtyInBill}</p>
                        </div>
                        <Button
                          onClick={() => handleIncrease(product.id)}
                          size="lg"
                          className="h-14 w-14 text-2xl"
                        >
                          <Plus className="h-6 w-6" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {billItems.length > 0 && (
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                size="lg"
                className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-lg z-50"
              >
                <Receipt className="h-8 w-8" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle className="text-3xl font-bold">Bill Summary</SheetTitle>
              </SheetHeader>
              
              <div className="mt-6 space-y-3 mb-6 max-h-[40vh] overflow-y-auto">
                {billItems.map((item) => (
                  <div key={item.productId} className="flex justify-between items-center border-b pb-3">
                    <p className="text-lg">
                      {item.name} — Qty: {item.quantity} — ₹{item.subtotal.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mb-6 pt-4 border-t-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl">Items:</span>
                  <span className="text-2xl font-bold">{itemCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-3xl font-bold">Total:</span>
                  <span className="text-3xl font-bold">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleConfirmSale}
                  size="lg"
                  className="flex-1 h-16 text-xl"
                >
                  Confirm Sale
                </Button>
                <Button
                  onClick={handleClearBill}
                  variant="destructive"
                  size="lg"
                  className="flex-1 h-16 text-xl"
                >
                  Clear Bill
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>
  );
};

export default Billing;
