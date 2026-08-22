import { ImageIcon } from "lucide-react";

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
}

export const ProductImage = ({ src, alt, className = "" }: ProductImageProps) => {
  const base =
    "flex-shrink-0 rounded-md border border-border bg-muted overflow-hidden flex items-center justify-center";

  if (!src) {
    return (
      <div className={`${base} ${className}`} aria-hidden="true">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={`${base} ${className}`}>
      <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
    </div>
  );
};
