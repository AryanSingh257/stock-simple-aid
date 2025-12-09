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
      <DialogContent className="w-[92vw] max-w-sm max-h-[80vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base sm:text-lg leading-tight pr-6">
            Adjust: {product.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-muted-foreground">Current</span>
            <span className="text-lg sm:text-xl font-bold">{product.quantity}</span>
          </div>

          <div className="space-y-1">
            <Label htmlFor="newQuantity" className="text-xs sm:text-sm">New Amount</Label>
            <Input
              id="newQuantity"
              type="number"
              min="0"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              className="h-11 text-base"
              placeholder="Enter quantity"
            />
            {!isNaN(parseInt(newQuantity, 10)) && quantityDifference !== 0 && (
              <div className={`text-xs font-medium ${quantityDifference > 0 ? 'text-green-600' : 'text-destructive'}`}>
                {quantityDifference > 0 ? '+' : ''}{quantityDifference} units
              </div>
            )}
          </div>

          {/* Show duration fields only when increasing stock */}
          {isIncreasing && (
            <div className="space-y-2 p-2.5 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs font-medium text-green-800">New batch created</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="duration" className="text-xs">Duration</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="durationUnit" className="text-xs">Unit</Label>
                  <Select value={durationUnit} onValueChange={(v) => setDurationUnit(v as "days" | "weeks" | "months")}>
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-2 z-50">
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="reason" className="text-xs sm:text-sm">
              Reason <span className="text-muted-foreground">(opt)</span>
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent className="bg-background border-2 z-50">
                {adjustmentReasons.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="text-sm py-2">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-11 text-sm tap-feedback"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11 text-sm tap-feedback"
            >
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};