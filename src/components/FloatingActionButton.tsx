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
    <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 flex flex-col gap-2 mb-2">
          <Button
            onClick={() => handleAction(onAddProduct)}
            size="lg"
            className="h-11 md:h-14 gap-2 text-sm md:text-lg shadow-lg whitespace-nowrap px-4 md:px-6"
          >
            <Package className="h-4 w-4 md:h-5 md:w-5" />
            Add Product
          </Button>
          <Button
            onClick={() => handleAction(onAddCategory)}
            size="lg"
            variant="secondary"
            className="h-11 md:h-14 gap-2 text-sm md:text-lg shadow-lg whitespace-nowrap px-4 md:px-6"
          >
            <FolderPlus className="h-4 w-4 md:h-5 md:w-5" />
            Add Category
          </Button>
        </div>
      )}
      
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="lg"
        className={cn(
          "h-12 w-12 md:h-16 md:w-16 rounded-full shadow-xl transition-transform",
          isOpen && "rotate-45"
        )}
      >
        <Plus className="h-5 w-5 md:h-8 md:w-8" />
      </Button>
    </div>
  );
};
