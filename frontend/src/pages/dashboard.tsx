import type {Route} from "./+types/dashboard"
import {dataService} from "@/src/api/service.ts";

export async function clientLoader({params}: Route.LoaderArgs) {
    const driver = await dataService.driver(Number(params.year), Number(params.round), params.driver);
    return {driver};
}

export default function Component({loaderData}: Route.ComponentProps) {
    return (
        <h1>DASHBOARD – {loaderData.driver.fullName} ({loaderData.driver.teamName})</h1>
    )
}