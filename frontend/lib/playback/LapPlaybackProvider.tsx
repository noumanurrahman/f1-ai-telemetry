// Suggested path: src/lib/playback/LapPlaybackProvider.tsx

import {createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState} from "react"
import {interpolateSample} from "./telemetry"
import type {TelemetryPoint} from "@/src/api/types"
// ^ adjust to wherever TelemetryPoint actually lives in your project

type SampleListener = (sample: TelemetryPoint) => void

interface LapPlaybackContextValue {
    subscribe: (listener: SampleListener) => () => void
    play: () => void
    pause: () => void
    seek: (time: number) => void
    setPlaybackRate: (rate: number) => void
    isPlaying: boolean
    playbackRate: number
    duration: number
    isReady: boolean
}

const LapPlaybackContext = createContext<LapPlaybackContextValue | null>(null)

export function useLapPlayback(): LapPlaybackContextValue {
    const ctx = useContext(LapPlaybackContext)
    if (!ctx) throw new Error("useLapPlayback must be used inside a LapPlaybackProvider")
    return ctx
}

interface LapPlaybackProviderProps {
    telemetry: TelemetryPoint[]
    children: ReactNode
}

// Mount one of these PER LAP — e.g. `<LapPlaybackProvider key={lapKey} .../>` —
// so switching laps fully remounts (and resets) playback state instead of you
// having to patch it. The effect below is a defensive backstop, not the
// primary reset mechanism.
export function LapPlaybackProvider({telemetry, children}: LapPlaybackProviderProps) {
    const duration = telemetry.length > 0 ? telemetry[telemetry.length - 1].time : 0

    // isPlaying/playbackRate are React state because they change rarely (a
    // button click) and something needs to re-render when they do (e.g. a
    // play/pause icon). currentTime and the "live" playback rate are refs
    // instead — currentTime changes up to 60x/sec, and reading rate from a ref
    // inside the RAF loop means changing speed mid-playback doesn't force the
    // loop to tear down and restart.
    const [isPlaying, setIsPlaying] = useState(false)
    const [playbackRate, setPlaybackRateState] = useState(1)

    const currentTimeRef = useRef(0)
    const playbackRateRef = useRef(1)
    const listenersRef = useRef(new Set<SampleListener>())
    const rafRef = useRef<number | null>(null)
    const lastFrameRef = useRef<number | null>(null)

    const notify = useCallback(() => {
        if (telemetry.length === 0) return
        const sample = interpolateSample(telemetry, currentTimeRef.current)
        listenersRef.current.forEach((listener) => listener(sample))
    }, [telemetry])

    const stopLoop = useCallback(() => {
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
        rafRef.current = null
        lastFrameRef.current = null
    }, [])

    const tick = useCallback(
        (now: number) => {
            if (lastFrameRef.current == null) lastFrameRef.current = now
            const dtSeconds = ((now - lastFrameRef.current) / 1000) * playbackRateRef.current
            lastFrameRef.current = now

            currentTimeRef.current = Math.min(currentTimeRef.current + dtSeconds, duration)
            notify()

            if (currentTimeRef.current >= duration) {
                setIsPlaying(false)
                stopLoop()
                return
            }
            rafRef.current = requestAnimationFrame(tick)
        },
        [duration, notify, stopLoop]
    )

    useEffect(() => {
        if (!isPlaying) return
        lastFrameRef.current = null
        rafRef.current = requestAnimationFrame(tick)
        return stopLoop
    }, [isPlaying, tick, stopLoop])

    // Belt-and-suspenders: stop a running loop if the telemetry array identity
    // changes out from under a mounted provider.
    useEffect(() => stopLoop, [telemetry, stopLoop])

    const subscribe = useCallback(
        (listener: SampleListener) => {
            listenersRef.current.add(listener)
            // Push the current position immediately so a chart that mounts mid-
            // playback (or while paused) doesn't sit at its default position until
            // the next tick.
            if (telemetry.length > 0) {
                listener(interpolateSample(telemetry, currentTimeRef.current))
            }
            return () => {
                listenersRef.current.delete(listener)
            }
        },
        [telemetry]
    )

    const play = useCallback(() => {
        if (currentTimeRef.current >= duration) currentTimeRef.current = 0
        setIsPlaying(true)
    }, [duration])

    const pause = useCallback(() => setIsPlaying(false), [])

    const seek = useCallback(
        (time: number) => {
            currentTimeRef.current = Math.max(0, Math.min(time, duration))
            notify()
        },
        [duration, notify]
    )

    const setPlaybackRate = useCallback((rate: number) => {
        playbackRateRef.current = rate
        setPlaybackRateState(rate)
    }, [])

    const value = useMemo<LapPlaybackContextValue>(
        () => ({
            subscribe,
            play,
            pause,
            seek,
            setPlaybackRate,
            isPlaying,
            playbackRate,
            duration,
            isReady: telemetry.length > 0,
        }),
        [subscribe, play, pause, seek, setPlaybackRate, isPlaying, playbackRate, duration, telemetry.length]
    )

    return <LapPlaybackContext.Provider value={value}>{children}</LapPlaybackContext.Provider>
}