import { useState, useMemo, useEffect } from "react";
import { Product, ProductFormData } from "@/types/product";
import { Category, CategoryFormData } from "@/types/category";
import { Sale } from "@/types/sale";
import { syncProductWithBatches, deductFromBatches } from "@/utils/batchHelpers";
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

  // Sync products with batches on mount and when products change
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
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
    toast.success("Product deleted");
  };

  const handleStockAdjust = (productId: string, newQuantity: number, reason: string) => {
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
      adjustmentReason: reason,
    };
    
    setSales([adjustmentRecord, ...sales]);

    // Update product quantity
    if (product.batches && product.batches.length > 0) {
      // If reducing stock, deduct from batches using FEFO
      if (difference < 0) {
        const updatedBatches = deductFromBatches(product.batches, Math.abs(difference), settings.expiryAlertDays);
        const updatedProduct = syncProductWithBatches({
          ...product,
          batches: updatedBatches,
        }, settings.expiryAlertDays);
        setProducts(products.map(p => p.id === productId ? updatedProduct : p));
      } else {
        // If increasing, add to first batch or create new batch
        const updatedBatches = [...product.batches];
        if (updatedBatches.length > 0) {
          updatedBatches[0] = {
            ...updatedBatches[0],
            quantity: updatedBatches[0].quantity + difference,
          };
        }
        const updatedProduct = syncProductWithBatches({
          ...product,
          batches: updatedBatches,
        }, settings.expiryAlertDays);
        setProducts(products.map(p => p.id === productId ? updatedProduct : p));
      }
    } else {
      // No batches, just update quantity directly
      setProducts(products.map(p => 
        p.id === productId ? { ...p, quantity: newQuantity } : p
      ));
    }

    toast.success(`Stock adjusted: ${difference > 0 ? '+' : ''}${difference} units`);
  };

  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => {
        // Search by product name
        if (p.name.toLowerCase().includes(query)) return true;
        // Search by category name
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
    // If category grouping is disabled or search is active, return empty object
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
    <div className="min-h-screen bg-background p-2 sm:p-4 md:p-8 pb-20 md:pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2">inven3</h1>
          <p className="text-sm sm:text-base md:text-xl text-muted-foreground">Simple inventory for shopkeepers</p>
        </div>

        <Navigation />

        <NearestExpiryCard products={products} />

        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search products or categories..." />

        <div className="space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 md:py-16">
              <p className="text-base sm:text-lg md:text-2xl text-muted-foreground px-4">
                {searchQuery ? "No products found" : "No products yet. Click the + button to add your first product!"}
              </p>
            </div>
          ) : hasCategories && categoryKeys.length > 0 ? (
            <Accordion type="single" collapsible className="space-y-3">
              {categoryKeys.map((categoryName) => (
                <AccordionItem key={categoryName} value={categoryName} className="border-2 rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-3 sm:px-4 md:px-6 py-3 text-lg sm:text-xl md:text-2xl font-bold hover:no-underline">
                    {categoryName} ({groupedProducts[categoryName].length})
                  </AccordionTrigger>
                  <AccordionContent className="px-2 sm:px-3 md:px-4 pb-3">
                    <div className="space-y-3">
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
