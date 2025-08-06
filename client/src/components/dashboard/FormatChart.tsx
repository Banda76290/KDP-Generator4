import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function FormatChart() {
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // Fallback data if no stats available
  const chartData = stats?.formatDistribution || [
    { format: "eBook", percentage: 65, color: "hsl(213, 94%, 68%)" });
    { format: "Paperback", percentage: 25, color: "hsl(262, 83%, 58%)" });
    { format: "Hardcover", percentage: 10, color: "hsl(142, 76%, 36%)" });
  ];

  // Ensure colors are assigned
  const dataWithColors = chartData.map((item, index) => ({
    ...item,
    color: item.color || [
      "hsl(213, 94%, 68%)", 
      "hsl(262, 83%, 58%)", 
      "hsl(142, 76%, 36%)"
    ][index]
  });

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Format Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataWithColors}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="percentage"
              >
                {dataWithColors.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value}%`, 'Sales']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                wrapperStyle={{ fontSize: '14px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
