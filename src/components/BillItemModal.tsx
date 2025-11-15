import { useState } from "react";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface BillItemModalProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onAdd: (productId: string, quantity: number) => void;
}

export const BillItemModal = ({ product, open, onClose, onAdd }: BillItemModalProps) => {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const sellingPrice = product.sellingPrice || 0;
  const lineTotal = quantity * sellingPrice;

  const handleAdd = () => {
    if (quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }
    
    if (quantity > product.quantity) {
      toast.error(`Only ${product.quantity} units available in stock`);
      return;
    }

    onAdd(product.id, quantity);
    setQuantity(1);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">{product.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-lg">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={product.quantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="h-14 text-lg"
            />
            <p className="text-base text-muted-foreground">
              Available: {product.quantity} units
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-lg">
              <span>Price per unit:</span>
              <span className="font-semibold">₹{sellingPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-2xl font-bold">
              <span>Line Total:</span>
              <span>₹{lineTotal.toFixed(2)}</span>
            </div>
          </div>

          <Button 
            onClick={handleAdd}
            size="lg"
            className="w-full h-14 text-xl"
          >
            Add to Bill
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
