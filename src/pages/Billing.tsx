import { useState, useMemo } from "react";
import { Product } from "@/types/product";
import { Sale, SaleItem } from "@/types/sale";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Navigation } from "@/components/Navigation";
import { SearchBar } from "@/components/SearchBar";
import { BillItemModal } from "@/components/BillItemModal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

const Billing = () => {
  const [products, setProducts] = useLocalStorage<Product[]>("stockease-products", []);
  const [sales, setSales] = useLocalStorage<Sale[]>("stockease-sales", []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [billItems, setBillItems] = useState<SaleItem[]>([]);

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        p.quantity > 0 &&
        (p.sellingPrice || 0) > 0
    );
  }, [products, searchQuery]);

  const totalAmount = billItems.reduce((sum, item) => sum + item.subtotal, 0);
  const itemCount = billItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToBill = (productId: string, quantity: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const existingItem = billItems.find((item) => item.productId === productId);
    
    if (existingItem) {
      setBillItems(
        billItems.map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: item.quantity + quantity,
                subtotal: (item.quantity + quantity) * item.price,
              }
            : item
        )
      );
    } else {
      const newItem: SaleItem = {
        productId,
        name: product.name,
        quantity,
        price: product.sellingPrice || 0,
        subtotal: quantity * (product.sellingPrice || 0),
      };
      setBillItems([...billItems, newItem]);
    }
    
    toast.success("Item added to bill");
  };

  const handleRemoveFromBill = (productId: string) => {
    setBillItems(billItems.filter((item) => item.productId !== productId));
  };

  const handleConfirmSale = () => {
    if (billItems.length === 0) {
      toast.error("Bill is empty");
      return;
    }

    // Update stock
    const updatedProducts = products.map((product) => {
      const billItem = billItems.find((item) => item.productId === product.id);
      if (billItem) {
        const newQuantity = product.quantity - billItem.quantity;
        
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
        
        return { ...product, quantity: newQuantity };
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
    toast.success("Sale completed successfully");
  };

  const handleClearBill = () => {
    setBillItems([]);
    toast.info("Bill cleared");
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

        <div className="space-y-4 mb-8">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-2xl text-muted-foreground">
                {searchQuery ? "No products found" : "No products available for billing"}
              </p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-card border-2 border-border rounded-lg p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold mb-2">{product.name}</h3>
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
                <Button
                  onClick={() => setSelectedProduct(product)}
                  size="lg"
                  className="w-full h-14 text-xl"
                >
                  Add to Bill
                </Button>
              </div>
            ))
          )}
        </div>

        {billItems.length > 0 && (
          <div className="bg-card border-2 border-border rounded-lg p-6 sticky bottom-4">
            <h2 className="text-3xl font-bold mb-6">Bill Summary</h2>
            
            <div className="space-y-3 mb-6">
              {billItems.map((item) => (
                <div key={item.productId} className="flex justify-between items-center border-b pb-3">
                  <div className="flex-1">
                    <p className="text-lg font-semibold">{item.name}</p>
                    <p className="text-base text-muted-foreground">
                      {item.quantity} × ₹{item.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-xl font-semibold">₹{item.subtotal.toFixed(2)}</p>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveFromBill(item.productId)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
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
          </div>
        )}

        <BillItemModal
          product={selectedProduct}
          open={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={handleAddToBill}
        />
      </div>
    </div>
  );
};

export default Billing;
