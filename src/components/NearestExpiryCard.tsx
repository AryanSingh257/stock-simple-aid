import { useState } from "react";
import { Product } from "@/types/product";
import { Batch } from "@/types/batch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { ExpiringProductsDialog } from "./ExpiringProductsDialog";

interface NearestExpiryCardProps {
  products: Product[];
}

export const NearestExpiryCard = ({ products }: NearestExpiryCardProps) => {
  const { settings } = useSettings();
  const [showExpiringDialog, setShowExpiringDialog] = useState(false);

  // Find the nearest expiring batch across all products
  const findNearestExpiryBatch = (): { product: Product; batch: Batch; daysLeft: number } | null => {
    let nearestExpiry: { product: Product; batch: Batch; expiryDate: Date; daysLeft: number } | null = null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    products.forEach((product) => {
      if (!product.batches || product.batches.length === 0) return;

      product.batches.forEach((batch) => {
        // Include batches with quantity > 0 (even expired ones for visibility)
        if (batch.quantity === 0) return;

        const expiryDate = new Date(batch.expiryDate);
        expiryDate.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (!nearestExpiry || expiryDate < nearestExpiry.expiryDate) {
          nearestExpiry = { product, batch, expiryDate, daysLeft };
        }
      });
    });

    return nearestExpiry ? { product: nearestExpiry.product, batch: nearestExpiry.batch, daysLeft: nearestExpiry.daysLeft } : null;
  };

  // Count total expiring batches
  const countExpiringBatches = (): number => {
    let count = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    products.forEach((product) => {
      if (!product.batches || product.batches.length === 0) return;

      product.batches.forEach((batch) => {
        if (batch.quantity === 0) return;

        const expiryDate = new Date(batch.expiryDate);
        expiryDate.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft <= settings.expiryAlertDays) {
          count++;
        }
      });
    });

    return count;
  };

  const nearestExpiry = findNearestExpiryBatch();
  const expiringCount = countExpiringBatches();

  // Don't show card if no batches exist or nearest is not within alert threshold
  if (!nearestExpiry || nearestExpiry.daysLeft > settings.expiryAlertDays) {
    return null;
  }

  const { product, batch, daysLeft } = nearestExpiry;

  const getAlertColor = () => {
    if (daysLeft < 0) return "bg-destructive/10 border-destructive";
    if (daysLeft <= 3) return "bg-red-100 border-red-400";
    if (daysLeft <= 7) return "bg-orange-100 border-orange-400";
    return "bg-yellow-100 border-yellow-400";
  };

  const getDaysText = () => {
    if (daysLeft < 0) return <span className="text-destructive">Expired {Math.abs(daysLeft)} days ago</span>;
    if (daysLeft === 0) return <span className="text-destructive">Expires today!</span>;
    if (daysLeft === 1) return "Expires tomorrow";
    return `${daysLeft} days left`;
  };

  return (
    <>
      <Card className={`p-3 sm:p-4 border-2 ${getAlertColor()} mb-3 sm:mb-4`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold mb-1.5">Nearest Expiry</h3>
            <div className="space-y-1 text-sm">
              <p className="break-words">
                <span className="text-muted-foreground">Product:</span>{" "}
                <span className="font-semibold">{product.name}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Status:</span>{" "}
                <span className="font-semibold">{getDaysText()}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Qty:</span>{" "}
                <span className="font-semibold">{batch.quantity}</span>
              </p>
            </div>
            {expiringCount > 0 && (
              <Button
                onClick={() => setShowExpiringDialog(true)}
                variant="outline"
                size="sm"
                className="mt-3 h-9 text-sm w-full sm:w-auto"
              >
                View All Expiring ({expiringCount})
              </Button>
            )}
          </div>
        </div>
      </Card>

      <ExpiringProductsDialog
        open={showExpiringDialog}
        onOpenChange={setShowExpiringDialog}
        products={products}
      />
    </>
  );
};