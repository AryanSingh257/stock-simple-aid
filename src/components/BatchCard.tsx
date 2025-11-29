import { Batch } from "@/types/batch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface BatchCardProps {
  batch: Batch;
  onEdit: (batch: Batch) => void;
}

export const BatchCard = ({ batch, onEdit }: BatchCardProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusColor = () => {
    if (batch.status === "expired") return "bg-red-100 border-red-400 text-red-900";
    if (batch.status === "out_of_stock") return "bg-gray-100 border-gray-400 text-gray-700";
    if (batch.status === "expiring_soon") return "bg-orange-100 border-orange-400 text-orange-900";
    return "bg-green-100 border-green-400 text-green-900";
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
    <Card className={`p-4 border-2 ${getStatusColor()}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-bold">{getStatusText()}</span>
          </div>
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-medium">Quantity:</span> {batch.quantity}
            </p>
            <p>
              <span className="font-medium">Expires:</span> {formatDate(batch.expiryDate)}
            </p>
            <p>
              <span className="font-medium">Shelf Life:</span> {batch.duration} {batch.durationUnit}
            </p>
            {batch.costPrice && (
              <p>
                <span className="font-medium">Cost:</span> ₹{batch.costPrice.toFixed(2)}
              </p>
            )}
            <p className="text-xs opacity-75">
              Added: {formatDate(batch.dateAdded)}
            </p>
          </div>
        </div>
        <Button
          onClick={() => onEdit(batch)}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
