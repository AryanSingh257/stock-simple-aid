import { Sale } from "@/types/sale";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Navigation } from "@/components/Navigation";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";

type TimePeriod = "daily" | "monthly" | "yearly";

const SalesHistory = () => {
  const [sales] = useLocalStorage<Sale[]>("stockease-sales", []);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("daily");

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

  const revenueData = useMemo(() => {
    const dataMap = new Map<string, number>();
    const now = new Date();

    sales.forEach((sale) => {
      const saleDate = new Date(sale.timestamp);
      let key = "";

      if (timePeriod === "daily") {
        // Show sales for each hour of today
        if (saleDate.toDateString() === now.toDateString()) {
          const hour = saleDate.getHours();
          key = `${hour.toString().padStart(2, '0')}:00`;
        }
      } else if (timePeriod === "monthly") {
        // Show sales for each day of current month
        if (saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear()) {
          key = saleDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
        }
      } else if (timePeriod === "yearly") {
        // Show sales for each month of current year
        if (saleDate.getFullYear() === now.getFullYear()) {
          key = saleDate.toLocaleDateString("en-IN", { month: "short" });
        }
      }

      if (key) {
        dataMap.set(key, (dataMap.get(key) || 0) + sale.totalAmount);
      }
    });

    // Fill in missing data points with 0 revenue
    let completeData: Array<{ date: string; revenue: number }> = [];
    
    if (timePeriod === "daily") {
      // Create 24 hour entries
      for (let i = 0; i < 24; i++) {
        const hourKey = `${i.toString().padStart(2, '0')}:00`;
        completeData.push({ date: hourKey, revenue: dataMap.get(hourKey) || 0 });
      }
    } else if (timePeriod === "monthly") {
      // Create entries for each day of current month
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const dayDate = new Date(now.getFullYear(), now.getMonth(), i);
        const dayKey = dayDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
        completeData.push({ date: dayKey, revenue: dataMap.get(dayKey) || 0 });
      }
    } else if (timePeriod === "yearly") {
      // Create entries for each month of current year
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      months.forEach(month => {
        completeData.push({ date: month, revenue: dataMap.get(month) || 0 });
      });
    }

    return completeData;
  }, [sales, timePeriod]);

  const totalRevenue = useMemo(() => {
    return revenueData.reduce((sum, item) => sum + item.revenue, 0);
  }, [revenueData]);

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Sales & Revenue</h1>
          <p className="text-lg md:text-xl text-muted-foreground">Track your business performance</p>
        </div>

        <Navigation />

        {sales.length === 0 ? (
          <div className="text-center py-12 md:py-16">
            <p className="text-xl md:text-2xl text-muted-foreground">No sales yet</p>
          </div>
        ) : (
          <>
            {/* Revenue Analytics Section */}
            <Card className="p-4 md:p-6 mb-6 md:mb-8">
              <div className="mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Revenue Analytics</h2>
                <div className="flex gap-2 md:gap-3 mb-4 md:mb-6">
                  <Button
                    variant={timePeriod === "daily" ? "default" : "outline"}
                    size="lg"
                    onClick={() => setTimePeriod("daily")}
                    className="flex-1 h-12 md:h-14 text-base md:text-lg"
                  >
                    Daily
                  </Button>
                  <Button
                    variant={timePeriod === "monthly" ? "default" : "outline"}
                    size="lg"
                    onClick={() => setTimePeriod("monthly")}
                    className="flex-1 h-12 md:h-14 text-base md:text-lg"
                  >
                    Monthly
                  </Button>
                  <Button
                    variant={timePeriod === "yearly" ? "default" : "outline"}
                    size="lg"
                    onClick={() => setTimePeriod("yearly")}
                    className="flex-1 h-12 md:h-14 text-base md:text-lg"
                  >
                    Yearly
                  </Button>
                </div>
              </div>

              {/* Total Revenue Summary */}
              <div className="mb-4 md:mb-6 p-3 md:p-4 bg-secondary rounded-lg">
                <p className="text-base md:text-lg text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-3xl md:text-4xl font-bold">₹{totalRevenue.toFixed(2)}</p>
              </div>

              {/* Revenue Chart */}
              <div className="h-[250px] sm:h-[300px] w-full overflow-x-auto">
                <ResponsiveContainer width="100%" height="100%" minWidth={300}>
                  <LineChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--foreground))"
                      style={{ fontSize: '12px' }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      stroke="hsl(var(--foreground))"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `₹${value}`}
                      width={50}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '2px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '16px',
                      }}
                      formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Revenue']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', r: 5, fillOpacity: 0.3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Sales History Section */}
            <div className="mb-3 md:mb-4">
              <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Sales History</h2>
            </div>
            <div className="space-y-3 md:space-y-4 max-h-[500px] md:max-h-[600px] overflow-y-auto pr-1 md:pr-2">
              {sales.slice().reverse().map((sale) => (
                <Card key={sale.id} className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 md:mb-4 gap-2">
                    <div>
                      <p className="text-xl md:text-2xl font-semibold">
                        {formatDate(sale.timestamp)}
                      </p>
                      <p className="text-base md:text-lg text-muted-foreground">
                        {formatTime(sale.timestamp)}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-2xl md:text-3xl font-bold">₹{sale.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="border-t pt-3 md:pt-4">
                    <p className="text-base md:text-lg mb-2 md:mb-3">
                      <span className="font-semibold">{sale.itemCount}</span> items sold
                    </p>
                    <div className="space-y-2">
                      {sale.items.map((item, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:justify-between text-sm md:text-base gap-1">
                          <span className="break-words">
                            {item.name} <span className="text-muted-foreground">× {item.quantity}</span>
                          </span>
                          <span className="font-semibold">₹{item.subtotal.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SalesHistory;
