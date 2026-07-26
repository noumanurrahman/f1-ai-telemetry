// Suggested path: src/lib/playback/interpolate.ts
// (this used to define its own TelemetrySample type — now imports your
// existing TelemetryPoint instead, so just the interpolation logic lives here)

import type {TelemetryPoint} from "@/src/api/types"

// ^ adjust to wherever TelemetryPoint actually lives in your project

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
}

// date is an ISO string, not a number — interpolate it by converting to
// epoch milliseconds, lerping that, then converting back.
function lerpDate(a: string, b: string, ratio: number): string {
    const ta = new Date(a).getTime()
    const tb = new Date(b).getTime()
    return new Date(lerp(ta, tb, ratio)).toISOString()
}

// Assumes `samples` is sorted ascending by `time`, AND that `time` holds
// seconds elapsed since LAP START (not session start — that's what
// `sessionTime` looks like it's for). If it's actually the other way
// around in your data, swap which field this function keys off of.
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

// Returns a synthetic sample at time `t`, linearly interpolated between the
// two real samples that bracket it.
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
        // Discrete/categorical values: snap to the earlier sample rather than
        // interpolating — there's no meaningful "half-braking", "gear 3.4", or
        // fractional DRS state, and driverAhead is a driver code, not a number.
        brake: a.brake,
        gear: a.gear,
        drs: a.drs,
        driverAhead: a.driverAhead,
    }
}