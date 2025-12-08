import { useState, useMemo } from "react";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { Sale, SaleItem } from "@/types/sale";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useSettings } from "@/hooks/useSettings";
import { deductFromBatches, syncProductWithBatches } from "@/utils/batchHelpers";
import { Navigation } from "@/components/Navigation";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { Receipt, Plus, Minus } from "lucide-react";

const Billing = () => {
  const [products, setProducts] = useLocalStorage<Product[]>("stockease-products", []);
  const [categories] = useLocalStorage<Category[]>("stockease-categories", []);
  const [sales, setSales] = useLocalStorage<Sale[]>("stockease-sales", []);
  const [searchQuery, setSearchQuery] = useState("");
  const [billItems, setBillItems] = useState<SaleItem[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { settings } = useSettings();

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        (p.name.toLowerCase().includes(searchQuery.toLowerCase())) &&
        p.quantity > 0 &&
        (p.sellingPrice || 0) > 0
    );
  }, [products, searchQuery]);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    
    filteredProducts.forEach((product) => {
      let categoryName = "No Category";
      
      if (product.categoryId) {
        const category = categories.find(c => c.id === product.categoryId);
        if (category) {
          categoryName = category.name;
        }
      }
      
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(product);
    });

    // Sort each category by purchase count (descending)
    Object.keys(groups).forEach((categoryName) => {
      groups[categoryName].sort((a, b) => {
        const countA = a.purchaseCount || 0;
        const countB = b.purchaseCount || 0;
        if (countB !== countA) {
          return countB - countA;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    });

    return groups;
  }, [filteredProducts, categories]);

  const totalAmount = billItems.reduce((sum, item) => sum + item.subtotal, 0);
  const itemCount = billItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleIncrease = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const existingItem = billItems.find((item) => item.productId === productId);
    
    if (existingItem) {
      if (existingItem.quantity >= product.quantity) {
        toast.error("Not enough stock");
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

  const handleConfirmSale = () => {
    if (billItems.length === 0) {
      toast.error("Bill is empty");
      return;
    }

    // Update stock using FEFO (First Expired First Out) logic
    const updatedProducts = products.map((product) => {
      const billItem = billItems.find((item) => item.productId === product.id);
      if (billItem && product.batches) {
        // Deduct from batches using FEFO
        const updatedBatches = deductFromBatches(product.batches, billItem.quantity, settings.expiryAlertDays);
        const updatedProduct = syncProductWithBatches({
          ...product,
          batches: updatedBatches,
          purchaseCount: (product.purchaseCount || 0) + billItem.quantity,
        }, settings.expiryAlertDays);
        
        // Show alerts
        if (updatedProduct.quantity < settings.lowStockThreshold && updatedProduct.quantity >= 0) {
          toast.warning(`Low stock: ${product.name} (${updatedProduct.quantity} left)`);
        }
        
        if (updatedProduct.expiryDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const expiry = new Date(updatedProduct.expiryDate);
          expiry.setHours(0, 0, 0, 0);
          const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= settings.expiryAlertDays && diffDays >= 0) {
            toast.warning(`Expiring soon: ${product.name} (${diffDays}d)`);
          }
        }
        
        return updatedProduct;
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
      type: "sale",
    };
    setSales([newSale, ...sales]);

    setBillItems([]);
    setIsSheetOpen(false);
    toast.success("Sale completed");
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

  const categoryKeys = Object.keys(groupedProducts);

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="mb-3 sm:mb-4 md:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-4xl font-bold mb-0.5 md:mb-1">Billing</h1>
          <p className="text-xs sm:text-sm md:text-lg text-muted-foreground">Select products and create bills</p>
        </div>

        <Navigation />
        
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search products..." />

        <div className="space-y-2.5 mb-20">
          {categoryKeys.length === 0 ? (
            <div className="text-center py-10 md:py-16">
              <p className="text-sm sm:text-base md:text-xl text-muted-foreground">
                {searchQuery ? "No products found" : "No products available for billing"}
              </p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-2.5">
              {categoryKeys.map((categoryName) => (
                <AccordionItem key={categoryName} value={categoryName} className="border-2 rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-3 sm:px-4 py-2.5 sm:py-3 text-base sm:text-lg md:text-xl font-bold hover:no-underline">
                    {categoryName} ({groupedProducts[categoryName].length})
                  </AccordionTrigger>
                  <AccordionContent className="px-2 sm:px-3 pb-2.5">
                    <div className="space-y-2.5">
                      {groupedProducts[categoryName].map((product) => {
                        const qtyInBill = getItemQuantity(product.id);
                        const isPurchased = (product.purchaseCount || 0) > 0;
                        return (
                          <div
                            key={product.id}
                            className={`bg-card border-2 border-border rounded-lg p-3 sm:p-4 ${isPurchased ? 'border-primary/30' : ''}`}
                          >
                            <div className="mb-3">
                              <h3 className="text-base sm:text-lg font-semibold mb-1 break-words leading-tight">
                                {product.name}
                                {isPurchased && (
                                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                                    ({product.purchaseCount} sold)
                                  </span>
                                )}
                              </h3>
                              <div className="flex gap-4 text-xs sm:text-sm">
                                <p>
                                  Price: <span className="font-semibold">₹{(product.sellingPrice || 0).toFixed(0)}</span>
                                </p>
                                <p>
                                  Stock: <span className="font-semibold">{product.quantity}</span>
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3">
                              <Button
                                onClick={() => handleDecrease(product.id)}
                                size="lg"
                                variant="destructive"
                                className="h-10 w-10 sm:h-12 sm:w-12 text-lg flex-shrink-0 p-0"
                                disabled={qtyInBill === 0}
                              >
                                <Minus className="h-4 w-4 sm:h-5 sm:w-5" />
                              </Button>
                              <div className="flex-1 text-center">
                                <p className="text-base sm:text-lg font-semibold">Qty: {qtyInBill}</p>
                              </div>
                              <Button
                                onClick={() => handleIncrease(product.id)}
                                size="lg"
                                className="h-10 w-10 sm:h-12 sm:w-12 text-lg flex-shrink-0 p-0"
                              >
                                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        {/* Floating total bar for mobile */}
        {billItems.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t-2 p-3 sm:p-4 z-40 flex items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-muted-foreground">{itemCount} items</p>
              <p className="text-lg sm:text-xl font-bold">₹{totalAmount.toFixed(0)}</p>
            </div>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button size="lg" className="h-11 sm:h-12 px-6 text-sm sm:text-base">
                  <Receipt className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  View Bill
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] p-3 sm:p-4 md:p-6">
                <SheetHeader>
                  <SheetTitle className="text-xl sm:text-2xl font-bold">Bill Summary</SheetTitle>
                </SheetHeader>
                
                <div className="mt-3 sm:mt-4 space-y-2 mb-3 max-h-[40vh] overflow-y-auto">
                  {billItems.map((item) => (
                    <div key={item.productId} className="flex justify-between items-center border-b pb-2 gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-medium truncate">{item.name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">Qty: {item.quantity} × ₹{item.price}</p>
                      </div>
                      <p className="text-sm sm:text-base font-semibold whitespace-nowrap">₹{item.subtotal.toFixed(0)}</p>
                    </div>
                  ))}
                </div>

                <div className="mb-4 pt-3 border-t-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-base sm:text-lg">Items:</span>
                    <span className="text-base sm:text-lg font-bold">{itemCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xl sm:text-2xl font-bold">Total:</span>
                    <span className="text-xl sm:text-2xl font-bold">₹{totalAmount.toFixed(0)}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleConfirmSale}
                    size="lg"
                    className="flex-1 h-12 sm:h-14 text-sm sm:text-base"
                  >
                    Confirm Sale
                  </Button>
                  <Button
                    onClick={handleClearBill}
                    variant="destructive"
                    size="lg"
                    className="flex-1 h-12 sm:h-14 text-sm sm:text-base"
                  >
                    Clear
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}
      </div>
    </div>
  );
};

export default Billing;