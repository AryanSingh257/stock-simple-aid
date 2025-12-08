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
    <div className="space-y-2.5">
      <div className="flex justify-between items-center">
        <h3 className="text-sm sm:text-base font-bold">Batches</h3>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-xs sm:text-sm px-2.5">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingBatch ? "Edit Batch" : "Add New Batch"}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Enter batch details below
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="quantity" className="text-sm sm:text-base">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity || ""}
                  onChange={(e) => setFormData({ quantity: parseInt(e.target.value) || 0 })}
                  placeholder="Enter quantity"
                  className="h-10 sm:h-11 text-base"
                  required
                />
              </div>

              {productDuration && productDuration > 0 && (
                <div className="bg-muted p-2.5 rounded-lg text-sm">
                  <p className="text-muted-foreground">
                    Shelf life: <span className="font-semibold text-foreground">{productDuration} {productDurationUnit}</span>
                  </p>
                  {productCostPrice && (
                    <p className="text-muted-foreground">
                      Cost: <span className="font-semibold text-foreground">₹{productCostPrice}</span>
                    </p>
                  )}
                </div>
              )}

              {(!productDuration || productDuration <= 0) && (
                <div className="bg-destructive/10 border border-destructive p-2.5 rounded-lg">
                  <p className="text-xs sm:text-sm text-destructive">
                    Product shelf life not set. Edit product details first.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 h-10 sm:h-11 text-sm sm:text-base">
                  {editingBatch ? "Update" : "Add"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {batches && batches.length > 0 ? (
        <div className="space-y-2">
          {batches.map((batch, index) => (
            <BatchCard key={batch.id} batch={batch} batchNumber={index + 1} onEdit={handleEdit} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-2 text-xs sm:text-sm">No batches yet</p>
      )}
    </div>
  );
};