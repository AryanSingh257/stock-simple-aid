import { useState, useEffect } from "react";
import { Product } from "@/types/product";
import { Batch } from "@/types/batch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  onAdjust: (newQuantity: number, reason: string, newBatchData?: { duration: number; durationUnit: "days" | "weeks" | "months" }) => void;
}

const adjustmentReasons = [
  { value: "none", label: "No reason" },
  { value: "spoilage", label: "Spoilage" },
  { value: "mistake", label: "Mistake" },
  { value: "loss", label: "Loss" },
  { value: "personal_use", label: "Personal Use" },
  { value: "damaged", label: "Damaged" },
  { value: "other", label: "Other" },
];

export const StockAdjustmentDialog = ({
  open,
  onOpenChange,
  product,
  onAdjust,
}: StockAdjustmentDialogProps) => {
  const [newQuantity, setNewQuantity] = useState(product.quantity.toString());
  const [reason, setReason] = useState("none");
  const [duration, setDuration] = useState(product.duration?.toString() || "30");
  const [durationUnit, setDurationUnit] = useState<"days" | "weeks" | "months">(product.durationUnit || "days");

  useEffect(() => {
    if (open) {
      setNewQuantity(product.quantity.toString());
      setReason("none");
      setDuration(product.duration?.toString() || "30");
      setDurationUnit(product.durationUnit || "days");
    }
  }, [open, product.quantity, product.duration, product.durationUnit]);

  const quantityDifference = parseInt(newQuantity, 10) - product.quantity;
  const isIncreasing = quantityDifference > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const qty = parseInt(newQuantity, 10);
    if (isNaN(qty) || qty < 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    // If increasing stock, validate duration
    if (isIncreasing) {
      const dur = parseInt(duration, 10);
      if (isNaN(dur) || dur <= 0) {
        toast.error("Please enter a valid expiry duration for new stock");
        return;
      }
    }

    const reasonValue = reason === "none" ? "" : reason;
    
    if (isIncreasing) {
      onAdjust(qty, reasonValue, { 
        duration: parseInt(duration, 10), 
        durationUnit 
      });
    } else {
      onAdjust(qty, reasonValue);
    }
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Adjust Stock: {product.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-sm sm:text-base">Current Stock</Label>
            <div className="text-xl sm:text-2xl font-bold text-muted-foreground">
              {product.quantity} units
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newQuantity" className="text-sm sm:text-base">New Stock Amount</Label>
            <Input
              id="newQuantity"
              type="number"
              min="0"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              className="h-11 sm:h-12 text-base sm:text-lg"
              placeholder="Enter new quantity"
            />
            {!isNaN(parseInt(newQuantity, 10)) && quantityDifference !== 0 && (
              <div className={`text-sm font-medium ${quantityDifference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {quantityDifference > 0 ? '+' : ''}{quantityDifference} units
              </div>
            )}
          </div>

          {/* Show duration fields only when increasing stock */}
          {isIncreasing && (
            <div className="space-y-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800">New batch will be created for added stock</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="duration" className="text-sm">Expiry Duration</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="h-10 text-base"
                    placeholder="Duration"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="durationUnit" className="text-sm">Unit</Label>
                  <Select value={durationUnit} onValueChange={(v) => setDurationUnit(v as "days" | "weeks" | "months")}>
                    <SelectTrigger className="h-10 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-50">
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-sm sm:text-base">
              Reason <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base">
                <SelectValue placeholder="Select a reason (optional)" />
              </SelectTrigger>
              <SelectContent className="bg-background border z-50">
                {adjustmentReasons.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="text-sm sm:text-base py-2.5">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-11 sm:h-12 text-sm sm:text-base"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11 sm:h-12 bg-primary text-sm sm:text-base"
            >
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};