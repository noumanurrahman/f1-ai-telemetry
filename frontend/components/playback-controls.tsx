import {useLapPlayback} from "@/lib/playback/LapPlaybackProvider"
import React from "react";
import {Button} from "./ui/button";

export default function PlaybackControls(): React.JSX.Element {
    const {
        play,
        pause,
        seek,
        setPlaybackRate,
        isPlaying,
        isReady,
    } = useLapPlayback()

    if (!isReady) {
        return <p>No telemetry</p>
    }

    return (
        <div className="flex gap-2 items-center">
            <Button onClick={isPlaying ? pause : play}>
                {isPlaying ? "Pause" : "Play"}
            </Button>

            <Button variant={'secondary'} onClick={() => seek(0)}>
                Restart
            </Button>

            <Button variant={"outline"} onClick={() => setPlaybackRate(1)}>
                1x
            </Button>

            <Button variant={"outline"} onClick={() => setPlaybackRate(2)}>
                2x
            </Button>
        </div>
    )
}