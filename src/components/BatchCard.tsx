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

  const getDaysLeft = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(batch.expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysLeft();

  const getStatusColor = () => {
    if (batch.status === "expired" || daysLeft < 0) return "bg-destructive/10 border-destructive";
    if (batch.status === "out_of_stock" || batch.quantity === 0) return "bg-muted border-muted-foreground/30";
    if (batch.status === "expiring_soon" || daysLeft <= 14) return "bg-expiring border-expiring-border";
    return "bg-green-50 border-green-300";
  };

  const getStatusText = () => {
    if (daysLeft < 0) return { text: "Expired", color: "text-destructive bg-destructive/20" };
    if (batch.quantity === 0) return { text: "Out of Stock", color: "text-muted-foreground bg-muted" };
    if (daysLeft === 0) return { text: "Expires Today", color: "text-destructive bg-destructive/20" };
    if (daysLeft <= 7) return { text: `${daysLeft}d left`, color: "text-orange-700 bg-orange-100" };
    if (daysLeft <= 14) return { text: `${daysLeft}d left`, color: "text-yellow-700 bg-yellow-100" };
    return { text: "Fresh", color: "text-green-700 bg-green-100" };
  };

  const status = getStatusText();

  return (
    <Card className={`p-2.5 sm:p-3 border ${getStatusColor()}`}>
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="font-semibold text-xs sm:text-sm">Batch #{batchNumber}</span>
            <span className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded font-medium ${status.color}`}>
              {status.text}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] sm:text-xs">
            <div>
              <span className="text-muted-foreground">Qty:</span>{" "}
              <span className={`font-semibold ${batch.quantity === 0 ? 'text-muted-foreground' : ''}`}>
                {batch.quantity}
              </span>
            </div>
            <div className="truncate">
              <span className="text-muted-foreground">Expires:</span>{" "}
              <span className="font-medium">{formatDate(batch.expiryDate)}</span>
            </div>
            {batch.costPrice && (
              <div>
                <span className="text-muted-foreground">Cost:</span>{" "}
                <span className="font-medium">₹{batch.costPrice}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Life:</span>{" "}
              <span className="font-medium">{batch.duration}{batch.durationUnit[0]}</span>
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