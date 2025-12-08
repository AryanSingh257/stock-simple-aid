import { useState, useMemo, useEffect } from "react";
import { Product, ProductFormData } from "@/types/product";
import { Category, CategoryFormData } from "@/types/category";
import { Sale } from "@/types/sale";
import { Batch } from "@/types/batch";
import { syncProductWithBatches, deductFromBatches, calculateBatchStatus } from "@/utils/batchHelpers";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useSettings } from "@/hooks/useSettings";
import { Navigation } from "@/components/Navigation";
import { SearchBar } from "@/components/SearchBar";
import { AddProductForm } from "@/components/AddProductForm";
import { AddCategoryForm } from "@/components/AddCategoryForm";
import { StockProductCard } from "@/components/StockProductCard";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { NearestExpiryCard } from "@/components/NearestExpiryCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { sortProducts } from "@/utils/productHelpers";
import { toast } from "sonner";

const Index = () => {
  const [products, setProducts] = useLocalStorage<Product[]>("stockease-products", []);
  const [categories, setCategories] = useLocalStorage<Category[]>("stockease-categories", []);
  const [sales, setSales] = useLocalStorage<Sale[]>("stockease-sales", []);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const { settings } = useSettings();

  // Sync products with batches on mount and when settings change
  useEffect(() => {
    const syncedProducts = products.map(p => syncProductWithBatches(p, settings.expiryAlertDays));
    if (JSON.stringify(syncedProducts) !== JSON.stringify(products)) {
      setProducts(syncedProducts);
    }
  }, [settings.expiryAlertDays]);

  const handleAddProduct = (productData: ProductFormData) => {
    const newProduct: Product = {
      ...productData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setProducts([...products, newProduct]);
  };

  const handleAddCategory = (categoryData: CategoryFormData) => {
    const newCategory: Category = {
      ...categoryData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setCategories([...categories, newCategory]);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    const syncedProduct = syncProductWithBatches(updatedProduct, settings.expiryAlertDays);
    setProducts(products.map(p => p.id === syncedProduct.id ? syncedProduct : p));
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
    toast.success("Product deleted");
  };

  const calculateExpiryDate = (duration: number, unit: "days" | "weeks" | "months"): string => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    if (unit === "days") {
      date.setDate(date.getDate() + duration);
    } else if (unit === "weeks") {
      date.setDate(date.getDate() + (duration * 7));
    } else if (unit === "months") {
      date.setMonth(date.getMonth() + duration);
    }
    return date.toISOString();
  };

  const handleStockAdjust = (
    productId: string, 
    newQuantity: number, 
    reason: string,
    newBatchData?: { duration: number; durationUnit: "days" | "weeks" | "months" }
  ) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const difference = newQuantity - product.quantity;
    
    // Create adjustment record in sales history
    const adjustmentRecord: Sale = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      items: [{
        productId: product.id,
        name: product.name,
        quantity: Math.abs(difference),
        price: 0,
        subtotal: 0,
      }],
      totalAmount: 0,
      itemCount: Math.abs(difference),
      type: "adjustment",
      adjustmentReason: reason || "Manual adjustment",
    };
    
    setSales([adjustmentRecord, ...sales]);

    let updatedProduct: Product;

    if (product.batches && product.batches.length > 0) {
      if (difference < 0) {
        // Decreasing stock - use FEFO to deduct from earliest expiring batches
        // Keep batches with 0 quantity (don't filter them out)
        const updatedBatches = deductFromBatchesKeepZero(product.batches, Math.abs(difference), settings.expiryAlertDays);
        updatedProduct = syncProductWithBatches({
          ...product,
          batches: updatedBatches,
        }, settings.expiryAlertDays);
      } else if (difference > 0 && newBatchData) {
        // Increasing stock - create a new batch
        const expiryDate = calculateExpiryDate(newBatchData.duration, newBatchData.durationUnit);
        const newBatch: Batch = {
          id: crypto.randomUUID(),
          quantity: difference,
          duration: newBatchData.duration,
          durationUnit: newBatchData.durationUnit,
          expiryDate,
          costPrice: product.costPrice,
          status: calculateBatchStatus(difference, expiryDate, settings.expiryAlertDays),
          dateAdded: new Date().toISOString(),
        };
        updatedProduct = syncProductWithBatches({
          ...product,
          batches: [...product.batches, newBatch],
        }, settings.expiryAlertDays);
      } else {
        // No change or no batch data provided
        updatedProduct = product;
      }
    } else {
      // No batches exist
      if (difference > 0 && newBatchData) {
        // Create first batch
        const expiryDate = calculateExpiryDate(newBatchData.duration, newBatchData.durationUnit);
        const newBatch: Batch = {
          id: crypto.randomUUID(),
          quantity: difference,
          duration: newBatchData.duration,
          durationUnit: newBatchData.durationUnit,
          expiryDate,
          costPrice: product.costPrice,
          status: calculateBatchStatus(difference, expiryDate, settings.expiryAlertDays),
          dateAdded: new Date().toISOString(),
        };
        updatedProduct = syncProductWithBatches({
          ...product,
          batches: [newBatch],
        }, settings.expiryAlertDays);
      } else {
        // Just update quantity directly for products without batches
        updatedProduct = { ...product, quantity: newQuantity };
      }
    }

    setProducts(products.map(p => p.id === productId ? updatedProduct : p));
    toast.success(`Stock adjusted: ${difference > 0 ? '+' : ''}${difference} units`);
  };

  // FEFO deduction that keeps zero-quantity batches
  const deductFromBatchesKeepZero = (batches: Batch[], quantityToDeduct: number, expiryThreshold: number): Batch[] => {
    if (quantityToDeduct <= 0) return batches;

    // Sort batches by expiry date (earliest first), exclude expired batches from deduction
    const sortedBatchIds = [...batches]
      .filter(b => b.status !== "expired" && b.quantity > 0)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
      .map(b => b.id);

    let remaining = quantityToDeduct;
    const updatedBatches = batches.map(batch => {
      if (!sortedBatchIds.includes(batch.id) || remaining <= 0) {
        return {
          ...batch,
          status: calculateBatchStatus(batch.quantity, batch.expiryDate, expiryThreshold),
        };
      }

      const currentQty = batch.quantity;
      if (currentQty >= remaining) {
        const newQty = currentQty - remaining;
        remaining = 0;
        return {
          ...batch,
          quantity: newQty,
          status: calculateBatchStatus(newQty, batch.expiryDate, expiryThreshold),
        };
      } else {
        remaining -= currentQty;
        return {
          ...batch,
          quantity: 0,
          status: "out_of_stock" as const,
        };
      }
    });

    return updatedBatches;
  };

  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => {
        if (p.name.toLowerCase().includes(query)) return true;
        if (p.categoryId) {
          const category = categories.find(c => c.id === p.categoryId);
          if (category && category.name.toLowerCase().includes(query)) return true;
        }
        return false;
      });
    }
    
    return sortProducts(filtered, settings.lowStockThreshold, settings.expiryAlertDays);
  }, [products, searchQuery, categories, settings.lowStockThreshold, settings.expiryAlertDays]);

  // Group products by category
  const groupedProducts = useMemo(() => {
    if (!settings.categoryGrouping || searchQuery.trim()) {
      return {};
    }

    const groups: Record<string, Product[]> = {};
    
    filteredProducts.forEach((product) => {
      if (product.categoryId) {
        const category = categories.find(c => c.id === product.categoryId);
        const categoryName = category ? category.name : "No Category";
        if (!groups[categoryName]) {
          groups[categoryName] = [];
        }
        groups[categoryName].push(product);
      } else {
        if (!groups["No Category"]) {
          groups["No Category"] = [];
        }
        groups["No Category"].push(product);
      }
    });

    return groups;
  }, [filteredProducts, categories, settings.categoryGrouping, searchQuery]);

  const hasCategories = categories.length > 0 && settings.categoryGrouping && !searchQuery.trim();
  const categoryKeys = Object.keys(groupedProducts);

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="mb-3 sm:mb-4 md:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-4xl font-bold mb-0.5 md:mb-1">inven3</h1>
          <p className="text-xs sm:text-sm md:text-lg text-muted-foreground">Simple inventory for shopkeepers</p>
        </div>

        <Navigation />

        <NearestExpiryCard products={products} />

        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search products or categories..." />

        <div className="space-y-2.5 sm:space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-10 md:py-16">
              <p className="text-sm sm:text-base md:text-xl text-muted-foreground px-4">
                {searchQuery ? "No products found" : "No products yet. Click + to add your first product!"}
              </p>
            </div>
          ) : hasCategories && categoryKeys.length > 0 ? (
            <Accordion type="single" collapsible className="space-y-2.5">
              {categoryKeys.map((categoryName) => (
                <AccordionItem key={categoryName} value={categoryName} className="border-2 rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-3 sm:px-4 py-2.5 sm:py-3 text-base sm:text-lg md:text-xl font-bold hover:no-underline">
                    {categoryName} ({groupedProducts[categoryName].length})
                  </AccordionTrigger>
                  <AccordionContent className="px-2 sm:px-3 pb-2.5">
                    <div className="space-y-2.5">
                      {groupedProducts[categoryName].map((product) => (
                        <StockProductCard
                          key={product.id}
                          product={product}
                          onDelete={handleDeleteProduct}
                          onUpdateProduct={handleUpdateProduct}
                          onStockAdjust={handleStockAdjust}
                          categories={categories}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            filteredProducts.map((product) => (
              <StockProductCard
                key={product.id}
                product={product}
                onDelete={handleDeleteProduct}
                onUpdateProduct={handleUpdateProduct}
                onStockAdjust={handleStockAdjust}
                categories={categories}
              />
            ))
          )}
        </div>
      </div>

      <FloatingActionButton
        onAddProduct={() => setShowProductForm(true)}
        onAddCategory={() => setShowCategoryForm(true)}
      />

      <AddProductForm
        open={showProductForm}
        onOpenChange={setShowProductForm}
        onAdd={handleAddProduct}
        categories={categories}
      />

      <AddCategoryForm
        open={showCategoryForm}
        onOpenChange={setShowCategoryForm}
        onAdd={handleAddCategory}
      />
    </div>
  );
};

export default Index;
