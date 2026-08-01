import {useEffect, useMemo, useRef} from "react"
import {curveCatmullRom, line as d3Line} from "d3-shape"
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
        const node = markerRef.current
        if (!node || referenceTelemetry.length === 0) return
        const [x, y] = project(referenceTelemetry[0].x, referenceTelemetry[0].y)
        node.setAttribute("cx", x.toFixed(2))
        node.setAttribute("cy", y.toFixed(2))
    }, [project, referenceTelemetry])

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
        <div
            className="mx-auto w-full max-w-[560px] rounded-xl border border-border/60 p-3 sm:p-4">
            <svg
                viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
                className="aspect-square h-auto w-full rounded-lg"
                aria-label="Track map with live playback marker"
                role="img"
            >
                <defs>
                    <filter id="markerGlow" x="-120%" y="-120%" width="340%" height="340%">
                        <feGaussianBlur stdDeviation="2.6" result="blur"/>
                        <feMerge>
                            <feMergeNode in="blur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                    <linearGradient id="trackStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-border)"/>
                        <stop offset="100%" stopColor="var(--color-border)"/>
                    </linearGradient>
                </defs>

                <path
                    d={pathData}
                    fill="none"
                    stroke="var(--color-muted)"
                    strokeOpacity={0.45}
                    strokeWidth={8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d={pathData}
                    fill="none"
                    stroke="url(#trackStroke)"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                <circle
                    ref={markerRef}
                    r={5}
                    fill="var(--color-chart-2)"
                />
            </svg>
        </div>
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

    const scale = drawSize / Math.max(xRange, yRange)
    const xOffset = (VIEWBOX_SIZE - xRange * scale) / 2
    const yOffset = (VIEWBOX_SIZE - yRange * scale) / 2

    const xScale = scaleLinear().domain(xExtent).range([xOffset, xOffset + xRange * scale])
    const yScale = scaleLinear().domain(yExtent).range([yOffset + yRange * scale, yOffset])

    const project = (x: number, y: number): [number, number] => [xScale(x), yScale(y)]

    const generateLine = d3Line<TelemetryPoint>()
        .curve(curveCatmullRom.alpha(0.6))
        .x((s) => project(s.x, s.y)[0])
        .y((s) => project(s.x, s.y)[1])

    return {pathData: generateLine(telemetry) ?? "", project}
}
