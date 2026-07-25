import type {Route} from "./+types/dashboard"
import {dataService} from "@/src/api/service.ts";
import {useEffect, useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import type {TelemetryPoint, TyreCompound} from "@/src/api/types.ts";
import FastestSpeed from "@/components/charts/speed-fastest.tsx";
import CompoundType from "@/components/charts/compound-pie.tsx";
import {TopSpeedVsLapTimeChart} from "@/components/charts/top-speed-scatter.tsx";
import {getSessionAverageSectors, SectorDeltaChart} from "@/components/charts/sector-delta.tsx";
import {Card, CardContent} from "@/components/ui/card.tsx";

export async function clientLoader({params}: Route.LoaderArgs) {
    const driver = await dataService.driver(Number(params.year), Number(params.round), params.driver);
    const laps = await dataService.lapsByDriver(Number(params.year), Number(params.round), params.driver);
    const fastest = laps.filter((lap) => lap.lapTime != null && lap.isPersonalBest).reduce((prev, curr) => (prev.lapTime < curr.lapTime ? prev : curr), laps[0]);
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
    const telemetry = await loadTelemetry(Number(params.year), Number(params.round), params.driver, 1);
    return {driver, laps, fastest, fastestTel, compoundType, telemetry};
}


async function loadTelemetry(year: number, round: number, driver: string, lapNumber: number) {
    return await dataService.telemetry(year, round, lapNumber, driver);
}


export default function Component({loaderData, params}: Route.ComponentProps) {
    const [currentLap, setCurrentLap] = useState(1)
    const [telemetry, setTelemetry] = useState<TelemetryPoint[]>(loaderData.telemetry)


    useEffect(() => {
        loadTelemetry(Number(params.year), Number(params.round), loaderData.driver.driverCode, Number(currentLap)).then((data) => {
            setTelemetry(data)
        }).catch((err) => console.error("Error loading telemetry:", err))
    }, [currentLap])

    return (
        <section className={"flex flex-col gap-4"}>
            <h1>DASHBOARD – {loaderData.driver.fullName} ({loaderData.driver.driverCode}) POS:
                [{loaderData.driver.classifiedPosition}]</h1>
            <div className={"flex flex-row items-center gap-3"}>
                {loaderData.laps.at(currentLap - 1)?.lapNumber} - {loaderData.laps.at(currentLap - 1)?.lapTime}s
                <Button variant={"outline"} onClick={() => setCurrentLap((prev) => Math.max(1, prev - 1))}>
                    Previous Lap
                </Button>
                <Button variant={"outline"}
                        onClick={() => setCurrentLap((prev) => Math.min(loaderData.laps.length, prev + 1))}>
                    Next Lap
                </Button>
            </div>
            FASTEST: {loaderData.fastest.lapNumber} - {loaderData.fastest.lapTime}
            <div className={"flex flex-row max-w-1/2 gap-4"}>
                <Card className={"flex aspect-square align-center min-w-1/2"}>
                    <CardContent className={"flex-1 pb-0 content-center"}>
                        <CompoundType chartData={loaderData.compoundType} totalLaps={loaderData.laps.length}/>
                    </CardContent>
                </Card>
                <Card className={"min-w-1/2 justify-center px-4"}>
                    <SectorDeltaChart lap={loaderData.laps[currentLap - 1]}
                                      reference={getSessionAverageSectors(loaderData.laps)}/>
                </Card>
            </div>
            {telemetry.length > 0 ? (
                <FastestSpeed telemetry={telemetry} fastest={loaderData.fastestTel}/>
            ) : null}
            <TopSpeedVsLapTimeChart laps={loaderData.laps.filter((lap) => !lap.isPitLap && lap.isAccurate)}/>
        </section>
    )
}