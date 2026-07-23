import {dataService} from "@/src/api/service.ts";
import type {Route} from "./+types/race"
import {useNavigate} from "react-router";

export async function clientLoader({params}: Route.LoaderArgs) {
    const drivers = await dataService.drivers(Number(params.year), Number(params.round));
    return {drivers, params}
}

export default function Component({loaderData}: Route.ComponentProps) {
    const navigate = useNavigate();

    return (
        <>
            {loaderData.drivers.map((driver) => (
                <li onClick={() => navigate(`/race/${loaderData.params.year}/${loaderData.params.round}/${driver.driverCode}`)}
                    key={driver.driverNumber}>{driver.classifiedPosition} – {driver.fullName}</li>
            ))}
        </>
    )
}
