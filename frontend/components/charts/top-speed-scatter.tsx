import {useMemo} from "react"
import {CartesianGrid, Scatter, ScatterChart, XAxis, YAxis, ZAxis} from "recharts"
import {type ChartConfig, ChartContainer, ChartLegend, ChartLegendContent} from "@/components/ui/chart"
import type {TyreCompound} from "@/src/api/types";
import type {Lap} from "@/src/api/types.ts";
import {COMPOUND_COLORS} from "@/lib/consts.ts";

function formatLapTime(seconds: number | null | undefined): string {
    if (seconds == null) return "—"
    const m = Math.floor(seconds / 60)
    const s = (seconds % 60).toFixed(3)
    return `${m}:${s.padStart(6, "0")}`
}

export function TopSpeedVsLapTimeChart({laps}: { laps: Lap[] }) {
    // Group laps by compound so each compound renders as its own Scatter series —
    // that's what gives us separate legend entries and per-compound coloring.
    const byCompound = useMemo(() => {
        const groups: Partial<Record<TyreCompound, Lap[]>> = {}
        for (const lap of laps) {
            if (lap.topSpeed == null || lap.lapTime == null) continue
                ;
            (groups[lap.compound] ??= []).push(lap)
        }
        return groups
    }, [laps])

    // ChartContainer wants a config object so it can theme + label each series.
    const chartConfig = useMemo(() => {
        const config: ChartConfig = {}
        for (const compound of Object.keys(byCompound) as TyreCompound[]) {
            config[compound] = {
                label: compound.charAt(0) + compound.slice(1).toLowerCase(),
                color: COMPOUND_COLORS[compound],
            }
        }
        return config
    }, [byCompound])

    return (
        <ChartContainer config={chartConfig} className="aspect-video min-h-[320px] w-full">
            <ScatterChart margin={{top: 16, right: 16, bottom: 8, left: 8}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <XAxis
                    type="number"
                    dataKey="topSpeed"
                    name="Top speed"
                    unit=" km/h"
                    domain={["dataMin - 5", "dataMax + 5"]}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    type="number"
                    dataKey="lapTime"
                    name="Lap time"
                    domain={["dataMin - 5", "dataMax + 5"]}
                    tickFormatter={formatLapTime}
                    tickLine={false}
                    axisLine={false}
                    width={64}
                />
                {/* Fixes every point to the same size — swap dataKey to something like
            "tyreLife" later if you want point size to encode a third variable. */}
                <ZAxis range={[60, 60]}/>
                <ChartLegend content={<ChartLegendContent/>}/>
                {(Object.entries(byCompound) as [TyreCompound, Lap[]][]).map(([compound, data]) => (
                    <Scatter key={compound} name={compound} data={data} fillOpacity={0.7}
                             fill={COMPOUND_COLORS[compound]}/>
                ))}
            </ScatterChart>
        </ChartContainer>
    )
}