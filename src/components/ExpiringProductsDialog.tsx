import { Product } from "@/types/product";
import { Batch } from "@/types/batch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSettings } from "@/hooks/useSettings";

interface ExpiringProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
}

interface ExpiringBatchInfo {
  product: Product;
  batch: Batch;
  batchNumber: number;
  daysLeft: number;
}

export const ExpiringProductsDialog = ({
  open,
  onOpenChange,
  products,
}: ExpiringProductsDialogProps) => {
  const { settings } = useSettings();

  // Find all batches expiring within threshold
  const getExpiringBatches = (): ExpiringBatchInfo[] => {
    const expiringBatches: ExpiringBatchInfo[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    products.forEach((product) => {
      if (!product.batches || product.batches.length === 0) return;

      product.batches.forEach((batch, index) => {
        if (batch.quantity === 0) return;

        const expiryDate = new Date(batch.expiryDate);
        expiryDate.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Include expired and expiring soon batches
        if (daysLeft <= settings.expiryAlertDays) {
          expiringBatches.push({
            product,
            batch,
            batchNumber: index + 1,
            daysLeft,
          });
        }
      });
    });

    // Sort by days left (expired first, then nearest expiry)
    return expiringBatches.sort((a, b) => a.daysLeft - b.daysLeft);
  };

  const expiringBatches = getExpiringBatches();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusStyle = (daysLeft: number) => {
    if (daysLeft < 0) return "bg-destructive/10 border-destructive text-destructive";
    if (daysLeft <= 3) return "bg-red-100 border-red-400 text-red-700";
    if (daysLeft <= 7) return "bg-orange-100 border-orange-400 text-orange-700";
    return "bg-yellow-100 border-yellow-400 text-yellow-700";
  };

  const getDaysText = (daysLeft: number) => {
    if (daysLeft < 0) return `Expired ${Math.abs(daysLeft)} days ago`;
    if (daysLeft === 0) return "Expires today";
    if (daysLeft === 1) return "Expires tomorrow";
    return `${daysLeft} days left`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            Expiring Products ({expiringBatches.length})
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {expiringBatches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No products expiring within {settings.expiryAlertDays} days
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {expiringBatches.map((item, index) => (
                <div
                  key={`${item.product.id}-${item.batch.id}`}
                  className={`p-3 rounded-lg border ${getStatusStyle(item.daysLeft)}`}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h4 className="font-semibold text-sm sm:text-base break-words flex-1">
                      {item.product.name}
                    </h4>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-background/50 whitespace-nowrap">
                      Batch #{item.batchNumber}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                    <div>
                      <span className="opacity-70">Expiry: </span>
                      <span className="font-medium">{formatDate(item.batch.expiryDate)}</span>
                    </div>
                    <div>
                      <span className="opacity-70">Qty: </span>
                      <span className="font-medium">{item.batch.quantity}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs sm:text-sm font-semibold">
                    {getDaysText(item.daysLeft)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="pt-3 border-t">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full h-10 sm:h-11"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};