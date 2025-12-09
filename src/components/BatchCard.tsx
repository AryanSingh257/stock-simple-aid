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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
    if (batch.status === "expired" || daysLeft < 0) return "bg-destructive/10 border-destructive/50";
    if (batch.status === "out_of_stock" || batch.quantity === 0) return "bg-muted border-border";
    if (batch.status === "expiring_soon" || daysLeft <= 14) return "bg-expiring/50 border-expiring-border/50";
    return "bg-green-50 border-green-200";
  };

  const getStatusText = () => {
    if (daysLeft < 0) return { text: "Expired", color: "text-destructive bg-destructive/20" };
    if (batch.quantity === 0) return { text: "Empty", color: "text-muted-foreground bg-muted" };
    if (daysLeft === 0) return { text: "Today!", color: "text-destructive bg-destructive/20" };
    if (daysLeft <= 7) return { text: `${daysLeft}d`, color: "text-orange-700 bg-orange-100" };
    if (daysLeft <= 14) return { text: `${daysLeft}d`, color: "text-yellow-700 bg-yellow-100" };
    return { text: "OK", color: "text-green-700 bg-green-100" };
  };

  const status = getStatusText();

  return (
    <Card className={`p-2 border ${getStatusColor()}`}>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-[10px] sm:text-xs">#{batchNumber}</span>
            <span className={`text-[9px] sm:text-[10px] px-1 py-0.5 rounded font-medium ${status.color}`}>
              {status.text}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              Qty: <span className={`font-medium ${batch.quantity === 0 ? 'text-muted-foreground' : 'text-foreground'}`}>{batch.quantity}</span>
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              {formatDate(batch.expiryDate)}
            </span>
          </div>
        </div>
        <Button
          onClick={() => onEdit(batch)}
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 flex-shrink-0 tap-feedback"
        >
          <Pencil className="h-3 w-3 text-foreground" />
        </Button>
      </div>
    </Card>
  );
};