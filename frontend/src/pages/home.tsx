import type {Route} from "./+types/home";
import {dataService} from "@/src/api/service.ts";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router";
import type {Race} from "@/src/api/types.ts";
import {Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {InlineError, InlineLoading, RouteErrorBoundary} from "@/components/page-states.tsx";

export async function clientLoader() {
    const seasons = await dataService.seasons();
    if (seasons.length === 0) {
        throw new Error("No seasons available");
    }
    const currentRaces = await dataService.races(seasons[0]);
    return {seasons, races: currentRaces};
}

export default function Component({loaderData}: Route.ComponentProps) {
    const [season, setSeason] = useState<number>(loaderData.seasons[0]);
    const [races, setRaces] = useState<Race[]>(loaderData.races);
    const [query, setQuery] = useState("");
    const [isLoadingRaces, setIsLoadingRaces] = useState(false);
    const [racesError, setRacesError] = useState<string | null>(null);
    const didMount = useRef(false);

    const navigate = useNavigate();

    const loadRaces = (targetSeason: number) => {
        setIsLoadingRaces(true);
        setRacesError(null);
        return dataService.races(targetSeason)
            .then((data) => {
                setRaces(data);
            })
            .catch((error: unknown) => {
                const message = error instanceof Error ? error.message : "Failed to load races";
                setRacesError(message);
                setRaces([]);
            })
            .finally(() => {
                setIsLoadingRaces(false);
            });
    };

    useEffect(() => {
        if (!didMount.current) {
            didMount.current = true;
            return;
        }
        void loadRaces(season);
    }, [season]);

    const filteredRaces = useMemo(() => {
        const value = query.trim().toLowerCase();
        if (!value) {
            return races;
        }

        return races.filter((race) =>
            `${race.eventName} ${race.location} ${race.country} ${race.officialName}`.toLowerCase().includes(value),
        );
    }, [query, races]);

    return (
        <section className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>F1 AI Telemetry</CardTitle>
                    <CardDescription>Select a season and open a race to explore driver telemetry dashboards.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-[220px_1fr]">
                    <Select onValueChange={(value) => setSeason(Number(value))} defaultValue={loaderData.seasons[0].toString()}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select season"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {loaderData.seasons.map((value) => (
                                    <SelectItem key={value} value={value.toString()}>
                                        {value}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Filter races by event, location, or country"
                    />
                </CardContent>
            </Card>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <p>{filteredRaces.length} race{filteredRaces.length === 1 ? "" : "s"} in {season}</p>
                <Badge variant="outline">Season {season}</Badge>
            </div>

            {isLoadingRaces ? <InlineLoading label="Loading races..."/> : null}
            {racesError ? <InlineError message={racesError} onRetry={() => void loadRaces(season)}/> : null}

            <Separator/>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredRaces.map((race) => (
                    <Card key={race.roundNumber}>
                    <CardHeader>
                        <CardAction>
                            <Badge variant="secondary">{race.year}</Badge>
                        </CardAction>
                        <CardTitle>{race.eventName}</CardTitle>
                        <CardDescription>
                            {race.location}, {race.country}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p className="truncate">{race.officialName}</p>
                        <p>Round {race.roundNumber} • {race.totalLaps} laps</p>
                        <p>{new Date(race.raceDate).toLocaleDateString()}</p>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={() => navigate(`/race/${race.year}/${race.roundNumber}`)}
                                className="w-full">
                            View Race
                        </Button>
                    </CardFooter>
                </Card>
            ))}
            </div>
        </section>
    )
}

export function ErrorBoundary() {
    return <RouteErrorBoundary/>;
}