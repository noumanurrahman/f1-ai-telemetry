import {
    Bar,
    BarChart,
    type BarShapeProps,
    Rectangle,
    ReferenceLine,
    type TooltipContentProps,
    XAxis,
    YAxis
} from "recharts"
import {type ChartConfig, ChartContainer, ChartTooltip} from "@/components/ui/chart"
import type {Lap} from "@/src/api/types";

export interface SectorTimes {
    sector1: number
    sector2: number
    sector3: number
}

export function getSessionAverageSectors(laps: Lap[]): SectorTimes {
    const n = laps.length
    return {
        sector1: laps.reduce((sum, l) => sum + (l.sector1Time ? l.sector1Time : 0), 0) / n,
        sector2: laps.reduce((sum, l) => sum + (l.sector2Time ? l.sector2Time : 0), 0) / n,
        sector3: laps.reduce((sum, l) => sum + (l.sector3Time ? l.sector3Time : 0), 0) / n,
    }
}

function renderDeltaBar(props: BarShapeProps) {
    const fill = (props.payload?.delta ?? 0) >= 0 ? "var(--color-green-400)" : "var(--color-red-400)"
    return <Rectangle {...props} fill={fill} radius={4}/>
}

export function getSessionBestSectors(laps: SectorTimes[]): SectorTimes {
    return {
        sector1: Math.min(...laps.map((l) => l.sector1)),
        sector2: Math.min(...laps.map((l) => l.sector2)),
        sector3: Math.min(...laps.map((l) => l.sector3)),
    }
}

function formatDelta(seconds: number): string {
    const sign = seconds >= 0 ? "+" : "-"
    return `${sign}${Math.abs(seconds).toFixed(3)}s`
}

interface SectorDeltaDatum {
    sector: string
    delta: number // positive = faster than reference, negative = slower
}

function SectorDeltaTooltip({active, payload}: TooltipContentProps<number, string>) {
    if (!active || !payload?.length) return null
    const datum = payload[0].payload as SectorDeltaDatum
    return (
        <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-sm">
            <div className="font-medium">{datum.sector}</div>
            <div className={datum.delta >= 0 ? "text-emerald-500" : "text-red-500"}>{formatDelta(datum.delta)}</div>
        </div>
    )
}

interface SectorDeltaChartProps {
    lap: Lap
    reference: SectorTimes
}

export function SectorDeltaChart({lap, reference}: SectorDeltaChartProps) {
    const data: SectorDeltaDatum[] = [
        {sector: "S1", delta: reference.sector1 - (lap.sector1Time ? lap.sector1Time : 0)},
        {sector: "S2", delta: reference.sector2 - (lap.sector2Time ? lap.sector2Time : 0)},
        {sector: "S3", delta: reference.sector3 - (lap.sector3Time ? lap.sector3Time : 0)},
    ]

    const chartConfig: ChartConfig = {
        delta: {label: "Sector delta"},
    }

    return (
        <ChartContainer config={chartConfig} className="h-[140px] w-full">
            <BarChart data={data} layout="vertical" margin={{top: 4, right: 24, bottom: 4, left: 4}}>
                <XAxis type="number" tickFormatter={formatDelta} tickLine={false} axisLine={false}/>
                <YAxis type="category" dataKey="sector" tickLine={false} axisLine={false} width={32}/>
                <ReferenceLine x={0} stroke="hsl(var(--border))"/>
                <ChartTooltip cursor={false}
                              content={<SectorDeltaTooltip active={false} payload={[]} coordinate={undefined}
                                                           accessibilityLayer={false} activeIndex={undefined}/>}/>
                <Bar dataKey="delta" radius={4} shape={renderDeltaBar}></Bar>
            </BarChart>
        </ChartContainer>
    )
}