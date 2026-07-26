import {useEffect, useMemo, useRef} from "react"
import {line as d3Line} from "d3-shape"
import {scaleLinear} from "d3-scale"
import {useLapPlayback} from "@/lib/playback/LapPlaybackProvider"
import type {TelemetryPoint} from "@/src/api/types"

const VIEWBOX_SIZE = 300
const PADDING = 4

interface TrackMapProps {
    /**
     * A clean lap used to generate the SVG path.
     * This should stay constant for a given circuit.
     */
    referenceTelemetry: TelemetryPoint[]
}

export function TrackMap({referenceTelemetry}: TrackMapProps) {
    const {subscribe} = useLapPlayback()

    const markerRef = useRef<SVGCircleElement>(null)

    // Build the track exactly once for this reference lap.
    const {pathData, project} = useMemo(
        () => buildTrack(referenceTelemetry),
        [referenceTelemetry]
    )

    useEffect(() => {
        return subscribe((sample) => {
            const node = markerRef.current
            if (!node) return

            const [x, y] = project(sample.x, sample.y)

            node.setAttribute("cx", x.toFixed(2))
            node.setAttribute("cy", y.toFixed(2))
        })
    }, [subscribe, project])

    return (
        <svg
            viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
            className="h-auto w-full"
        >
            <path
                d={pathData}
                fill="none"
                stroke="var(--ring)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            <circle
                ref={markerRef}
                r={5}
                fill={"var(--color-chart-2)"}
            />
        </svg>
    )
}

function buildTrack(telemetry: TelemetryPoint[]) {
    const xs = telemetry.map((s) => s.x)
    const ys = telemetry.map((s) => s.y)
    const xExtent: [number, number] = [Math.min(...xs), Math.max(...xs)]
    const yExtent: [number, number] = [Math.min(...ys), Math.max(...ys)]

    const xRange = xExtent[1] - xExtent[0]
    const yRange = yExtent[1] - yExtent[0]
    const drawSize = VIEWBOX_SIZE - PADDING * 2

    // ONE scale factor applied to both axes (derived from whichever range is
    // larger) — not independent x/y scales. Independent scales would stretch
    // corners into ellipses instead of preserving the track's actual shape.
    const scale = drawSize / Math.max(xRange, yRange)
    const xOffset = (VIEWBOX_SIZE - xRange * scale) / 2
    const yOffset = (VIEWBOX_SIZE - yRange * scale) / 2

    const xScale = scaleLinear().domain(xExtent).range([xOffset, xOffset + xRange * scale])
    // Y is flipped: telemetry coordinates increase "up" in track-space, but
    // SVG's Y axis increases downward. Without this the map renders mirrored.
    const yScale = scaleLinear().domain(yExtent).range([yOffset + yRange * scale, yOffset])

    const project = (x: number, y: number): [number, number] => [xScale(x), yScale(y)]

    const generateLine = d3Line<TelemetryPoint>()
        .x((s) => project(s.x, s.y)[0])
        .y((s) => project(s.x, s.y)[1])

    return {pathData: generateLine(telemetry) ?? "", project}
}
