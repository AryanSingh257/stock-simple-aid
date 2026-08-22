import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { resizeImageFile } from "@/utils/imageHelpers";
import { ProductImage } from "./ProductImage";

interface ProductImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  imageUrl?: string;
  onSave: (imageUrl?: string) => void;
}

export const ProductImageDialog = ({
  open,
  onOpenChange,
  productName,
  imageUrl,
  onSave,
}: ProductImageDialogProps) => {
  const [preview, setPreview] = useState<string | undefined>(imageUrl);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setPreview(imageUrl);
  }, [open, imageUrl]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLoading(true);
    try {
      setPreview(await resizeImageFile(file));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add the photo");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    try {
      onSave(preview);
      onOpenChange(false);
      toast.success(preview ? "Photo saved" : "Photo removed");
    } catch {
      toast.error("Storage is full — remove some photos and try again");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-sm p-4 sm:p-6">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-base sm:text-xl">Product Photo</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">{productName}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3">
          <ProductImage
            src={preview}
            alt={productName}
            className="h-28 w-28 sm:h-36 sm:w-36 rounded-lg"
          />

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />

          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="w-full h-11 text-sm tap-feedback"
          >
            <Camera className="h-4 w-4 mr-2" />
            {loading ? "Adding…" : preview ? "Change Photo" : "Choose Photo"}
          </Button>

          {preview && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setPreview(undefined)}
              className="w-full h-10 text-sm tap-feedback"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Photo
            </Button>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-10 text-sm tap-feedback"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="flex-1 h-10 text-sm tap-feedback"
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
