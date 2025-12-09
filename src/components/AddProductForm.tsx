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
      <SheetContent side="bottom" className="h-[85vh] sm:h-[90vh] overflow-y-auto p-3 sm:p-6">
        <SheetHeader>
          <SheetTitle className="text-lg sm:text-2xl md:text-3xl font-bold">Add Product</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5 pt-3 sm:pt-6">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm sm:text-xl">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Product name"
              className="h-11 sm:h-14 text-base sm:text-lg"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quantity" className="text-sm sm:text-xl">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              placeholder="0"
              className="h-11 sm:h-14 text-base sm:text-lg"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-sm sm:text-xl">
              Category <span className="text-muted-foreground text-xs sm:text-base">(opt)</span>
            </Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) =>
                setFormData({ ...formData, categoryId: value === "none" ? undefined : value })
              }
            >
              <SelectTrigger className="h-11 sm:h-14 text-base sm:text-lg">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-2 z-50">
                <SelectItem value="none" className="text-base sm:text-lg">None</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="text-base sm:text-lg">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm sm:text-xl">Shelf life <span className="text-muted-foreground text-xs sm:text-base">(opt)</span></Label>
            <div className="flex gap-2">
              <Input
                id="shelfLifeDuration"
                type="number"
                min="1"
                value={shelfLifeDuration}
                onChange={(e) => setShelfLifeDuration(e.target.value ? parseInt(e.target.value) : "")}
                placeholder="Duration"
                className="h-11 sm:h-14 text-base sm:text-lg flex-1"
              />
              <Select
                value={shelfLifeUnit}
                onValueChange={(value) => setShelfLifeUnit(value as "days" | "weeks" | "months")}
              >
                <SelectTrigger className="h-11 sm:h-14 text-base sm:text-lg w-24 sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-2 z-50">
                  <SelectItem value="days" className="text-base sm:text-lg">Days</SelectItem>
                  <SelectItem value="weeks" className="text-base sm:text-lg">Weeks</SelectItem>
                  <SelectItem value="months" className="text-base sm:text-lg">Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="costPrice" className="text-sm sm:text-xl">Cost <span className="text-muted-foreground text-xs sm:text-base">(opt)</span></Label>
              <Input
                id="costPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.costPrice || ""}
                onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || undefined })}
                placeholder="₹ 0"
                className="h-11 sm:h-14 text-base sm:text-lg"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sellingPrice" className="text-sm sm:text-xl">Sell <span className="text-muted-foreground text-xs sm:text-base">(opt)</span></Label>
              <Input
                id="sellingPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.sellingPrice || ""}
                onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || undefined })}
                placeholder="₹ 0"
                className="h-11 sm:h-14 text-base sm:text-lg"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-11 sm:h-14 text-sm sm:text-lg tap-feedback"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 h-11 sm:h-14 text-sm sm:text-lg tap-feedback">
              Save
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
