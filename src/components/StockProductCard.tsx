import { useState } from "react";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { Batch } from "@/types/batch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Settings2, ChevronDown, ChevronUp, Wrench } from "lucide-react";
import { isLowStock, isExpiringSoon } from "@/utils/productHelpers";
import { useSettings } from "@/hooks/useSettings";
import { BatchManagement } from "./BatchManagement";
import { EditProductForm } from "./EditProductForm";
import { StockAdjustmentDialog } from "./StockAdjustmentDialog";
import { syncProductWithBatches } from "@/utils/batchHelpers";

interface StockProductCardProps {
  product: Product;
  onDelete: (id: string) => void;
  onUpdateProduct: (product: Product) => void;
  onStockAdjust: (productId: string, newQuantity: number, reason: string) => void;
  categories?: Category[];
}

export const StockProductCard = ({ 
  product, 
  onDelete, 
  onUpdateProduct,
  onStockAdjust,
  categories = [],
}: StockProductCardProps) => {
  const [showBatches, setShowBatches] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const { settings } = useSettings();
  const lowStock = isLowStock(product, settings.lowStockThreshold);
  const expiring = isExpiringSoon(product, settings.expiryAlertDays);
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
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(dateString);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const nearestExpiryDays = product.expiryDate ? getDaysUntilExpiry(product.expiryDate) : null;

  const handleAdjust = (newQuantity: number, reason: string) => {
    onStockAdjust(product.id, newQuantity, reason);
  };

  return (
    <>
      <Card className={`p-3 sm:p-4 md:p-6 relative ${cardClass}`}>
        <Button
          onClick={() => setShowEditForm(true)}
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-8 w-8 p-0"
        >
          <Settings2 className="h-4 w-4" />
        </Button>

        <div className="space-y-3">
          <div className="pr-10">
            <div className="flex items-start gap-2 flex-wrap mb-2">
              <h3 className={`text-lg sm:text-xl md:text-2xl font-bold break-words ${textStyle}`}>{product.name}</h3>
              {product.batches && product.batches.length > 0 && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded whitespace-nowrap">
                  {product.batches.length} {product.batches.length === 1 ? 'batch' : 'batches'}
                </span>
              )}
            </div>
            {!showBatches && product.batches && product.batches.length > 0 && nearestExpiryDays !== null && (
              <div className="text-sm text-muted-foreground">
                Next expiry: {nearestExpiryDays > 0 ? `${nearestExpiryDays} days` : nearestExpiryDays === 0 ? 'Today' : 'Expired'}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className={`text-xl sm:text-2xl md:text-3xl font-bold ${textStyle}`}>{product.quantity}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">in stock</div>
            </div>
            {isZeroQuantity && (
              <div className="text-xs sm:text-sm text-red-600 font-semibold">
                ⚠️ Needs Restock
              </div>
            )}
          </div>

          {product.expiryDate && (
            <div className="text-xs sm:text-sm md:text-base">
              <span className="text-muted-foreground">Earliest Expiry: </span>
              <span className="font-medium">{formatDate(product.expiryDate)}</span>
            </div>
          )}

          {(product.costPrice || product.sellingPrice) && (
            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm md:text-base">
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
            <div className="text-low-stock-foreground font-semibold text-sm sm:text-base">
              ⚠️ Low Stock - Please restock soon
            </div>
          )}

          {expiring && (
            <div className="text-expiring-foreground font-semibold text-sm sm:text-base">
              ⏰ Expiring Soon
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => setShowAdjustDialog(true)}
              variant="outline"
              className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
            >
              <Wrench className="h-4 w-4 mr-2" />
              Adjust Stock
            </Button>
            
            {product.batches && product.batches.length > 0 && (
              <Button
                onClick={() => setShowBatches(!showBatches)}
                variant="outline"
                className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
              >
                {showBatches ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Hide</span> Batches
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Show</span> Batches ({product.batches.length})
                  </>
                )}
              </Button>
            )}
          </div>

          {product.batches && product.batches.length > 0 && showBatches && (
            <div className="pt-2 border-t">
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

          {(!product.batches || product.batches.length === 0) && (
            <div className="pt-2">
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

      <StockAdjustmentDialog
        open={showAdjustDialog}
        onOpenChange={setShowAdjustDialog}
        product={product}
        onAdjust={handleAdjust}
      />
    </>
  );
};