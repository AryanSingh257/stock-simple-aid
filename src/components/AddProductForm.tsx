import { useState } from "react";
import { ProductFormData } from "@/types/product";
import { Category } from "@/types/category";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

interface AddProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (product: ProductFormData) => void;
  categories: Category[];
}

export const AddProductForm = ({ open, onOpenChange, onAdd, categories }: AddProductFormProps) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    quantity: 0,
    categoryId: undefined,
    costPrice: undefined,
    sellingPrice: undefined,
    batches: [],
  });
  const [shelfLifeDuration, setShelfLifeDuration] = useState<number | "">("");
  const [shelfLifeUnit, setShelfLifeUnit] = useState<"days" | "weeks" | "months">("days");

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
      calculatedExpiryDate = calculateExpiryDate(shelfLifeDuration, shelfLifeUnit);
      
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
      batches: initialBatch ? [initialBatch] : [],
      duration: shelfLifeDuration && shelfLifeDuration > 0 ? shelfLifeDuration : undefined,
      durationUnit: shelfLifeDuration && shelfLifeDuration > 0 ? shelfLifeUnit : undefined,
    });
    setFormData({
      name: "",
      quantity: 0,
      categoryId: undefined,
      costPrice: undefined,
      sellingPrice: undefined,
      batches: [],
    });
    setShelfLifeDuration("");
    setShelfLifeUnit("days");
    onOpenChange(false);
    toast.success("Product added successfully");
  };

  const handleClose = () => {
    setFormData({
      name: "",
      quantity: 0,
      categoryId: undefined,
      costPrice: undefined,
      sellingPrice: undefined,
      batches: [],
    });
    setShelfLifeDuration("");
    setShelfLifeUnit("days");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] md:h-[90vh] overflow-y-auto p-4 md:p-6">
        <SheetHeader>
          <SheetTitle className="text-2xl md:text-3xl font-bold">Add New Product</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 pt-4 md:pt-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xl">Product Name *</Label>
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
            <Label htmlFor="quantity" className="text-xl">Quantity *</Label>
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
            <Label htmlFor="category" className="text-xl">
              Category (optional)
            </Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) =>
                setFormData({ ...formData, categoryId: value === "none" ? undefined : value })
              }
            >
              <SelectTrigger className="h-14 text-lg">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="none" className="text-lg">No Category</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="text-lg">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xl">How long does this item last? (optional)</Label>
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
              <Select
                value={shelfLifeUnit}
                onValueChange={(value) => setShelfLifeUnit(value as "days" | "weeks" | "months")}
              >
                <SelectTrigger className="h-14 text-lg w-32">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="costPrice" className="text-xl">Cost Price (optional)</Label>
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
              <Label htmlFor="sellingPrice" className="text-xl">Selling Price (optional)</Label>
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
              onClick={handleClose}
              className="flex-1 h-14 text-lg"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 h-14 text-lg">
              Save Product
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
