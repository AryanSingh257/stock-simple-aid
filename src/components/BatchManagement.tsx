import { useState } from "react";
import { Batch, BatchFormData } from "@/types/batch";
import { BatchCard } from "./BatchCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface BatchManagementProps {
  batches: Batch[];
  onAddBatch: (batch: Batch) => void;
  onUpdateBatch: (batch: Batch) => void;
  productDuration?: number;
  productDurationUnit?: "days" | "weeks" | "months";
  productCostPrice?: number;
}

export const BatchManagement = ({ 
  batches, 
  onAddBatch, 
  onUpdateBatch,
  productDuration,
  productDurationUnit = "days",
  productCostPrice,
}: BatchManagementProps) => {
  const [open, setOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [formData, setFormData] = useState<{ quantity: number }>({
    quantity: 0,
  });

  const calculateExpiryDate = (duration: number, unit: "days" | "weeks" | "months"): string => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    if (unit === "days") {
      date.setDate(date.getDate() + duration);
    } else if (unit === "weeks") {
      date.setDate(date.getDate() + (duration * 7));
    } else if (unit === "months") {
      date.setMonth(date.getMonth() + duration);
    }
    return date.toISOString();
  };

  const calculateStatus = (quantity: number, expiryDate: string) => {
    if (quantity === 0) return "out_of_stock";
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    
    if (expiry < today) return "expired";
    
    return "active";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    if (!productDuration || productDuration <= 0) {
      toast.error("Product shelf life not set. Edit product first.");
      return;
    }

    const expiryDate = calculateExpiryDate(productDuration, productDurationUnit);
    
    if (editingBatch) {
      const updatedBatch: Batch = {
        ...editingBatch,
        quantity: formData.quantity,
        duration: productDuration,
        durationUnit: productDurationUnit,
        costPrice: productCostPrice,
        expiryDate,
        status: calculateStatus(formData.quantity, expiryDate),
      };
      onUpdateBatch(updatedBatch);
      toast.success("Batch updated");
    } else {
      const newBatch: Batch = {
        id: crypto.randomUUID(),
        quantity: formData.quantity,
        duration: productDuration,
        durationUnit: productDurationUnit,
        costPrice: productCostPrice,
        expiryDate,
        status: calculateStatus(formData.quantity, expiryDate),
        dateAdded: new Date().toISOString(),
      };
      onAddBatch(newBatch);
      toast.success("Batch added");
    }

    setFormData({ quantity: 0 });
    setEditingBatch(null);
    setOpen(false);
  };

  const handleEdit = (batch: Batch) => {
    setEditingBatch(batch);
    setFormData({
      quantity: batch.quantity,
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingBatch(null);
    setFormData({ quantity: 0 });
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      handleClose();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-xs sm:text-sm font-bold text-foreground">Batches</h3>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 tap-feedback">
              <Plus className="h-3 w-3 mr-0.5" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[92vw] max-w-sm max-h-[75vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-base sm:text-lg">
                {editingBatch ? "Edit Batch" : "Add Batch"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Enter batch details
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="quantity" className="text-xs sm:text-sm">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity || ""}
                  onChange={(e) => setFormData({ quantity: parseInt(e.target.value) || 0 })}
                  placeholder="Quantity"
                  className="h-10 text-base"
                  required
                />
              </div>

              {productDuration && productDuration > 0 && (
                <div className="bg-muted p-2 rounded-lg text-xs">
                  <p className="text-muted-foreground">
                    Life: <span className="font-semibold text-foreground">{productDuration} {productDurationUnit}</span>
                    {productCostPrice && (
                      <span className="ml-2">Cost: <span className="font-semibold text-foreground">₹{productCostPrice}</span></span>
                    )}
                  </p>
                </div>
              )}

              {(!productDuration || productDuration <= 0) && (
                <div className="bg-destructive/10 border border-destructive p-2 rounded-lg">
                  <p className="text-xs text-destructive">
                    Set product shelf life first
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 h-10 text-sm tap-feedback"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 h-10 text-sm tap-feedback">
                  {editingBatch ? "Update" : "Add"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {batches && batches.length > 0 ? (
        <div className="space-y-1.5">
          {batches.map((batch, index) => (
            <BatchCard key={batch.id} batch={batch} batchNumber={index + 1} onEdit={handleEdit} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-1.5 text-xs">No batches yet</p>
      )}
    </div>
  );
};