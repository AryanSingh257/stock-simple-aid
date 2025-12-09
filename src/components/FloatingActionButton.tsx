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
    <div className="fixed bottom-20 right-3 sm:bottom-6 sm:right-6 z-50 pb-safe">
      {isOpen && (
        <div className="absolute bottom-16 right-0 flex flex-col gap-2 mb-2 animate-fade-in">
          <Button
            onClick={() => handleAction(onAddProduct)}
            size="lg"
            className="h-11 sm:h-14 gap-2 text-sm sm:text-lg shadow-lg whitespace-nowrap px-3 sm:px-6 tap-feedback"
          >
            <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            Add Product
          </Button>
          <Button
            onClick={() => handleAction(onAddCategory)}
            size="lg"
            variant="secondary"
            className="h-11 sm:h-14 gap-2 text-sm sm:text-lg shadow-lg whitespace-nowrap px-3 sm:px-6 tap-feedback"
          >
            <FolderPlus className="h-4 w-4 sm:h-5 sm:w-5" />
            Add Category
          </Button>
        </div>
      )}
      
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="lg"
        className={cn(
          "h-12 w-12 sm:h-16 sm:w-16 rounded-full shadow-xl transition-all duration-200 tap-feedback",
          isOpen && "rotate-45"
        )}
      >
        <Plus className="h-5 w-5 sm:h-8 sm:w-8" />
      </Button>
    </div>
  );
};
