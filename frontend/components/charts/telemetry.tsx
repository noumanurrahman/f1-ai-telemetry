import {useLapPlayback} from "../../lib/playback/LapPlaybackProvider";
import {useEffect, useState} from "react";
import type {TelemetryPoint} from "@/src/api/types.ts";


export function Telemetry() {
    const {subscribe} = useLapPlayback()
    const [sample, setSample] = useState<TelemetryPoint | null>(null)

    useEffect(() => {
        return subscribe((sample) => {
            setSample(sample)
        })
    }, [subscribe])

    return (<>
        {sample && (
            <div className="flex flex-col mx-4 gap-2 justify-center">
                <div className={"flex gap-2 w-full justify-between"}>
                    <div className={"flex gap-2 items-center"}>Speed: <div
                        className={"px-4 py-2 rounded bg-secondary border"}>{sample.speed.toFixed(1)} km/hr</div></div>
                    <div className={"flex gap-2 items-center"}>Throttle: <div
                        className={"px-4 py-2 rounded bg-secondary border"}>{sample.throttle.toFixed(0)}%</div></div>
                </div>
                <div className={"flex gap-2 w-full justify-between"}>
                    <div
                        className={`w-full py-2 flex justify-center rounded bg-secondary border`}>Gear: {sample.gear}
                    </div>
                    <div
                        className={`w-full py-2 flex justify-center rounded ${sample.brake ? "bg-red-500 font-bold" : "bg-secondary"} border`}>Brake
                    </div>
                    <div
                        className={`w-full py-2 flex justify-center rounded ${sample.drs >= 2 ? "bg-blue-500 font-bold" : "bg-secondary"} border`}>DRS
                    </div>
                </div>
            </div>
        )}
    </>)
}