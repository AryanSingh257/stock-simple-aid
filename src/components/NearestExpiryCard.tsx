import { Product } from "@/types/product";
import { Batch } from "@/types/batch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "@/hooks/useSettings";

interface NearestExpiryCardProps {
  products: Product[];
}

export const NearestExpiryCard = ({ products }: NearestExpiryCardProps) => {
  const navigate = useNavigate();
  const { settings } = useSettings();

  // Find the nearest expiring batch across all products
  const findNearestExpiryBatch = (): { product: Product; batch: Batch } | null => {
    let nearestExpiry: { product: Product; batch: Batch; expiryDate: Date } | null = null;

    products.forEach((product) => {
      if (!product.batches || product.batches.length === 0) return;

      product.batches.forEach((batch) => {
        if (batch.status === "expired" || batch.quantity === 0) return;

        const expiryDate = new Date(batch.expiryDate);
        if (!nearestExpiry || expiryDate < nearestExpiry.expiryDate) {
          nearestExpiry = { product, batch, expiryDate };
        }
      });
    });

    return nearestExpiry ? { product: nearestExpiry.product, batch: nearestExpiry.batch } : null;
  };

  const nearestExpiry = findNearestExpiryBatch();

  if (!nearestExpiry) {
    return null;
  }

  const { product, batch } = nearestExpiry;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(batch.expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const getAlertColor = () => {
    if (daysLeft <= 7) return "bg-destructive/10 border-destructive";
    if (daysLeft <= settings.expiryAlertDays) return "bg-warning/10 border-warning";
    return "bg-card border-border";
  };

  return (
    <Card className={`p-4 md:p-6 border-2 ${getAlertColor()} mb-4 md:mb-6`}>
      <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
        <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-destructive flex-shrink-0 mt-1" />
        <div className="flex-1 w-full">
          <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Nearest Expiry Batch</h3>
          <div className="space-y-1 md:space-y-2">
            <p className="text-base md:text-lg break-words">
              <span className="font-semibold">Product:</span> {product.name}
            </p>
            <p className="text-base md:text-lg">
              <span className="font-semibold">Days Left:</span> {daysLeft} {daysLeft === 1 ? "day" : "days"}
            </p>
            <p className="text-base md:text-lg">
              <span className="font-semibold">Quantity:</span> {batch.quantity}
            </p>
          </div>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            size="lg"
            className="mt-3 md:mt-4 h-10 md:h-12 text-base md:text-lg w-full sm:w-auto"
          >
            View Product
          </Button>
        </div>
      </div>
    </Card>
  );
};
