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

    // Sort each category by purchase count (descending), then by creation date
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
          toast.warning(`Low stock alert: ${product.name} (${updatedProduct.quantity} left)`);
        }
        
        if (updatedProduct.expiryDate) {
          const today = new Date();
          const expiry = new Date(updatedProduct.expiryDate);
          const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= settings.expiryAlertDays && diffDays >= 0) {
            toast.warning(`Near expiry: ${product.name} (${diffDays} days)`);
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

  const categoryKeys = Object.keys(groupedProducts);

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Billing</h1>
          <p className="text-lg md:text-xl text-muted-foreground">Select products and create bills</p>
        </div>

        <Navigation />
        
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        <div className="space-y-3 md:space-y-4 mb-20 md:mb-24">
          {categoryKeys.length === 0 ? (
            <div className="text-center py-12 md:py-16">
              <p className="text-xl md:text-2xl text-muted-foreground">
                {searchQuery ? "No products found" : "No products available for billing"}
              </p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-3 md:space-y-4">
              {categoryKeys.map((categoryName) => (
                <AccordionItem key={categoryName} value={categoryName} className="border-2 rounded-lg">
                  <AccordionTrigger className="px-4 md:px-6 py-3 md:py-4 text-xl md:text-2xl font-bold hover:no-underline">
                    {categoryName} ({groupedProducts[categoryName].length})
                  </AccordionTrigger>
                  <AccordionContent className="px-3 md:px-4 pb-3 md:pb-4">
                    <div className="space-y-3 md:space-y-4">
                      {groupedProducts[categoryName].map((product) => {
                        const qtyInBill = getItemQuantity(product.id);
                        const isPurchased = (product.purchaseCount || 0) > 0;
                        return (
                          <div
                            key={product.id}
                            className={`bg-card border-2 border-border rounded-lg p-4 md:p-6 ${isPurchased ? 'border-primary/30' : ''}`}
                          >
                            <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-3">
                              <div className="flex-1 w-full">
                                <h3 className="text-xl md:text-2xl font-semibold mb-2 break-words">
                                  {product.name}
                                  {isPurchased && (
                                    <span className="ml-2 md:ml-3 text-sm font-normal text-muted-foreground block sm:inline mt-1 sm:mt-0">
                                      ({product.purchaseCount} sold)
                                    </span>
                                  )}
                                </h3>
                                <div className="space-y-1">
                                  <p className="text-base md:text-lg">
                                    Price: <span className="font-semibold">₹{(product.sellingPrice || 0).toFixed(2)}</span>
                                  </p>
                                  <p className="text-base md:text-lg">
                                    Stock: <span className="font-semibold">{product.quantity}</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 md:gap-4">
                              <Button
                                onClick={() => handleDecrease(product.id)}
                                size="lg"
                                variant="destructive"
                                className="h-12 w-12 md:h-14 md:w-14 text-xl md:text-2xl flex-shrink-0"
                                disabled={qtyInBill === 0}
                              >
                                <Minus className="h-5 w-5 md:h-6 md:w-6" />
                              </Button>
                              <div className="flex-1 text-center">
                                <p className="text-lg md:text-xl font-semibold">Qty: {qtyInBill}</p>
                              </div>
                              <Button
                                onClick={() => handleIncrease(product.id)}
                                size="lg"
                                className="h-12 w-12 md:h-14 md:w-14 text-xl md:text-2xl flex-shrink-0"
                              >
                                <Plus className="h-5 w-5 md:h-6 md:w-6" />
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

        {billItems.length > 0 && (
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                size="lg"
                className="fixed bottom-6 right-4 md:bottom-8 md:right-8 h-14 w-14 md:h-16 md:w-16 rounded-full shadow-lg z-50"
              >
                <Receipt className="h-6 w-6 md:h-8 md:w-8" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] md:h-[80vh] p-4 md:p-6">
              <SheetHeader>
                <SheetTitle className="text-2xl md:text-3xl font-bold">Bill Summary</SheetTitle>
              </SheetHeader>
              
              <div className="mt-4 md:mt-6 space-y-2 md:space-y-3 mb-4 md:mb-6 max-h-[45vh] md:max-h-[40vh] overflow-y-auto">
                {billItems.map((item) => (
                  <div key={item.productId} className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b pb-2 md:pb-3 gap-1">
                    <p className="text-base md:text-lg break-words">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground"> — Qty: {item.quantity}</span>
                    </p>
                    <p className="text-base md:text-lg font-semibold">₹{item.subtotal.toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="mb-4 md:mb-6 pt-3 md:pt-4 border-t-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xl md:text-2xl">Items:</span>
                  <span className="text-xl md:text-2xl font-bold">{itemCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-2xl md:text-3xl font-bold">Total:</span>
                  <span className="text-2xl md:text-3xl font-bold">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleConfirmSale}
                  size="lg"
                  className="flex-1 h-14 md:h-16 text-lg md:text-xl"
                >
                  Confirm Sale
                </Button>
                <Button
                  onClick={handleClearBill}
                  variant="destructive"
                  size="lg"
                  className="flex-1 h-14 md:h-16 text-lg md:text-xl"
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
