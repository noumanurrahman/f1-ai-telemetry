import type {Route} from "./+types/dashboard"
import {dataService} from "@/src/api/service.ts";
import {useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import type {TelemetryPoint, TyreCompound} from "@/src/api/types.ts";
import FastestSpeed from "@/components/charts/speed-fastest.tsx";
import CompoundType from "@/components/charts/compound-pie.tsx";
import {TopSpeedVsLapTimeChart} from "@/components/charts/top-speed-scatter.tsx";

export async function clientLoader({params}: Route.LoaderArgs) {
    const driver = await dataService.driver(Number(params.year), Number(params.round), params.driver);
    const laps = await dataService.lapsByDriver(Number(params.year), Number(params.round), params.driver);
    const fastest = laps.reduce((prev, curr) => (prev.lapTime < curr.lapTime ? prev : curr), laps[0]);
    const fastestTel = await dataService.telemetry(Number(params.year), Number(params.round), Number(fastest.lapNumber), params.driver);
    const compoundType: { name: TyreCompound, laps: number, fill: string }[] = [
        {name: "SOFT", laps: laps.filter((lap) => lap.compound === "SOFT").length, fill: "var(--color-soft)"},
        {name: "MEDIUM", laps: laps.filter((lap) => lap.compound === "MEDIUM").length, fill: "var(--color-medium)"},
        {name: "HARD", laps: laps.filter((lap) => lap.compound === "HARD").length, fill: "var(--color-hard)"},
        {
            name: "INTERMEDIATE",
            laps: laps.filter((lap) => lap.compound === "INTERMEDIATE").length,
            fill: "var(--color-intermediate)"
        },
        {name: "WET", laps: laps.filter((lap) => lap.compound === "WET").length, fill: "var(--color-wet)"},
    ]
    return {driver, laps, fastest, fastestTel, compoundType};
}


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
            <FastestSpeed telemetry={telemetry} fastest={loaderData.fastestTel}/>
            <CompoundType chartData={loaderData.compoundType} totalLaps={loaderData.laps.length}/>
            <TopSpeedVsLapTimeChart laps={}/>
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