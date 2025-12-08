import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar = ({ value, onChange, placeholder = "Search products..." }: SearchBarProps) => {
  return (
    <div className="relative w-full mb-4 md:mb-6">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 sm:pl-11 h-11 sm:h-12 text-base border-2"
      />
    </div>
  );
};
