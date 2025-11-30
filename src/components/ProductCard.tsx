import { useState } from "react";
import { Product } from "@/types/product";
import { Batch } from "@/types/batch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Minus, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { isLowStock, isExpiringSoon } from "@/utils/productHelpers";
import { useSettings } from "@/hooks/useSettings";
import { BatchManagement } from "./BatchManagement";
import { syncProductWithBatches } from "@/utils/batchHelpers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProductCardProps {
  product: Product;
  onUpdateQuantity: (id: string, delta: number) => void;
  onDelete: (id: string) => void;
  onUpdateProduct: (product: Product) => void;
}

export const ProductCard = ({ product, onUpdateQuantity, onDelete, onUpdateProduct }: ProductCardProps) => {
  const [showBatches, setShowBatches] = useState(false);
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
    <Card className={`p-6 ${cardClass}`}>
      <div className="space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-2xl font-bold truncate ${textStyle}`}>{product.name}</h3>
              {product.batches && product.batches.length > 0 && (
                <span className="px-2 py-1 bg-primary/10 text-primary text-sm font-medium rounded">
                  {product.batches.length} {product.batches.length === 1 ? 'batch' : 'batches'}
                </span>
              )}
            </div>
            {!showBatches && product.batches && product.batches.length > 0 && nearestExpiryDays !== null && (
              <div className="text-sm text-muted-foreground mt-1">
                Next expiry: {nearestExpiryDays > 0 ? `${nearestExpiryDays} days` : 'Today'}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${textStyle}`}>{product.quantity}</div>
            <div className="text-sm text-muted-foreground">in stock</div>
            {isZeroQuantity && (
              <div className="text-sm text-red-600 font-semibold mt-1">
                ⚠️ Needs Restock
              </div>
            )}
          </div>
        </div>


        {product.expiryDate && (
          <div className="text-base">
            <span className="text-muted-foreground">Earliest Expiry: </span>
            <span className="font-medium">{formatDate(product.expiryDate)}</span>
          </div>
        )}

        {(product.costPrice || product.sellingPrice) && (
          <div className="flex gap-6 text-base">
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
          <div className="text-low-stock-foreground font-semibold text-lg">
            ⚠️ Low Stock - Please restock soon
          </div>
        )}

        {expiring && (
          <div className="text-expiring-foreground font-semibold text-lg">
            ⏰ Expiring Soon
          </div>
        )}

        {product.batches && product.batches.length > 0 && (
          <div className="pt-2">
            <Button
              onClick={() => setShowBatches(!showBatches)}
              variant="outline"
              className="w-full h-12 text-base"
            >
              {showBatches ? (
                <>
                  <ChevronUp className="h-5 w-5 mr-2" />
                  Hide Batches ({product.batches.length})
                </>
              ) : (
                <>
                  <ChevronDown className="h-5 w-5 mr-2" />
                  Show Batches ({product.batches.length})
                </>
              )}
            </Button>

            {showBatches && (
              <div className="mt-4 pt-4 border-t-2">
                <BatchManagement
                  batches={product.batches}
                  onAddBatch={handleAddBatch}
                  onUpdateBatch={handleUpdateBatch}
                />
              </div>
            )}
          </div>
        )}

        {(!product.batches || product.batches.length === 0) && (
          <div className="pt-2">
            <BatchManagement
              batches={[]}
              onAddBatch={handleAddBatch}
              onUpdateBatch={handleUpdateBatch}
            />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            onClick={() => onUpdateQuantity(product.id, -1)}
            disabled={product.quantity === 0}
            variant="destructive"
            size="lg"
            className="flex-1 h-16 text-xl"
          >
            <Minus className="h-6 w-6 mr-2" />
            Decrease
          </Button>
          <Button
            onClick={() => onUpdateQuantity(product.id, 1)}
            className="flex-1 h-16 text-xl bg-success hover:bg-success/90 text-success-foreground"
            size="lg"
          >
            <Plus className="h-6 w-6 mr-2" />
            Increase
          </Button>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full h-12 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Delete Product
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {product.name}?</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                This will permanently remove this product from your inventory. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-12 text-lg">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(product.id)}
                className="h-12 text-lg bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
};
