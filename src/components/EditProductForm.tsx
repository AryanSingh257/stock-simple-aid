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
import { ProductImage } from "./ProductImage";
import { ProductImageDialog } from "./ProductImageDialog";

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
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(product.imageUrl);

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
      imageUrl,
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
        <DialogContent className="w-[92vw] max-w-md p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base sm:text-xl">Edit Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Photo + Product Name */}
            <div className="flex items-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowImageDialog(true)}
                aria-label={imageUrl ? "Change product photo" : "Add product photo"}
                className="tap-feedback"
              >
                <ProductImage src={imageUrl} alt={formData.name} className="h-14 w-14" />
              </button>
            <div className="space-y-1 flex-1 min-w-0">
              <Label htmlFor="name" className="text-sm">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Product name"
                className="h-9 text-sm"
                required
              />
            </div>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <Label className="text-sm">Category</Label>
              <Select
                value={formData.categoryId || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoryId: value === "none" ? undefined : value })
                }
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="none" className="text-sm">No Category</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="text-sm">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Shelf Life - compact inline */}
            <div className="space-y-1">
              <Label className="text-sm">Shelf Life</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  value={formData.duration || ""}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="h-9 text-sm flex-1"
                />
                <Select
                  value={formData.durationUnit}
                  onValueChange={(value) =>
                    setFormData({ ...formData, durationUnit: value as "days" | "weeks" | "months" })
                  }
                >
                  <SelectTrigger className="h-9 text-sm w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="days" className="text-sm">Days</SelectItem>
                    <SelectItem value="weeks" className="text-sm">Weeks</SelectItem>
                    <SelectItem value="months" className="text-sm">Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Prices - side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm">Cost</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.costPrice || ""}
                  onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || undefined })}
                  placeholder="₹ 0"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Sell</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.sellingPrice || ""}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || undefined })}
                  placeholder="₹ 0"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Buttons - compact row */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="h-9 text-xs px-3 tap-feedback"
              >
                Delete
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="flex-1 h-9 text-sm tap-feedback"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="flex-1 h-9 text-sm tap-feedback">
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ProductImageDialog
        open={showImageDialog}
        onOpenChange={setShowImageDialog}
        productName={product.name}
        imageUrl={imageUrl}
        onSave={setImageUrl}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="w-[90vw] max-w-sm p-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Delete Product?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Permanently delete "{product.name}" and all batches?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-9 text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="h-9 text-sm bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
