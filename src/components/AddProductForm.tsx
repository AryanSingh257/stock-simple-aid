import { useState } from "react";
import { ProductFormData } from "@/types/product";
import { Batch } from "@/types/batch";
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

interface AddProductFormProps {
  onAdd: (product: ProductFormData) => void;
}

export const AddProductForm = ({ onAdd }: AddProductFormProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    quantity: 0,
  });
  const [shelfLifeDuration, setShelfLifeDuration] = useState<number | "">("");
  const [shelfLifeUnit, setShelfLifeUnit] = useState<"days" | "months">("days");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    
    if (formData.quantity < 0) {
      toast.error("Quantity cannot be negative");
      return;
    }

    // Calculate expiry date and create initial batch if shelf life is provided
    let calculatedExpiryDate: string | undefined;
    let initialBatch: Batch | undefined;
    
    if (shelfLifeDuration && shelfLifeDuration > 0 && formData.quantity > 0) {
      const currentDate = new Date();
      if (shelfLifeUnit === "days") {
        currentDate.setDate(currentDate.getDate() + Number(shelfLifeDuration));
      } else if (shelfLifeUnit === "months") {
        currentDate.setMonth(currentDate.getMonth() + Number(shelfLifeDuration));
      }
      calculatedExpiryDate = currentDate.toISOString().split('T')[0];
      
      // Create initial batch
      initialBatch = {
        id: crypto.randomUUID(),
        quantity: formData.quantity,
        duration: shelfLifeDuration,
        durationUnit: shelfLifeUnit,
        expiryDate: calculatedExpiryDate,
        costPrice: formData.costPrice,
        status: "active",
        dateAdded: new Date().toISOString(),
      };
    }

    onAdd({ 
      ...formData, 
      expiryDate: calculatedExpiryDate,
      batches: initialBatch ? [initialBatch] : []
    });
    setFormData({ name: "", quantity: 0 });
    setShelfLifeDuration("");
    setShelfLifeUnit("days");
    setOpen(false);
    toast.success("Product added successfully");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full h-16 text-xl mb-6">
          <Plus className="h-6 w-6 mr-2" />
          Add New Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add New Product</DialogTitle>
          <DialogDescription className="text-base">
            Fill in the product details below. Only name and quantity are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-lg">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter product name"
              className="h-14 text-lg"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-lg">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              placeholder="Enter quantity"
              className="h-14 text-lg"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-lg">Category (Optional)</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value as any })}
            >
              <SelectTrigger className="h-14 text-lg">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="Grocery" className="text-lg">Grocery</SelectItem>
                <SelectItem value="Medicine" className="text-lg">Medicine</SelectItem>
                <SelectItem value="Stationery" className="text-lg">Stationery</SelectItem>
                <SelectItem value="Other" className="text-lg">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-lg">How long does this item last? (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="shelfLifeDuration"
                type="number"
                min="1"
                value={shelfLifeDuration}
                onChange={(e) => setShelfLifeDuration(e.target.value ? parseInt(e.target.value) : "")}
                placeholder="Enter duration"
                className="h-14 text-lg flex-1"
              />
              <Select value={shelfLifeUnit} onValueChange={(value) => setShelfLifeUnit(value as "days" | "months")}>
                <SelectTrigger className="h-14 text-lg w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="days" className="text-lg">Days</SelectItem>
                  <SelectItem value="months" className="text-lg">Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                className="h-14 text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellingPrice" className="text-lg">Selling Price (Optional)</Label>
              <Input
                id="sellingPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.sellingPrice || ""}
                onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || undefined })}
                placeholder="₹ 0.00"
                className="h-14 text-lg"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 h-14 text-lg"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 h-14 text-lg">
              Save Product
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
