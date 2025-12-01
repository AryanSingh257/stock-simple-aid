import { useState } from "react";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
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
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface EditProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  onUpdate: (product: Product) => void;
  onDelete: (productId: string) => void;
  categories: Category[];
}

export const EditProductForm = ({
  open,
  onOpenChange,
  product,
  onUpdate,
  onDelete,
  categories,
}: EditProductFormProps) => {
  const [formData, setFormData] = useState({
    name: product.name,
    duration: product.duration || 0,
    durationUnit: product.durationUnit || "days" as "days" | "weeks" | "months",
    costPrice: product.costPrice,
    sellingPrice: product.sellingPrice,
    categoryId: product.categoryId,
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    const updatedProduct: Product = {
      ...product,
      name: formData.name,
      duration: formData.duration > 0 ? formData.duration : undefined,
      durationUnit: formData.duration > 0 ? formData.durationUnit : undefined,
      costPrice: formData.costPrice,
      sellingPrice: formData.sellingPrice,
      categoryId: formData.categoryId,
    };

    onUpdate(updatedProduct);
    onOpenChange(false);
    toast.success("Product updated successfully");
  };

  const handleDelete = () => {
    onDelete(product.id);
    setShowDeleteDialog(false);
    onOpenChange(false);
  };

  const handleClose = () => {
    setFormData({
      name: product.name,
      duration: product.duration || 0,
      durationUnit: product.durationUnit || "days",
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      categoryId: product.categoryId,
    });
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl">Edit Product</DialogTitle>
            <DialogDescription className="text-sm md:text-base">
              Update product details below
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-lg">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter product name"
                className="h-12 text-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-lg">Category</Label>
              <Select
                value={formData.categoryId || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoryId: value === "none" ? undefined : value })
                }
              >
                <SelectTrigger className="h-12 text-lg">
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
              <Label className="text-lg">How long does this item last?</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  value={formData.duration || ""}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  placeholder="Duration"
                  className="h-12 text-lg flex-1"
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costPrice" className="text-lg">Cost Price</Label>
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

              <div className="space-y-2">
                <Label htmlFor="sellingPrice" className="text-lg">Selling Price</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.sellingPrice || ""}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || undefined })}
                  placeholder="₹ 0.00"
                  className="h-12 text-lg"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="h-12 text-lg"
              >
                Delete Product
              </Button>
              <div className="flex-1 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 h-12 text-lg"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 h-12 text-lg">
                  Update Product
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Delete Product?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              This will permanently delete "{product.name}" and all its batches. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-12 text-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="h-12 text-lg bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
