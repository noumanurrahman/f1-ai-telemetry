import {type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent,} from "@/components/ui/chart"
import {Label, Pie, PieChart} from "recharts"
import {COMPOUND_COLORS} from "@/lib/consts.ts";

const chartConfig = {
    laps: {
        label: "Laps",
    },
    soft: {
        label: "Soft",
        color: COMPOUND_COLORS.SOFT,
    },
    medium: {
        label: "Medium",
        color: COMPOUND_COLORS.MEDIUM,
    },
    hard: {
        label: "Hard",
        color: COMPOUND_COLORS.HARD,
    },
    intermediate: {
        label: "Intermediate",
        color: COMPOUND_COLORS.INTERMEDIATE,
    },
    wet: {
        label: "Wet",
        color: COMPOUND_COLORS.WET,
    },
} satisfies ChartConfig

export default function CompoundType({chartData, totalLaps}: { chartData: any, totalLaps: number }) {
    return (
        <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-62.5"
        >
            <PieChart>
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel/>}
                />
                <Pie
                    data={chartData}
                    dataKey="laps"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                >
                    <Label
                        content={({viewBox}) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                return (
                                    <text
                                        x={viewBox.cx}
                                        y={viewBox.cy}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                    >
                                        <tspan
                                            x={viewBox.cx}
                                            y={viewBox.cy}
                                            className="fill-foreground text-3xl font-bold"
                                        >
                                            {totalLaps.toLocaleString()}
                                        </tspan>
                                        <tspan
                                            x={viewBox.cx}
                                            y={(viewBox.cy || 0) + 24}
                                            className="fill-muted-foreground"
                                        >
                                            Laps
                                        </tspan>
                                    </text>
                                )
                            }
                        }}
                    />
                </Pie>
            </PieChart>
        </ChartContainer>
    )
}