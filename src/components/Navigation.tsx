import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, History, Settings } from "lucide-react";

export const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="flex gap-2 md:gap-3 mb-4 md:mb-6 overflow-x-auto">
      <Link to="/" className="flex-1 min-w-[80px]">
        <Button 
          variant={isActive("/") ? "default" : "outline"}
          size="lg"
          className="w-full h-12 md:h-16 text-base md:text-lg"
        >
          <Package className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
          <span className="hidden sm:inline">Stock</span>
        </Button>
      </Link>
      <Link to="/billing" className="flex-1 min-w-[80px]">
        <Button 
          variant={isActive("/billing") ? "default" : "outline"}
          size="lg"
          className="w-full h-12 md:h-16 text-base md:text-lg"
        >
          <ShoppingCart className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
          <span className="hidden sm:inline">Billing</span>
        </Button>
      </Link>
      <Link to="/sales-history" className="flex-1 min-w-[80px]">
        <Button 
          variant={isActive("/sales-history") ? "default" : "outline"}
          size="lg"
          className="w-full h-12 md:h-16 text-base md:text-lg"
        >
          <History className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
          <span className="hidden sm:inline">Sales</span>
        </Button>
      </Link>
      <Link to="/settings" className="flex-shrink-0">
        <Button 
          variant={isActive("/settings") ? "default" : "outline"}
          size="icon"
          className="h-12 w-12 md:h-16 md:w-16"
        >
          <Settings className="h-4 w-4 md:h-5 md:w-5" />
        </Button>
      </Link>
    </nav>
  );
};
