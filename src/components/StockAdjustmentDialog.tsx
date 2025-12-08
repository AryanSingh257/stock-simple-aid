import { useState } from "react";
import { Product } from "@/types/product";
import { Sale, SaleItem } from "@/types/sale";
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
  onAdjust: (newQuantity: number, reason: string) => void;
}

const adjustmentReasons = [
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
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const qty = parseInt(newQuantity, 10);
    if (isNaN(qty) || qty < 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (!reason) {
      toast.error("Please select a reason for adjustment");
      return;
    }

    onAdjust(qty, reason);
    onOpenChange(false);
    setNewQuantity(product.quantity.toString());
    setReason("");
  };

  const quantityDifference = parseInt(newQuantity, 10) - product.quantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Adjust Stock: {product.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="text-base">Current Stock</Label>
            <div className="text-2xl font-bold text-muted-foreground">
              {product.quantity} units
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newQuantity" className="text-base">New Stock Amount</Label>
            <Input
              id="newQuantity"
              type="number"
              min="0"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              className="h-12 text-lg"
              placeholder="Enter new quantity"
            />
            {!isNaN(parseInt(newQuantity, 10)) && quantityDifference !== 0 && (
              <div className={`text-sm font-medium ${quantityDifference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {quantityDifference > 0 ? '+' : ''}{quantityDifference} units
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-base">Reason for Adjustment</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent className="bg-background border z-50">
                {adjustmentReasons.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="text-base py-3">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 bg-primary"
            >
              Save Adjustment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};