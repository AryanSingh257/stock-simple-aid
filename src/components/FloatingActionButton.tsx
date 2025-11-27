import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Package, FolderPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  onAddProduct: () => void;
  onAddCategory: () => void;
}

export const FloatingActionButton = ({ onAddProduct, onAddCategory }: FloatingActionButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {isOpen && (
        <div className="absolute bottom-20 right-0 flex flex-col gap-3 mb-2">
          <Button
            onClick={() => handleAction(onAddProduct)}
            size="lg"
            className="h-14 gap-2 text-lg shadow-lg"
          >
            <Package className="h-5 w-5" />
            Add Product
          </Button>
          <Button
            onClick={() => handleAction(onAddCategory)}
            size="lg"
            variant="secondary"
            className="h-14 gap-2 text-lg shadow-lg"
          >
            <FolderPlus className="h-5 w-5" />
            Add Category
          </Button>
        </div>
      )}
      
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="lg"
        className={cn(
          "h-16 w-16 rounded-full shadow-xl transition-transform",
          isOpen && "rotate-45"
        )}
      >
        <Plus className="h-8 w-8" />
      </Button>
    </div>
  );
};
