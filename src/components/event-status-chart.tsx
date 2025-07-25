
"use client"

import * as React from "react"
import { Pie, PieChart, Cell } from "recharts"

import {
  CardContent,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface EventStatusChartProps {
  data: {
    name: string
    value: number
    color: string
  }[]
}

export function EventStatusChart({ data }: EventStatusChartProps) {
  const totalValue = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.value, 0)
  }, [data])

  return (
      <CardContent>
        <ChartContainer
          config={{}}
          className="mx-auto aspect-square h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={80}
              outerRadius={110}
              strokeWidth={2}
              cornerRadius={8}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="flex flex-col gap-3 mt-4 text-sm">
            {data.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                    </div>
                    <span className="font-semibold">{item.value}</span>
                </div>
            ))}
        </div>
      </CardContent>
  )
}
