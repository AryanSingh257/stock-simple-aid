import { useState, useMemo } from "react";
import { Product, ProductFormData } from "@/types/product";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { SearchBar } from "@/components/SearchBar";
import { AddProductForm } from "@/components/AddProductForm";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { sortProducts, exportToCSV } from "@/utils/productHelpers";
import { Download } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [products, setProducts] = useLocalStorage<Product[]>("stockease-products", []);
  const [searchQuery, setSearchQuery] = useState("");

  const handleAddProduct = (productData: ProductFormData) => {
    const newProduct: Product = {
      ...productData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setProducts([...products, newProduct]);
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

  const handleExport = () => {
    if (products.length === 0) {
      toast.error("No products to export");
      return;
    }
    exportToCSV(products);
    toast.success("Inventory exported successfully");
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;
    
    if (searchQuery.trim()) {
      filtered = products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return sortProducts(filtered);
  }, [products, searchQuery]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">StockEase</h1>
          <p className="text-xl text-muted-foreground">Simple inventory for shopkeepers</p>
        </div>

        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        
        <AddProductForm onAdd={handleAddProduct} />

        {products.length > 0 && (
          <Button
            onClick={handleExport}
            variant="outline"
            size="lg"
            className="w-full h-14 mb-6 text-lg"
          >
            <Download className="h-5 w-5 mr-2" />
            Export to CSV
          </Button>
        )}

        <div className="space-y-4">
          {filteredAndSortedProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-2xl text-muted-foreground">
                {searchQuery ? "No products found" : "No products yet. Add your first product above!"}
              </p>
            </div>
          ) : (
            filteredAndSortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onUpdateQuantity={handleUpdateQuantity}
                onDelete={handleDeleteProduct}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
