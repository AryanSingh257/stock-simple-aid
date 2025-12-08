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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StockProductCardProps {
  product: Product;
  onDelete: (id: string) => void;
  onUpdateProduct: (product: Product) => void;
  onStockAdjust: (productId: string, newQuantity: number, reason: string, newBatchData?: { duration: number; durationUnit: "days" | "weeks" | "months" }) => void;
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

  // Only show nearest expiry if there are active batches with quantity
  const activeBatches = product.batches?.filter(b => b.quantity > 0 && b.status !== "expired") || [];
  const hasActiveBatches = activeBatches.length > 0;
  const nearestExpiryDays = hasActiveBatches && product.expiryDate ? getDaysUntilExpiry(product.expiryDate) : null;

  const handleAdjust = (newQuantity: number, reason: string, newBatchData?: { duration: number; durationUnit: "days" | "weeks" | "months" }) => {
    onStockAdjust(product.id, newQuantity, reason, newBatchData);
  };

  return (
    <>
      <Card className={`p-3 sm:p-4 relative ${cardClass}`}>
        {/* Settings menu - moved Adjust Stock here */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background border z-50">
            <DropdownMenuItem onClick={() => setShowAdjustDialog(true)} className="cursor-pointer">
              <Wrench className="h-4 w-4 mr-2" />
              Adjust Stock
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowEditForm(true)} className="cursor-pointer">
              <Settings2 className="h-4 w-4 mr-2" />
              Edit Product
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="space-y-2.5">
          {/* Product name and batch count */}
          <div className="pr-10">
            <div className="flex items-start gap-2 flex-wrap mb-1">
              <h3 className={`text-base sm:text-lg md:text-xl font-bold break-words leading-tight ${textStyle}`}>{product.name}</h3>
              {product.batches && product.batches.length > 0 && (
                <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded whitespace-nowrap">
                  {product.batches.length} {product.batches.length === 1 ? 'batch' : 'batches'}
                </span>
              )}
            </div>
            {/* Nearest expiry - only show if has active batches */}
            {hasActiveBatches && nearestExpiryDays !== null && (
              <div className="text-xs sm:text-sm text-muted-foreground">
                Next expiry: {nearestExpiryDays > 0 ? `${nearestExpiryDays} days` : nearestExpiryDays === 0 ? 'Today' : <span className="text-destructive font-medium">Expired</span>}
              </div>
            )}
          </div>
          
          {/* Stock quantity */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className={`text-xl sm:text-2xl font-bold ${textStyle}`}>{product.quantity}</div>
              <div className="text-xs text-muted-foreground">in stock</div>
            </div>
            {isZeroQuantity && (
              <div className="text-xs text-red-600 font-semibold">
                ⚠️ Restock
              </div>
            )}
          </div>

          {/* Earliest expiry date */}
          {hasActiveBatches && product.expiryDate && (
            <div className="text-xs sm:text-sm">
              <span className="text-muted-foreground">Earliest Expiry: </span>
              <span className="font-medium">{formatDate(product.expiryDate)}</span>
            </div>
          )}

          {/* Prices */}
          {(product.costPrice || product.sellingPrice) && (
            <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
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

          {/* Alerts */}
          {lowStock && (
            <div className="text-low-stock-foreground font-semibold text-xs sm:text-sm">
              ⚠️ Low Stock - Restock soon
            </div>
          )}

          {expiring && (
            <div className="text-expiring-foreground font-semibold text-xs sm:text-sm">
              ⏰ Expiring Soon
            </div>
          )}

          {/* Batch toggle button */}
          {product.batches && product.batches.length > 0 && (
            <Button
              onClick={() => setShowBatches(!showBatches)}
              variant="outline"
              className="w-full h-9 sm:h-10 text-xs sm:text-sm mt-1"
            >
              {showBatches ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1.5" />
                  Hide Batches
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1.5" />
                  Show Batches ({product.batches.length})
                </>
              )}
            </Button>
          )}

          {/* Batch management section */}
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

          {/* No batches - show add batch option */}
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