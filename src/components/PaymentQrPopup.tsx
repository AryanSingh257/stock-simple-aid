import { QrCode } from "lucide-react";
import { SaleItem } from "@/types/sale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PaymentQrPopupProps {
  open: boolean;
  onClose: () => void;
  items: SaleItem[];
  totalAmount: number;
}

/**
 * Reusable QR placeholder area.
 *
 * Today this renders a purely visual placeholder that *looks* like a QR area
 * but is not a scannable code. When a real UPI QR is wired in later, replace
 * the inner contents of this block (the decorative grid + icon) with the
 * generated QR image — the surrounding square/layout stays identical.
 */
function QrPlaceholder() {
  return (
    <div
      className="relative aspect-square w-full max-w-[220px] mx-auto rounded-lg border-2 border-dashed border-border bg-secondary/40 p-3 flex items-center justify-center"
      aria-label="Payment QR code placeholder"
    >
      {/* Decorative grid to suggest a QR area without being scannable */}
      <div className="absolute inset-3 grid grid-cols-8 grid-rows-8 gap-[2px] opacity-20 pointer-events-none">
        {Array.from({ length: 64 }).map((_, i) => (
          <span
            key={i}
            className={i % 3 === 0 ? "bg-foreground rounded-[1px]" : "bg-transparent"}
          />
        ))}
      </div>
      <div className="relative z-10 flex flex-col items-center gap-1.5 text-muted-foreground">
        <QrCode className="h-8 w-8" />
        <span className="text-[11px] sm:text-xs font-medium">QR Preview</span>
      </div>
    </div>
  );
}

export function PaymentQrPopup({
  open,
  onClose,
  items,
  totalAmount,
}: PaymentQrPopupProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-4 sm:p-6 max-h-[92vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="text-lg sm:text-2xl font-bold">
            Scan to Pay
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            UPI Payment
          </DialogDescription>
        </DialogHeader>

        {/* QR placeholder — center stage */}
        <div className="py-2">
          <QrPlaceholder />
        </div>

        {/* Total near the QR */}
        <div className="text-center py-1">
          <p className="text-xs sm:text-sm text-muted-foreground">Total Amount</p>
          <p className="text-2xl sm:text-3xl font-bold">₹{totalAmount.toFixed(0)}</p>
        </div>

        {/* Compact bill summary */}
        <div className="border-t-2 pt-2">
          <p className="text-xs sm:text-sm font-semibold mb-1.5 text-muted-foreground">
            Bill Summary
          </p>
          <div className="max-h-[26vh] overflow-y-auto space-y-1">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex justify-between items-center gap-2 text-xs sm:text-sm py-0.5"
              >
                <span className="flex-1 min-w-0 truncate font-medium">
                  {item.name}
                </span>
                <span className="text-muted-foreground whitespace-nowrap">
                  {item.quantity} × ₹{item.price}
                </span>
                <span className="font-semibold whitespace-nowrap">
                  ₹{item.subtotal.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center border-t pt-1.5 mt-1.5">
            <span className="text-sm sm:text-base font-bold">Total</span>
            <span className="text-sm sm:text-base font-bold">
              ₹{totalAmount.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Close / Cancel */}
        <div className="pt-1">
          <Button
            onClick={onClose}
            size="lg"
            variant="outline"
            className="w-full h-11 sm:h-12 text-sm tap-feedback"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PaymentQrPopup;
