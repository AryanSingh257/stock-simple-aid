import { Sale } from "@/types/sale";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Navigation } from "@/components/Navigation";

const SalesHistory = () => {
  const [sales] = useLocalStorage<Sale[]>("stockease-sales", []);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Sales History</h1>
          <p className="text-xl text-muted-foreground">View all completed sales</p>
        </div>

        <Navigation />

        <div className="space-y-4">
          {sales.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-2xl text-muted-foreground">No sales yet</p>
            </div>
          ) : (
            sales.map((sale) => (
              <div
                key={sale.id}
                className="bg-card border-2 border-border rounded-lg p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-2xl font-semibold">
                      {formatDate(sale.timestamp)}
                    </p>
                    <p className="text-lg text-muted-foreground">
                      {formatTime(sale.timestamp)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">₹{sale.totalAmount.toFixed(2)}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-lg mb-3">
                    <span className="font-semibold">{sale.itemCount}</span> items sold
                  </p>
                  <div className="space-y-2">
                    {sale.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-base">
                        <span>
                          {item.name} <span className="text-muted-foreground">× {item.quantity}</span>
                        </span>
                        <span className="font-semibold">₹{item.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesHistory;
