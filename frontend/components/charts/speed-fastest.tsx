import {Area, AreaChart, CartesianGrid, XAxis} from "recharts";
import type {ChartConfig} from "@/components/ui/chart"
import {ChartContainer, ChartTooltip, ChartTooltipContent} from "@/components/ui/chart";
import type {TelemetryPoint} from "@/src/api/types.ts";

const chartConfig = {
    current: {
        label: "Current Lap",
        color: "#ffffff",
    },
    fastest: {
        label: "Fastest Lap",
        color: "#ffffff",
    }
} satisfies ChartConfig

export default function FastestSpeed({telemetry, fastest}: { telemetry: TelemetryPoint[], fastest: TelemetryPoint[] }) {
    return (
        <ChartContainer config={chartConfig}>
            <AreaChart
                accessibilityLayer
                data={telemetry.map((point, index) => {
                    return {
                        time: point.time,
                        current: point.speed,
                        fastest: fastest.at(index)?.speed
                    }
                })}
                margin={{
                    left: 12,
                    right: 12,
                }}
            >
                <defs>
                    <linearGradient id="fillCurrent" x1="0" y1="0" x2="0" y2="1">
                        <stop
                            offset="5%"
                            stopColor="var(--color-green-300)"
                            stopOpacity={0.8}
                        />
                        <stop
                            offset="95%"
                            stopColor="var(--color-green-300)"
                            stopOpacity={0.1}
                        />
                    </linearGradient>
                    <linearGradient id="fillFastest" x1="0" y1="0" x2="0" y2="1">
                        <stop
                            offset="5%"
                            stopColor="var(--color-purple-400)"
                            stopOpacity={0.8}
                        />
                        <stop
                            offset="95%"
                            stopColor="var(--color-purple-400)"
                            stopOpacity={0.1}
                        />
                    </linearGradient>
                </defs>
                <CartesianGrid vertical={false}/>
                <XAxis
                    dataKey="time"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    // tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel/>}
                />
                <Area
                    dataKey="fastest"
                    type="linear"
                    fill="url(#fillFastest)"
                    stroke="var(--color-purple-300)"
                    strokeWidth={2}
                    dot={false}
                />
                <Area
                    dataKey="current"
                    type="linear"
                    fill="url(#fillCurrent)"
                    stroke="var(--color-green-300)"
                    strokeWidth={2}
                    dot={false}
                />
            </AreaChart>
        </ChartContainer>
    )
}