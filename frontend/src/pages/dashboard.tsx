import type {Route} from "./+types/dashboard"
import {dataService} from "@/src/api/service.ts";
import {useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import type {TelemetryPoint} from "@/src/api/types.ts";
import {type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent} from "@/components/ui/chart.tsx";
import {CartesianGrid, Line, LineChart, XAxis} from "recharts";

export async function clientLoader({params}: Route.LoaderArgs) {
    const driver = await dataService.driver(Number(params.year), Number(params.round), params.driver);
    const laps = await dataService.lapsByDriver(Number(params.year), Number(params.round), params.driver);
    const fastest = laps.reduce((prev, curr) => (prev.lapTime < curr.lapTime ? prev : curr), laps[0]);
    console.log(fastest.lapNumber)
    const fastestTel = await dataService.telemetry(Number(params.year), Number(params.round), Number(fastest.lapNumber), params.driver);
    return {driver, laps, fastest, fastestTel};
}

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

export default function Component({loaderData, params}: Route.ComponentProps) {
    const [currentLap, setCurrentLap] = useState(1)
    const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([])

    async function loadTelemetry() {
        const apiData = await dataService.telemetry(Number(params.year), Number(params.round), Number(currentLap), loaderData.driver.driverCode);
        setTelemetry(apiData);
    }

    return (
        <>
            <h1>DASHBOARD – {loaderData.driver.fullName} ({loaderData.driver.driverCode}) POS:
                [{loaderData.driver.classifiedPosition}]</h1>
            {loaderData.laps.at(currentLap - 1)?.lapNumber} - {loaderData.laps.at(currentLap - 1)?.lapTime}s
            <Button onClick={() => setCurrentLap((prev) => Math.max(1, prev - 1))}>
                Previous Lap
            </Button>
            <Button onClick={() => setCurrentLap((prev) => Math.min(loaderData.laps.length, prev + 1))}>
                Next Lap
            </Button>
            FASTEST: {loaderData.fastest.lapNumber} - {loaderData.fastest.lapTime}
            <Button onClick={loadTelemetry}>Load telemetry</Button>
            <ChartContainer config={chartConfig}>
                <LineChart
                    accessibilityLayer
                    data={telemetry.map((point, index) => {
                        return {
                            time: point.time,
                            current: point.speed,
                            fastest: loaderData.fastestTel.at(index)?.speed
                        }
                    })}
                    margin={{
                        left: 12,
                        right: 12,
                    }}
                >
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
                    <Line
                        dataKey="fastest"
                        type="linear"
                        stroke="var(--chart-4)"
                        strokeWidth={2}
                        dot={false}
                    />
                    <Line
                        dataKey="current"
                        type="linear"
                        stroke="var(--chart-1)"
                        strokeWidth={2}
                        dot={false}
                    />
                </LineChart>
            </ChartContainer>
            {telemetry.map((point) => (
                <div key={point.time}>
                    <p>Speed: {point.speed}</p>
                    <p>Throttle: {point.throttle}</p>
                    <p>Brake: {point.brake ? "YES" : "NO"}</p>
                    <p>--------------</p>
                </div>
            ))}
        </>
    )
}