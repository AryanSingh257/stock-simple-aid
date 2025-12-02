import { useState } from "react";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { Batch } from "@/types/batch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Minus, Plus, Settings2, ChevronDown, ChevronUp } from "lucide-react";
import { isLowStock, isExpiringSoon } from "@/utils/productHelpers";
import { useSettings } from "@/hooks/useSettings";
import { BatchManagement } from "./BatchManagement";
import { EditProductForm } from "./EditProductForm";
import { syncProductWithBatches } from "@/utils/batchHelpers";

interface ProductCardProps {
  product: Product;
  onUpdateQuantity: (id: string, delta: number) => void;
  onDelete: (id: string) => void;
  onUpdateProduct: (product: Product) => void;
  categories?: Category[];
}

export const ProductCard = ({ 
  product, 
  onUpdateQuantity, 
  onDelete, 
  onUpdateProduct,
  categories = [],
}: ProductCardProps) => {
  const [showBatches, setShowBatches] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const { settings } = useSettings();
  const lowStock = isLowStock(product.quantity, settings.lowStockThreshold);
  const expiring = isExpiringSoon(product.expiryDate, settings.expiryAlertDays);
  const isZeroQuantity = product.quantity === 0;
  
  const cardClass = lowStock 
    ? "bg-low-stock border-low-stock-border border-2" 
    : expiring 
    ? "bg-expiring border-expiring-border border-2"
    : "border-2";

  const textStyle = isZeroQuantity ? "text-red-600" : "";

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleAddBatch = (batch: Batch) => {
    const updatedProduct = {
      ...product,
      batches: [...(product.batches || []), batch],
    };
    const syncedProduct = syncProductWithBatches(updatedProduct, settings.expiryAlertDays);
    onUpdateProduct(syncedProduct);
  };

  const handleUpdateBatch = (updatedBatch: Batch) => {
    const updatedProduct = {
      ...product,
      batches: (product.batches || []).map(b => b.id === updatedBatch.id ? updatedBatch : b),
    };
    const syncedProduct = syncProductWithBatches(updatedProduct, settings.expiryAlertDays);
    onUpdateProduct(syncedProduct);
  };

  const getDaysUntilExpiry = (dateString?: string) => {
    if (!dateString) return null;
    const today = new Date();
    const expiry = new Date(dateString);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const nearestExpiryDays = product.expiryDate ? getDaysUntilExpiry(product.expiryDate) : null;

  return (
    <>
      <Card className={`p-3 md:p-6 relative ${cardClass}`}>
        <Button
          onClick={() => setShowEditForm(true)}
          variant="ghost"
          size="sm"
          className="absolute top-1 right-1 md:top-2 md:right-2 h-7 w-7 md:h-8 md:w-8 p-0"
        >
          <Settings2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
        </Button>

        <div className="space-y-2 md:space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2 md:gap-4">
            <div className="flex-1 min-w-0 pr-6 md:pr-8 w-full">
              <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                <h3 className={`text-lg md:text-2xl font-bold break-words ${textStyle}`}>{product.name}</h3>
              {product.batches && product.batches.length > 0 && (
                <span className="px-1.5 py-0.5 md:px-2 md:py-1 bg-primary/10 text-primary text-xs md:text-sm font-medium rounded">
                  {product.batches.length} {product.batches.length === 1 ? 'batch' : 'batches'}
                </span>
              )}
            </div>
            {!showBatches && product.batches && product.batches.length > 0 && nearestExpiryDays !== null && (
              <div className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">
                Next expiry: {nearestExpiryDays > 0 ? `${nearestExpiryDays} days` : 'Today'}
              </div>
            )}
          </div>
          <div className="text-left sm:text-right">
            <div className={`text-xl md:text-3xl font-bold ${textStyle}`}>{product.quantity}</div>
            <div className="text-xs md:text-sm text-muted-foreground">in stock</div>
            {isZeroQuantity && (
              <div className="text-xs md:text-sm text-red-600 font-semibold mt-0.5 md:mt-1">
                ⚠️ Needs Restock
              </div>
            )}
          </div>
        </div>


        {product.expiryDate && (
          <div className="text-xs md:text-base">
            <span className="text-muted-foreground">Earliest Expiry: </span>
            <span className="font-medium">{formatDate(product.expiryDate)}</span>
          </div>
        )}

        {(product.costPrice || product.sellingPrice) && (
          <div className="flex flex-col sm:flex-row gap-2 md:gap-6 text-xs md:text-base">
            {product.costPrice && (
              <div>
                <span className="text-muted-foreground">Cost: </span>
                <span className="font-medium">₹{product.costPrice}</span>
              </div>
            )}
            {product.sellingPrice && (
              <div>
                <span className="text-muted-foreground">Selling: </span>
                <span className="font-medium">₹{product.sellingPrice}</span>
              </div>
            )}
          </div>
        )}

        {lowStock && (
          <div className="text-low-stock-foreground font-semibold text-sm md:text-lg">
            ⚠️ Low Stock - Please restock soon
          </div>
        )}

        {expiring && (
          <div className="text-expiring-foreground font-semibold text-sm md:text-lg">
            ⏰ Expiring Soon
          </div>
        )}

        {product.batches && product.batches.length > 0 && (
          <div className="pt-1.5 md:pt-2">
            <Button
              onClick={() => setShowBatches(!showBatches)}
              variant="outline"
              className="w-full h-10 md:h-12 text-sm md:text-base"
            >
              {showBatches ? (
                <>
                  <ChevronUp className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                  Hide Batches ({product.batches.length})
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                  Show Batches ({product.batches.length})
                </>
              )}
            </Button>

            {showBatches && (
              <div className="mt-2 md:mt-4 pt-2 md:pt-4 border-t">
                <BatchManagement
                  batches={product.batches}
                  onAddBatch={handleAddBatch}
                  onUpdateBatch={handleUpdateBatch}
                  productDuration={product.duration}
                  productDurationUnit={product.durationUnit}
                  productCostPrice={product.costPrice}
                />
              </div>
            )}
          </div>
        )}

        {(!product.batches || product.batches.length === 0) && (
          <div className="pt-1.5 md:pt-2">
            <BatchManagement
              batches={[]}
              onAddBatch={handleAddBatch}
              onUpdateBatch={handleUpdateBatch}
              productDuration={product.duration}
              productDurationUnit={product.durationUnit}
              productCostPrice={product.costPrice}
            />
          </div>
        )}

        <div className="flex gap-2 md:gap-3 pt-2">
          <Button
            onClick={() => onUpdateQuantity(product.id, -1)}
            disabled={product.quantity === 0}
            variant="destructive"
            size="lg"
            className="flex-1 h-12 md:h-16 text-base md:text-xl"
          >
            <Minus className="h-4 w-4 md:h-6 md:w-6 mr-1 md:mr-2" />
            <span className="hidden xs:inline">Decrease</span>
            <span className="xs:hidden">−</span>
          </Button>
          <Button
            onClick={() => onUpdateQuantity(product.id, 1)}
            className="flex-1 h-12 md:h-16 text-base md:text-xl bg-success hover:bg-success/90 text-success-foreground"
            size="lg"
          >
            <Plus className="h-4 w-4 md:h-6 md:w-6 mr-1 md:mr-2" />
            <span className="hidden xs:inline">Increase</span>
            <span className="xs:hidden">+</span>
          </Button>
        </div>
        </div>
      </Card>

      <EditProductForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        product={product}
        onUpdate={onUpdateProduct}
        onDelete={onDelete}
        categories={categories}
      />
    </>
  );
};
