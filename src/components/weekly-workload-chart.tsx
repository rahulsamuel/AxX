"use client"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

const chartConfig = {
  planned: {
    label: "Planned",
    color: "hsl(var(--primary))",
  },
  actual: {
    label: "Actual",
    color: "hsl(var(--chart-2))",
  },
  capacity: {
    label: "Capacity",
    color: "hsl(var(--muted))",
  },
} satisfies ChartConfig;

interface WeeklyWorkloadChartProps {
    data: { day: string; planned: number; actual: number; capacity: number }[];
}

export function WeeklyWorkloadChart({ data }: WeeklyWorkloadChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
        <BarChart accessibilityLayer data={data} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
            dataKey="day"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
        />
        <YAxis 
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            domain={[0, 12]}
        />
        <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
            dataKey="capacity"
            fill="var(--color-capacity)"
            radius={[4, 4, 0, 0]}
            stackId="a"
        />
        <Bar
            dataKey="actual"
            fill="var(--color-actual)"
            radius={[4, 4, 0, 0]}
            stackId="a"
        />
        <Bar
            dataKey="planned"
            fill="var(--color-planned)"
            radius={[4, 4, 0, 0]}
            stackId="b"
        />
        </BarChart>
    </ChartContainer>
  );
}
