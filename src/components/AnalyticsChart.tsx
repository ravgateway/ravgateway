import { Card } from "@/components/ui/card";

interface ChartData {
  day: string;
  amount: number;
}

interface AnalyticsChartProps {
  data: ChartData[];
}

const AnalyticsChart = ({ data }: AnalyticsChartProps) => {
  const maxAmount = Math.max(...data.map(d => d.amount));

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6 text-foreground">Daily Revenue</h2>
      <div className="space-y-4">
        {data.map((item, index) => {
          const percentage = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
          
          return (
            <div key={index} className="space-y-1 group">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  {item.day}
                </span>
                <span className="font-medium text-foreground">
                  ${item.amount.toFixed(2)}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-1000 ease-out hover:bg-primary/80"
                  style={{ 
                    width: `${percentage}%`,
                    transitionDelay: `${700 + index * 100}ms`
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>         
    </Card>
  );
};

export default AnalyticsChart;