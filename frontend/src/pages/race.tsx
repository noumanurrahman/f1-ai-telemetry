import {dataService} from "@/src/api/service.ts";
import type {Route} from "./+types/race"
import {useNavigate} from "react-router";
import {Button} from "@/components/ui/button.tsx";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {Input} from "@/components/ui/input.tsx";
import {useMemo, useState} from "react";
import {Separator} from "@/components/ui/separator.tsx";
import {RouteErrorBoundary} from "@/components/page-states.tsx";
import DriverHeadshot from "@/components/driver-headshot.tsx";
import {getTeamColor} from "@/lib/team-style.ts";

export async function clientLoader({params}: Route.LoaderArgs) {
    const drivers = await dataService.drivers(Number(params.year), Number(params.round));
    const race = await dataService.raceByRound(Number(params.year), Number(params.round));
    return {drivers, race, params}
}

export default function Component({loaderData}: Route.ComponentProps) {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");

    const filteredDrivers = useMemo(() => {
        const value = query.trim().toLowerCase();
        if (!value) {
            return loaderData.drivers;
        }

        return loaderData.drivers.filter((driver) =>
            `${driver.fullName} ${driver.driverCode} ${driver.teamName}`.toLowerCase().includes(value),
        );
    }, [loaderData.drivers, query]);

    return (
        <section className="space-y-6">
            <Card className="overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-chart-2 via-chart-3 to-chart-5"/>
                <CardHeader className="gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle>{loaderData.race.eventName}</CardTitle>
                        <Badge variant="secondary">Round {loaderData.race.roundNumber}</Badge>
                    </div>
                    <CardDescription>
                        {loaderData.race.location}, {loaderData.race.country} • {loaderData.race.year}
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-[140px_1fr]">
                    <Button variant="outline" onClick={() => navigate("/")}>Back to seasons</Button>
                    <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search by driver, code, or team"
                    />
                </CardContent>
            </Card>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <p>{filteredDrivers.length} driver{filteredDrivers.length === 1 ? "" : "s"} available</p>
                <Badge variant="outline">{loaderData.race.year}</Badge>
            </div>

            <Separator/>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredDrivers.map((driver) => (
                    <Card
                        key={driver.driverNumber}
                        className="overflow-hidden transition-transform duration-200 hover:-translate-y-0.5"
                        style={{borderColor: `color-mix(in oklch, ${getTeamColor(driver.teamName)}, var(--border) 65%)`}}
                    >
                        <div className="h-1 w-full" style={{backgroundColor: getTeamColor(driver.teamName)}}/>
                        <CardHeader className="gap-3">
                            <div className="flex items-start gap-3">
                                <DriverHeadshot
                                    src={driver.headshotUrl}
                                    name={driver.fullName}
                                    teamColor={getTeamColor(driver.teamName)}
                                />
                                <div className="min-w-0 flex-1 space-y-1">
                                    <CardTitle className="flex items-center justify-between gap-2">
                                        <span className="truncate">{driver.fullName}</span>
                                        <Badge variant="secondary">{driver.driverCode}</Badge>
                                    </CardTitle>
                                    <CardDescription className="truncate">{driver.teamName}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-1 text-sm text-muted-foreground">
                            <p>Classified: {driver.classifiedPosition}</p>
                            <p>Grid: {driver.gridPosition}</p>
                            <p>Points: {driver.points}</p>
                            <p>Status: {driver.status}</p>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" onClick={() => navigate(`/race/${loaderData.params.year}/${loaderData.params.round}/${driver.driverCode}`)}>
                                Open Dashboard
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
            {filteredDrivers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No drivers matched your filter.</p>
            ) : null}
        </section>
    )
}

export function ErrorBoundary() {
    return <RouteErrorBoundary/>;
}
