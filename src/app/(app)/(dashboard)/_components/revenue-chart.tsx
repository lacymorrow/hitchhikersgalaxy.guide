"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { revenueChartData } from "./mock-data";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--foreground))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--muted-foreground))",
  },
} satisfies ChartConfig;

export const RevenueChart = () => {
  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Revenue
          </CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-foreground" />
              Revenue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
              Expenses
            </span>
          </div>
        </div>
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-3xl font-semibold tabular-nums tracking-tight">$7,340</span>
          <span className="text-xs text-muted-foreground">today</span>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-2">
        <ChartContainer config={chartConfig} className="h-[280px] w-full aspect-auto">
          <AreaChart data={revenueChartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.12} />
                <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-expenses)" stopOpacity={0.08} />
                <stop offset="100%" stopColor="var(--color-expenses)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              strokeOpacity={0.5}
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11 }}
              tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`}
              width={45}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent formatter={(value) => `$${Number(value).toLocaleString()}`} />
              }
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="var(--color-expenses)"
              strokeWidth={1}
              fill="url(#fillExpenses)"
              dot={false}
              strokeDasharray="4 2"
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-revenue)"
              strokeWidth={1.5}
              fill="url(#fillRevenue)"
              dot={false}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
