// Suggested path: src/lib/playback/useLapTelemetry.ts

import {useEffect, useState} from "react"
import type {TelemetryPoint} from "../../src/api/types"
import apiClient from "../../src/api/client";

// Module-level, not component state — survives across lap switches and
// component remounts for the lifetime of the page session. This is separate
// from your AI-coaching cache table; this one only avoids redundant network
// calls within a single browser session, nothing is persisted.
const cache = new Map<string, TelemetryPoint[]>()

interface UseLapTelemetryResult {
    telemetry: TelemetryPoint[] | null // null while loading
    error: Error | null
}

// `cacheKey` should uniquely identify the lap, e.g. `${year}-${round}-${driver}-${lapNumber}`.
// `url` is the REST endpoint to fetch it from if not already cached — adjust
// the path below to match your actual FastAPI route; I don't know its exact
// shape, so this assumes the response body is already an array of
// TelemetrySample-shaped objects. If your API returns different field names
// (e.g. snake_case), map the response before returning it here.
export function useLapTelemetry(cacheKey: string, url: string): UseLapTelemetryResult {
    const [telemetry, setTelemetry] = useState<TelemetryPoint[] | null>(cache.get(cacheKey) ?? null)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        const cached = cache.get(cacheKey)
        if (cached) {
            setTelemetry(cached)
            return
        }

        let cancelled = false
        setTelemetry(null)
        setError(null)

        apiClient.get<TelemetryPoint[]>(url)
            .then((res) => {
                return res.data
            }).catch((err) => {
            throw new Error(`Failed to fetch telemetry: ${err.response.status}`)
        })
            .then((data) => {
                if (cancelled) return
                cache.set(cacheKey, data)
                setTelemetry(data)
            })
            .catch((err: Error) => {
                if (!cancelled) setError(err)
            })

        return () => {
            cancelled = true
        }
    }, [cacheKey, url])

    return {telemetry, error}
}