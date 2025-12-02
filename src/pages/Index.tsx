import { useState, useMemo, useEffect } from "react";
import { Product, ProductFormData } from "@/types/product";
import { Category, CategoryFormData } from "@/types/category";
import { syncProductWithBatches } from "@/utils/batchHelpers";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useSettings } from "@/hooks/useSettings";
import { Navigation } from "@/components/Navigation";
import { SearchBar } from "@/components/SearchBar";
import { AddProductForm } from "@/components/AddProductForm";
import { AddCategoryForm } from "@/components/AddCategoryForm";
import { ProductCard } from "@/components/ProductCard";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { NearestExpiryCard } from "@/components/NearestExpiryCard";
import { Button } from "@/components/ui/button";
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

  const handleUpdateQuantity = (id: string, delta: number) => {
    setProducts(
      products.map((p) =>
        p.id === id ? { ...p, quantity: Math.max(0, p.quantity + delta) } : p
      )
    );
    toast.success(delta > 0 ? "Stock increased" : "Stock decreased");
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
    toast.success("Product deleted");
  };

  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    if (searchQuery.trim()) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return sortProducts(filtered, settings.lowStockThreshold, settings.expiryAlertDays);
  }, [products, searchQuery, settings.lowStockThreshold, settings.expiryAlertDays]);

  // Group products by category
  const groupedProducts = useMemo(() => {
    // If category grouping is disabled, return empty object
    if (!settings.categoryGrouping) {
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
  }, [filteredProducts, categories, settings.categoryGrouping]);

  const hasCategories = categories.length > 0 && settings.categoryGrouping;
  const categoryKeys = Object.keys(groupedProducts);

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 md:p-8 pb-16 md:pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2">inven3</h1>
          <p className="text-base md:text-xl text-muted-foreground">Simple inventory for shopkeepers</p>
        </div>

        <Navigation />

        <NearestExpiryCard products={products} />

        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        <div className="space-y-3 md:space-y-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 md:py-16">
              <p className="text-lg md:text-2xl text-muted-foreground px-4">
                {searchQuery ? "No products found" : "No products yet. Click the + button to add your first product!"}
              </p>
            </div>
          ) : hasCategories && categoryKeys.length > 0 ? (
            <Accordion type="single" collapsible className="space-y-3 md:space-y-4">
              {categoryKeys.map((categoryName) => (
                <AccordionItem key={categoryName} value={categoryName} className="border-2 rounded-lg">
                  <AccordionTrigger className="px-4 md:px-6 py-3 md:py-4 text-xl md:text-2xl font-bold hover:no-underline">
                    {categoryName} ({groupedProducts[categoryName].length})
                  </AccordionTrigger>
                  <AccordionContent className="px-3 md:px-4 pb-3 md:pb-4">
                    <div className="space-y-3 md:space-y-4">
                      {groupedProducts[categoryName].map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onUpdateQuantity={handleUpdateQuantity}
                          onDelete={handleDeleteProduct}
                          onUpdateProduct={handleUpdateProduct}
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
              <ProductCard
                key={product.id}
                product={product}
                onUpdateQuantity={handleUpdateQuantity}
                onDelete={handleDeleteProduct}
                onUpdateProduct={handleUpdateProduct}
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
