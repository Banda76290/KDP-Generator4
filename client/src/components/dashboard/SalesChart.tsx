import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useState } from "react";

export default function SalesChart() {
  const [timeRange, setTimeRange] = useState("6months");
  
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  };

  // Fallback data structure if no stats available
  const chartData = stats?.salesOverTime || [
    { month: "Jan", revenue: 1200 },
    { month: "Feb", revenue: 1900 },
    { month: "Mar", revenue: 2300 },
    { month: "Apr", revenue: 1700 },
    { month: "May", revenue: 2100 },
    { month: "Jun", revenue: 2847 },
  ];

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Sales Overview</CardTitle>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
              <XAxis 
                dataKey="month" 
                className="text-gray-600 text-sm"
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                className="text-gray-600 text-sm"
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                formatter={(value) => [`$${value}`, 'Revenue']}
                labelClassName="text-gray-900"
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(213, 94%, 68%)"
                strokeWidth={3}
                dot={{ fill: "hsl(213, 94%, 68%)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "hsl(213, 94%, 68%)", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
