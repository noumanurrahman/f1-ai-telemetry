import type {TelemetryPoint} from "@/src/api/types"

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
}

function lerpDate(a: string, b: string, ratio: number): string {
    const ta = new Date(a).getTime()
    const tb = new Date(b).getTime()
    return new Date(lerp(ta, tb, ratio)).toISOString()
}

function findBracketIndex(samples: TelemetryPoint[], t: number): number {
    if (t <= samples[0].time) return 0
    if (t >= samples[samples.length - 1].time) return samples.length - 2

    let lo = 0
    let hi = samples.length - 2
    while (lo < hi) {
        const mid = (lo + hi + 1) >> 1
        if (samples[mid].time <= t) lo = mid
        else hi = mid - 1
    }
    return lo
}

export function interpolateSample(samples: TelemetryPoint[], t: number): TelemetryPoint {
    const i = findBracketIndex(samples, t)
    const a = samples[i]
    const b = samples[i + 1] ?? a
    const span = b.time - a.time
    const ratio = span > 0 ? (t - a.time) / span : 0

    return {
        time: t,
        sessionTime: lerp(a.sessionTime, b.sessionTime, ratio),
        date: lerpDate(a.date, b.date, ratio),
        distance: lerp(a.distance, b.distance, ratio),
        relativeDistance: lerp(a.relativeDistance, b.relativeDistance, ratio),
        distanceToDriverAhead: lerp(a.distanceToDriverAhead, b.distanceToDriverAhead, ratio),
        x: lerp(a.x, b.x, ratio),
        y: lerp(a.y, b.y, ratio),
        z: lerp(a.z, b.z, ratio),
        speed: lerp(a.speed, b.speed, ratio),
        throttle: lerp(a.throttle, b.throttle, ratio),
        rpm: lerp(a.rpm, b.rpm, ratio),
        brake: a.brake,
        gear: a.gear,
        drs: a.drs,
        driverAhead: a.driverAhead,
    }
}