import { useState } from "react";
import { Batch, BatchFormData } from "@/types/batch";
import { BatchCard } from "./BatchCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    const expiry = new Date(expiryDate);
    
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
      toast.error("Product shelf life not set. Please edit product details first.");
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
      toast.success("Batch updated successfully");
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
      toast.success("Batch added successfully");
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Batches</h3>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-10">
              <Plus className="h-4 w-4 mr-2" />
              Add Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {editingBatch ? "Edit Batch" : "Add New Batch"}
              </DialogTitle>
              <DialogDescription className="text-base">
                Enter batch details below
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-lg">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity || ""}
                  onChange={(e) => setFormData({ quantity: parseInt(e.target.value) || 0 })}
                  placeholder="Enter quantity"
                  className="h-12 text-lg"
                  required
                />
              </div>

              {productDuration && productDuration > 0 && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Shelf life: <span className="font-semibold">{productDuration} {productDurationUnit}</span>
                  </p>
                  {productCostPrice && (
                    <p className="text-sm text-muted-foreground">
                      Cost price: <span className="font-semibold">₹{productCostPrice.toFixed(2)}</span>
                    </p>
                  )}
                </div>
              )}

              {(!productDuration || productDuration <= 0) && (
                <div className="bg-destructive/10 border border-destructive p-3 rounded-lg">
                  <p className="text-sm text-destructive">
                    Product shelf life not set. Please edit product details to add shelf life before creating batches.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 h-12 text-lg"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 h-12 text-lg">
                  {editingBatch ? "Update Batch" : "Add Batch"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {batches && batches.length > 0 ? (
        <div className="space-y-3">
          {batches.map((batch) => (
            <BatchCard key={batch.id} batch={batch} onEdit={handleEdit} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-4">No batches yet. Add your first batch above.</p>
      )}
    </div>
  );
};
