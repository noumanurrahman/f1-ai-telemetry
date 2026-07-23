import type {Route} from "./+types/home";
import {dataService} from "@/src/api/service.ts";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {useEffect, useState} from "react";
import {useNavigate} from "react-router";
import type {Race} from "@/src/api/types.ts";
import {Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"

export async function clientLoader() {
    const seasons = await dataService.seasons();
    const currentRaces = await dataService.races(seasons[0]);
    return {seasons, races: currentRaces}
}

export default function Component({loaderData}: Route.ComponentProps) {
    const [season, setSeason] = useState<number>(loaderData.seasons[0]);
    const [races, setRaces] = useState<Race[]>(loaderData.races);

    const navigate = useNavigate();

    useEffect(() => {
        dataService.races(season).then((data) => {
            setRaces(data);
        });
    }, [season]);

    return (
        <>
            <Select onValueChange={(value) => setSeason(Number(value))} defaultValue={loaderData.seasons[0].toString()}
                    items={loaderData.seasons.map((season) => ({label: season, value: season}))}>
                <SelectTrigger className="w-45">
                    <SelectValue placeholder="Select season"/>
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {loaderData.seasons.map((season) => (
                            <SelectItem key={season} value={season}>
                                {season}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
            <h1>Selected season is {season}</h1>
            {races.map((race) => (
                <Card key={race.roundNumber} className="max-w-sm my-4">
                    <CardHeader>
                        <CardAction>
                            <Badge variant="secondary">{race.year}</Badge>
                        </CardAction>
                        <CardTitle>{race.eventName}</CardTitle>
                        <CardDescription>
                            {race.location} – ROUND: {race.roundNumber} – LAPS: {race.totalLaps}
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button onClick={() => navigate(`/${race.year}/${race.roundNumber}`)}
                                className="w-full">
                            View Race
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </>
    )
}