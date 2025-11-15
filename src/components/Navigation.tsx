import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, History } from "lucide-react";

export const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="flex gap-3 mb-6">
      <Link to="/" className="flex-1">
        <Button 
          variant={isActive("/") ? "default" : "outline"}
          size="lg"
          className="w-full h-16 text-lg"
        >
          <Package className="h-5 w-5 mr-2" />
          Stock
        </Button>
      </Link>
      <Link to="/billing" className="flex-1">
        <Button 
          variant={isActive("/billing") ? "default" : "outline"}
          size="lg"
          className="w-full h-16 text-lg"
        >
          <ShoppingCart className="h-5 w-5 mr-2" />
          Billing
        </Button>
      </Link>
      <Link to="/sales-history" className="flex-1">
        <Button 
          variant={isActive("/sales-history") ? "default" : "outline"}
          size="lg"
          className="w-full h-16 text-lg"
        >
          <History className="h-5 w-5 mr-2" />
          Sales
        </Button>
      </Link>
    </nav>
  );
};
