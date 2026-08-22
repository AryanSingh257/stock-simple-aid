import { useState } from "react";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { Batch } from "@/types/batch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Settings2, ChevronDown, ChevronUp, Wrench, Camera } from "lucide-react";
import { isLowStock, isExpiringSoon } from "@/utils/productHelpers";
import { useSettings } from "@/hooks/useSettings";
import { BatchManagement } from "./BatchManagement";
import { EditProductForm } from "./EditProductForm";
import { StockAdjustmentDialog } from "./StockAdjustmentDialog";
import { ProductImage } from "./ProductImage";
import { ProductImageDialog } from "./ProductImageDialog";
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
  const [showImageDialog, setShowImageDialog] = useState(false);
  const { settings } = useSettings();
  const lowStock = isLowStock(product, settings.lowStockThreshold);
  const expiring = isExpiringSoon(product, settings.expiryAlertDays);
  const isZeroQuantity = product.quantity === 0;
  
  const cardClass = lowStock 
    ? "bg-low-stock border-low-stock-border border-2" 
    : expiring 
    ? "bg-expiring border-expiring-border border-2"
    : "border-2";

  const textStyle = isZeroQuantity ? "text-destructive" : "";

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
      <Card className={`p-3 sm:p-4 relative ${cardClass} w-full`}>
        {/* Settings menu - black icon for visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0 tap-feedback"
            >
              <Settings2 className="h-4 w-4 text-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background border-2 z-50 shadow-lg">
            <DropdownMenuItem onClick={() => setShowAdjustDialog(true)} className="cursor-pointer tap-feedback py-2.5">
              <Wrench className="h-4 w-4 mr-2 text-foreground" />
              Adjust Stock
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowImageDialog(true)} className="cursor-pointer tap-feedback py-2.5">
              <Camera className="h-4 w-4 mr-2 text-foreground" />
              {product.imageUrl ? "Change Photo" : "Add Photo"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowEditForm(true)} className="cursor-pointer tap-feedback py-2.5">
              <Settings2 className="h-4 w-4 mr-2 text-foreground" />
              Edit Product
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="space-y-2">
          {/* Product name and batch count */}
          <div className="pr-10 flex items-start gap-2.5">
            <button
              type="button"
              onClick={() => setShowImageDialog(true)}
              aria-label={product.imageUrl ? "Change product photo" : "Add product photo"}
              className="tap-feedback"
            >
              <ProductImage
                src={product.imageUrl}
                alt={product.name}
                className="h-11 w-11 sm:h-14 sm:w-14"
              />
            </button>
            <div className="min-w-0 flex-1">
            <div className="flex items-start gap-1.5 flex-wrap mb-0.5">
              <h3 className={`text-base sm:text-lg md:text-xl font-bold break-words leading-tight ${textStyle}`}>{product.name}</h3>
              {product.batches && product.batches.length > 0 && (
                <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] sm:text-xs font-medium rounded whitespace-nowrap">
                  {product.batches.length} batch{product.batches.length !== 1 && 'es'}
                </span>
              )}
            </div>
            {/* Nearest expiry - only show if has active batches */}
            {hasActiveBatches && nearestExpiryDays !== null && (
              <div className="text-[11px] sm:text-sm text-muted-foreground">
                Next expiry: {nearestExpiryDays > 0 ? `${nearestExpiryDays}d` : nearestExpiryDays === 0 ? 'Today' : <span className="text-destructive font-medium">Expired</span>}
              </div>
            )}
            </div>
          </div>
          
          {/* Stock quantity and prices row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-3">
              <div>
                <span className={`text-lg sm:text-2xl font-bold ${textStyle}`}>{product.quantity}</span>
                <span className="text-[10px] sm:text-xs text-muted-foreground ml-1">stock</span>
              </div>
              {/* Inline prices for compact view */}
              {product.sellingPrice && (
                <span className="text-xs sm:text-sm font-medium">₹{product.sellingPrice}</span>
              )}
            </div>
            {isZeroQuantity && (
              <span className="text-[10px] sm:text-xs text-destructive font-semibold bg-destructive/10 px-1.5 py-0.5 rounded">
                Restock
              </span>
            )}
          </div>

          {/* Earliest expiry date - compact */}
          {hasActiveBatches && product.expiryDate && (
            <div className="text-[11px] sm:text-sm text-muted-foreground">
              Expires: <span className="font-medium text-foreground">{formatDate(product.expiryDate)}</span>
            </div>
          )}

          {/* Alerts - compact */}
          <div className="flex flex-wrap gap-1.5">
            {lowStock && (
              <span className="text-low-stock-foreground font-semibold text-[10px] sm:text-xs bg-low-stock px-1.5 py-0.5 rounded">
                ⚠️ Low Stock
              </span>
            )}
            {expiring && (
              <span className="text-expiring-foreground font-semibold text-[10px] sm:text-xs bg-expiring px-1.5 py-0.5 rounded">
                ⏰ Expiring
              </span>
            )}
          </div>

          {/* Batch toggle button - black icon for visibility */}
          {product.batches && product.batches.length > 0 && (
            <Button
              onClick={() => setShowBatches(!showBatches)}
              variant="outline"
              className="w-full h-9 sm:h-10 text-xs sm:text-sm tap-feedback border-border"
            >
              {showBatches ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1 text-foreground" />
                  Hide Batches
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1 text-foreground" />
                  Batches ({product.batches.length})
                </>
              )}
            </Button>
          )}

          {/* Batch management section - smooth expand */}
          {product.batches && product.batches.length > 0 && showBatches && (
            <div className="pt-2 border-t smooth-expand">
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
            <div className="pt-1.5">
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

      <ProductImageDialog
        open={showImageDialog}
        onOpenChange={setShowImageDialog}
        productName={product.name}
        imageUrl={product.imageUrl}
        onSave={(imageUrl) => onUpdateProduct({ ...product, imageUrl })}
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