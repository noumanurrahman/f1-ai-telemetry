import type {Route} from "./+types/dashboard"
import {dataService} from "@/src/api/service.ts";
import {useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import type {TelemetryPoint} from "@/src/api/types.ts";

export async function clientLoader({params}: Route.LoaderArgs) {
    const driver = await dataService.driver(Number(params.year), Number(params.round), params.driver);
    const laps = await dataService.lapsByDriver(Number(params.year), Number(params.round), params.driver);
    return {driver, laps};
}

export default function Component({loaderData, params}: Route.ComponentProps) {
    const [currentLap, setCurrentLap] = useState(1)
    const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([])

    async function loadTelemetry() {
        const apiData = await dataService.telemetry(Number(params.year), Number(params.round), currentLap, loaderData.driver.driverCode);
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
            <Button onClick={loadTelemetry}>Load telemetry</Button>
            {telemetry.map((point) => (
                <div key={point.time}>
                    <p>Speed: {point.speed}</p>
                    <p>Throttle: {point.throttle}</p>
                    <p>Brake: {point.brake}</p>
                    <p>--------------</p>
                </div>
            ))}
        </>
    )
}