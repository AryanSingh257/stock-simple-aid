import { useState } from "react";
import { CategoryFormData } from "@/types/category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

interface AddCategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (category: CategoryFormData) => void;
}

export const AddCategoryForm = ({ open, onOpenChange, onAdd }: AddCategoryFormProps) => {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    onAdd(formData);
    setFormData({ name: "", description: "" });
    onOpenChange(false);
    toast.success("Category added successfully");
  };

  const handleClose = () => {
    setFormData({ name: "", description: "" });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] md:h-[90vh] overflow-y-auto p-4 md:p-6">
        <SheetHeader>
          <SheetTitle className="text-2xl md:text-3xl font-bold">Add New Category</SheetTitle>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="mt-4 md:mt-6 space-y-4 md:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="categoryName" className="text-xl">
              Category Name *
            </Label>
            <Input
              id="categoryName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Beverages, Electronics"
              className="h-14 text-lg"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-xl">
              Description (optional)
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this category"
              className="min-h-24 text-lg"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              size="lg"
              className="flex-1 h-14 text-lg"
            >
              Cancel
            </Button>
            <Button type="submit" size="lg" className="flex-1 h-14 text-lg">
              Save Category
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
