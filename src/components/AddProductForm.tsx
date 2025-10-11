import { useState } from "react";
import { ProductFormData } from "@/types/product";
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

    onAdd(formData);
    setFormData({ name: "", quantity: 0 });
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
            <Label htmlFor="expiryDate" className="text-lg">Expiry Date (Optional)</Label>
            <Input
              id="expiryDate"
              type="date"
              value={formData.expiryDate || ""}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="h-14 text-lg"
            />
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
