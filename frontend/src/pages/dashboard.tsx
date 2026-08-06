import type {Route} from "./+types/dashboard"
import {dataService} from "@/src/api/service.ts";
import {useEffect, useMemo, useRef, useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import type {LapCoachingResponse, TelemetryPoint, TyreCompound} from "@/src/api/types.ts";
import FastestSpeed from "@/components/charts/speed-fastest.tsx";
import CompoundType from "@/components/charts/compound-pie.tsx";
import {TopSpeedVsLapTimeChart} from "@/components/charts/top-speed-scatter.tsx";
import {getSessionAverageSectors, SectorDeltaChart} from "@/components/charts/sector-delta.tsx";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {LapPlaybackProvider} from "@/lib/playback/LapPlaybackProvider.tsx";
import {TrackMap} from "@/components/charts/trackmap.tsx";
import PlaybackControls from "@/components/playback-controls.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {InlineError, InlineLoading, RouteErrorBoundary} from "@/components/page-states.tsx";
import DriverHeadshot from "@/components/driver-headshot.tsx";
import {getTeamColor} from "@/lib/team-style.ts";
import {formatText} from "@/lib/formatter.tsx";

export async function clientLoader({params}: Route.LoaderArgs) {
    const driver = await dataService.driver(Number(params.year), Number(params.round), params.driver);
    const race = await dataService.raceByRound(Number(params.year), Number(params.round));
    const laps = await dataService.lapsByDriver(Number(params.year), Number(params.round), params.driver);
    if (laps.length === 0) {
        throw new Error(`No laps available for ${params.driver} in this race`);
    }
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
    return {driver, laps, fastest, fastestTel, compoundType, telemetry, race};
}


async function loadTelemetry(year: number, round: number, driver: string, lapNumber: number) {
    return await dataService.telemetry(year, round, lapNumber, driver);
}


export default function Component({loaderData, params}: Route.ComponentProps) {
    const [currentLap, setCurrentLap] = useState(1)
    const [telemetry, setTelemetry] = useState<TelemetryPoint[]>(loaderData.telemetry)
    const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(false);
    const [telemetryError, setTelemetryError] = useState<string | null>(null);
    const [coaching, setCoaching] = useState<LapCoachingResponse | null>(null);
    const [isGeneratingCoaching, setIsGeneratingCoaching] = useState(false);
    const [coachingError, setCoachingError] = useState<string | null>(null);
    const didMount = useRef(false);
    const selectedLap = loaderData.laps.at(currentLap - 1);

    const fetchLapTelemetry = (lapNumber: number) => {
        setIsLoadingTelemetry(true);
        setTelemetryError(null);
        return loadTelemetry(Number(params.year), Number(params.round), loaderData.driver.driverCode, lapNumber)
            .then((data) => {
                setTelemetry(data);
            })
            .catch((error: unknown) => {
                const message = error instanceof Error ? error.message : "Failed to load telemetry";
                setTelemetryError(message);
                setTelemetry([]);
            })
            .finally(() => {
                setIsLoadingTelemetry(false);
            });
    };

    useEffect(() => {
        if (!didMount.current) {
            didMount.current = true;
            return;
        }
        void fetchLapTelemetry(currentLap);
    }, [currentLap]);

    const averageSectors = useMemo(() => getSessionAverageSectors(loaderData.laps), [loaderData.laps]);
    const teamColor = getTeamColor(loaderData.driver.teamName);

    const generateCoaching = () => {
        if (!selectedLap) {
            return;
        }
        setIsGeneratingCoaching(true);
        setCoachingError(null);
        return dataService.analysis(Number(params.year), Number(params.round), selectedLap.lapNumber, loaderData.driver.driverCode)
            .then((payload) => {
                setCoaching(payload);
                setIsGeneratingCoaching(false);
            })
            .catch((error: unknown) => {
                const message = error instanceof Error ? error.message : "Failed to generate analysis";
                setCoachingError(message);
                setCoaching(null);
                setIsGeneratingCoaching(false);
            })
    };

    return (
        <section className="space-y-6">
            <Card className="overflow-hidden"
                  style={{borderColor: `color-mix(in oklch, ${teamColor}, var(--border) 65%)`}}>
                <div className="h-1.5 w-full" style={{backgroundColor: teamColor}}/>
                <CardHeader className="gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <DriverHeadshot
                                src={loaderData.driver.headshotUrl}
                                name={loaderData.driver.fullName}
                                teamColor={teamColor}
                                className="size-18"
                            />
                            <div className="space-y-1">
                                <CardTitle>{loaderData.driver.fullName}</CardTitle>
                                <CardDescription>{loaderData.driver.teamName}</CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary">{loaderData.driver.driverCode}</Badge>
                            <Badge variant="outline">#{loaderData.driver.driverNumber}</Badge>
                        </div>
                    </div>
                    <CardDescription>
                        {loaderData.race.location}, {loaderData.race.country} •
                        Position {loaderData.driver.classifiedPosition}
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                    <Card size="sm">
                        <CardContent className="space-y-1">
                            <p className="text-xs text-muted-foreground">Current Lap</p>
                            <p className="text-lg">{selectedLap?.lapNumber ?? "—"}</p>
                        </CardContent>
                    </Card>
                    <Card size="sm">
                        <CardContent className="space-y-1">
                            <p className="text-xs text-muted-foreground">Current Lap Time</p>
                            <p className="text-lg">{selectedLap?.lapTime?.toFixed(3) ?? "—"}s</p>
                        </CardContent>
                    </Card>
                    <Card size="sm">
                        <CardContent className="space-y-1">
                            <p className="text-xs text-muted-foreground">Fastest Lap</p>
                            <p className="text-lg">{loaderData.fastest.lapNumber} • {loaderData.fastest.lapTime?.toFixed(3)}s</p>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Lap Controls</CardTitle>
                    <CardDescription>Pick a lap to compare telemetry with this driver's fastest lap.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-[220px_1fr_auto_auto]">
                    <Select value={currentLap.toString()} onValueChange={(value) => setCurrentLap(Number(value))}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select lap"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {loaderData.laps.map((lap) => (
                                    <SelectItem key={lap.lapNumber} value={lap.lapNumber.toString()}>
                                        Lap {lap.lapNumber} ({lap.lapTime?.toFixed(3)}s)
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <div className="text-sm text-muted-foreground content-center">
                        Compound {selectedLap?.compound ?? "—"} • Tyre life {selectedLap?.tyreLife ?? "—"}
                    </div>
                    <Button variant="outline" onClick={() => setCurrentLap((prev) => Math.max(1, prev - 1))}>
                        Previous
                    </Button>
                    <Button variant="outline"
                            onClick={() => setCurrentLap((prev) => Math.min(loaderData.laps.length, prev + 1))}>
                        Next
                    </Button>
                </CardContent>
            </Card>

            {isLoadingTelemetry ? <InlineLoading label="Loading lap telemetry..."/> : null}
            {telemetryError ?
                <InlineError message={telemetryError} onRetry={() => void fetchLapTelemetry(currentLap)}/> : null}

            <Separator/>

            <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Speed Trace</CardTitle>
                            <CardDescription>Current selected lap vs fastest lap speed profile.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {telemetry.length > 0 ? (
                                <FastestSpeed telemetry={telemetry} fastest={loaderData.fastestTel}/>
                            ) : (
                                <p className="text-sm text-muted-foreground">No telemetry available for this lap.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Top Speed vs Lap Time</CardTitle>
                            <CardDescription>Lap performance distribution by tyre compound.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TopSpeedVsLapTimeChart
                                laps={loaderData.laps.filter((lap) => !lap.isPitLap && lap.isAccurate)}/>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Lap Table</CardTitle>
                            <CardDescription>Quick lap-by-lap summary for this driver.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Lap</TableHead>
                                        <TableHead>Time (s)</TableHead>
                                        <TableHead>Compound</TableHead>
                                        <TableHead>Top Speed</TableHead>
                                        <TableHead>Pit</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loaderData.laps.map((lap) => (
                                        <TableRow
                                            key={lap.lapNumber}
                                            className={lap.lapNumber === currentLap ? "bg-muted/40" : undefined}
                                            onClick={() => setCurrentLap(lap.lapNumber)}
                                            style={lap.lapNumber === currentLap ? {boxShadow: `inset 2px 0 0 ${teamColor}`} : undefined}
                                        >
                                            <TableCell>{lap.lapNumber}</TableCell>
                                            <TableCell>{lap.lapTime?.toFixed(3)}</TableCell>
                                            <TableCell>{lap.compound}</TableCell>
                                            <TableCell>{lap.topSpeed ?? "—"}</TableCell>
                                            <TableCell>{lap.isPitLap ? "Yes" : "No"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Compound Usage</CardTitle>
                            </CardHeader>
                            <CardContent className="p-1">
                                <CompoundType chartData={loaderData.compoundType} totalLaps={loaderData.laps.length}/>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Sector Delta</CardTitle>
                                <CardDescription>Delta vs session average sectors for selected lap.</CardDescription>
                            </CardHeader>
                            <CardContent className="px-4">
                                {selectedLap ? (
                                    <SectorDeltaChart lap={selectedLap} reference={averageSectors}/>
                                ) : null}
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>AI Coaching</CardTitle>
                            <CardDescription>
                                Get AI-based coaching and analysis.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline">Lap {selectedLap?.lapNumber ?? "—"}</Badge>
                                <Badge variant="secondary">Fastest: Lap {loaderData.fastest.lapNumber}</Badge>
                                {coaching?.cached ? <Badge variant="secondary">Cached</Badge> : null}
                            </div>

                            <Button
                                className="w-full"
                                onClick={() => void generateCoaching()}
                                disabled={isGeneratingCoaching || !selectedLap}
                            >
                                {isGeneratingCoaching ? "Generating Coaching..." : "Generate Coaching Insights"}
                            </Button>

                            {isGeneratingCoaching ? <InlineLoading label="Generating AI coaching..."/> : null}
                            {coachingError ?
                                <InlineError message={coachingError} onRetry={() => void generateCoaching()}/> : null}

                            {coaching ? (
                                <div className="space-y-4 text-sm">
                                    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                                        <p className="text-xs text-muted-foreground">Lap Time Delta</p>
                                        <p className={coaching.featureSummary.lap_time_delta_s <= 0 ? "text-emerald-400" : "text-red-400"}>
                                            {coaching.featureSummary.lap_time_delta_s > 0 ? "+" : ""}
                                            {coaching.featureSummary.lap_time_delta_s.toFixed(3)}s
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-xs text-muted-foreground">Sector Deltas</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                ["S1", coaching.featureSummary.sectors.s1_delta_s],
                                                ["S2", coaching.featureSummary.sectors.s2_delta_s],
                                                ["S3", coaching.featureSummary.sectors.s3_delta_s],
                                            ].map(([sector, value]) => (
                                                <div key={sector} className="rounded-md border border-border/60 p-2">
                                                    <p className="text-xs text-muted-foreground">{sector}</p>
                                                    <p className={Number(value) <= 0 ? "text-emerald-400" : "text-red-400"}>
                                                        {Number(value) > 0 ? "+" : ""}{Number(value).toFixed(3)}s
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-xs text-muted-foreground">Braking Zones (delta m)</p>
                                        <div className="space-y-1">
                                            {coaching.featureSummary.braking_zones.map((zone) => (
                                                <div key={zone.zone}
                                                     className="flex items-center justify-between rounded-md border border-border/50 px-2 py-1.5">
                                                    <span>Zone {zone.zone}</span>
                                                    <span
                                                        className={zone.delta_m !== null && zone.delta_m <= 0 ? "text-emerald-400" : "text-red-400"}>
                                                        {zone.delta_m === null ? "—" : `${zone.delta_m > 0 ? "+" : ""}${zone.delta_m.toFixed(1)}m`}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {coaching.featureSummary.corners && coaching.featureSummary.corners.length > 0 ? (
                                        <div className="space-y-2">
                                            <p className="text-xs text-muted-foreground">Corner Highlights</p>
                                            <div className="space-y-1">
                                                {coaching.featureSummary.corners.slice(0, 4).map((corner) => (
                                                    <div key={corner.corner}
                                                         className="rounded-md border border-border/50 px-2 py-1.5">
                                                        <p className="font-medium">Turn {corner.corner}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Apex
                                                            Δ {corner.apex_speed_delta > 0 ? "+" : ""}{corner.apex_speed_delta.toFixed(1)} km/h
                                                            •
                                                            Throttle reapply
                                                            Δ {corner.throttle_reapplication_delta_m == null
                                                            ? " —"
                                                            : ` ${corner.throttle_reapplication_delta_m > 0 ? "+" : ""}${corner.throttle_reapplication_delta_m.toFixed(1)}m`}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}

                                    <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                                        <p className="mb-2 text-xs text-muted-foreground">Narrative Coaching</p>
                                        <p className="whitespace-pre-line text-sm text-foreground/90">{coaching.narrative ? formatText(coaching.narrative) : "Narrative unavailable."}</p>
                                    </div>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>

                    <Card className="px-6 py-6">
                        <CardHeader className="px-0">
                            <CardTitle>Track Map Playback</CardTitle>
                            <CardDescription>Replay selected lap position on track.</CardDescription>
                        </CardHeader>
                        <LapPlaybackProvider key={currentLap} telemetry={telemetry}>
                            <PlaybackControls/>
                            <TrackMap referenceTelemetry={loaderData.fastestTel}/>
                        </LapPlaybackProvider>
                    </Card>
                </div>
            </div>

        </section>
    )
}

export function ErrorBoundary() {
    return <RouteErrorBoundary/>;
}