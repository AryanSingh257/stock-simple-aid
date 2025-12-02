import { Batch } from "@/types/batch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface BatchCardProps {
  batch: Batch;
  batchNumber: number;
  onEdit: (batch: Batch) => void;
}

export const BatchCard = ({ batch, batchNumber, onEdit }: BatchCardProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusColor = () => {
    if (batch.status === "expired") return "bg-destructive/10 border-destructive text-destructive";
    if (batch.status === "out_of_stock") return "bg-muted border-muted-foreground/30 text-muted-foreground";
    if (batch.status === "expiring_soon") return "bg-expiring border-expiring-border text-expiring-foreground";
    return "bg-success/10 border-success text-success";
  };

  const getStatusText = () => {
    if (batch.status === "expired") return "Expired";
    if (batch.status === "out_of_stock") return "Out of Stock";
    if (batch.status === "expiring_soon") {
      const today = new Date();
      const expiry = new Date(batch.expiryDate);
      const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return `Expiring Soon (${diffDays} days)`;
    }
    return "Fresh";
  };

  return (
    <Card className={`p-3 border ${getStatusColor()}`}>
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-sm">Batch #{batchNumber}</span>
            <span className="text-xs px-2 py-0.5 rounded-full border">{getStatusText()}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
            <div>
              <span className="text-muted-foreground">Qty:</span> <span className="font-semibold">{batch.quantity}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Expires:</span> <span className="font-medium">{formatDate(batch.expiryDate)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Shelf Life:</span> <span className="font-medium">{batch.duration} {batch.durationUnit}</span>
            </div>
            {batch.costPrice && (
              <div>
                <span className="text-muted-foreground">Cost:</span> <span className="font-medium">₹{batch.costPrice.toFixed(2)}</span>
              </div>
            )}
            <div className="col-span-2 text-muted-foreground/60 text-[10px] mt-0.5">
              Added: {formatDate(batch.dateAdded)}
            </div>
          </div>
        </div>
        <Button
          onClick={() => onEdit(batch)}
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 flex-shrink-0"
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  );
};
