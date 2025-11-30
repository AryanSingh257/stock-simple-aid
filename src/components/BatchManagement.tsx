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
}

export const BatchManagement = ({ batches, onAddBatch, onUpdateBatch }: BatchManagementProps) => {
  const [open, setOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [formData, setFormData] = useState<{
    quantity: number;
    duration: number;
    durationUnit: "days" | "weeks" | "months";
    costPrice: number | undefined;
  }>({
    quantity: 0,
    duration: 0,
    durationUnit: "days",
    costPrice: undefined,
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

    if (formData.quantity < 0) {
      toast.error("Quantity cannot be negative");
      return;
    }

    if (!formData.duration || formData.duration <= 0) {
      toast.error("Duration must be greater than 0");
      return;
    }

    const expiryDate = calculateExpiryDate(formData.duration, formData.durationUnit);
    
    if (editingBatch) {
      const updatedBatch: Batch = {
        ...editingBatch,
        quantity: formData.quantity,
        duration: formData.duration,
        durationUnit: formData.durationUnit,
        costPrice: formData.costPrice,
        expiryDate,
        status: calculateStatus(formData.quantity, expiryDate),
      };
      onUpdateBatch(updatedBatch);
      toast.success("Batch updated successfully");
    } else {
      const newBatch: Batch = {
        id: crypto.randomUUID(),
        quantity: formData.quantity,
        duration: formData.duration,
        durationUnit: formData.durationUnit,
        costPrice: formData.costPrice,
        expiryDate,
        status: calculateStatus(formData.quantity, expiryDate),
        dateAdded: new Date().toISOString(),
      };
      onAddBatch(newBatch);
      toast.success("Batch added successfully");
    }

    setFormData({ quantity: 0, duration: 0, durationUnit: "days", costPrice: undefined });
    setEditingBatch(null);
    setOpen(false);
  };

  const handleEdit = (batch: Batch) => {
    setEditingBatch(batch);
    setFormData({
      quantity: batch.quantity,
      duration: batch.duration,
      durationUnit: batch.durationUnit,
      costPrice: batch.costPrice,
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingBatch(null);
    setFormData({ quantity: 0, duration: 0, durationUnit: "days", costPrice: undefined });
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
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  placeholder="Enter quantity"
                  className="h-12 text-lg"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-lg">How long does this product last? *</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                    placeholder="Duration"
                    className="h-12 text-lg flex-1"
                    required
                  />
                  <Select
                    value={formData.durationUnit}
                    onValueChange={(value) =>
                      setFormData({ ...formData, durationUnit: value as "days" | "weeks" | "months" })
                    }
                  >
                    <SelectTrigger className="h-12 text-lg w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="days" className="text-lg">Days</SelectItem>
                      <SelectItem value="weeks" className="text-lg">Weeks</SelectItem>
                      <SelectItem value="months" className="text-lg">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="costPrice" className="text-lg">Cost Price (Optional)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.costPrice || ""}
                  onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || undefined })}
                  placeholder="₹ 0.00"
                  className="h-12 text-lg"
                />
              </div>

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
