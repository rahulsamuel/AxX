
"use client"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const chartConfig = {
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-1))",
  },
  started: {
    label: "Started",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

interface MonthlyProgressChartProps {
    data: { month: string; completed: number, started: number }[];
}

export function MonthlyProgressChart({ data }: MonthlyProgressChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <BarChart accessibilityLayer data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis 
            tickLine={false}
            axisLine={false}
        />
        <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
            dataKey="completed"
            fill="var(--color-completed)"
            radius={4}
        />
        <Bar
            dataKey="started"
            fill="var(--color-started)"
            radius={4}
        />
        </BarChart>
    </ChartContainer>
  );
}
