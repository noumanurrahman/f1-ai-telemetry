import apiClient from "@/src/api/client.ts";
import type {Driver, Lap, Race, Season, TelemetryPoint} from "@/src/api/types.ts";

export const dataService = {
    seasons: async (): Promise<Season[]> => {
        const response = await apiClient.get('/seasons')
        return response.data;
    },
    races: async (year: number): Promise<Race[]> => {
        const response = await apiClient.get(`/races/${year}`)
        return response.data;
    },
    raceByRound: async (year: number, round: number): Promise<Race> => {
        const response = await apiClient.get(`/races/${year}/${round}`);
        return response.data;
    },
    drivers: async (year: number, round: number): Promise<Driver[]> => {
        const response = await apiClient.get(`/races/${year}/${round}/drivers`);
        return response.data;
    },
    driver: async (year: number, round: number, driverCode: string): Promise<Driver> => {
        const response = await apiClient.get(`/races/${year}/${round}/${driverCode}`);
        return response.data;
    },
    result: async (year: number, round: number) => {
        const response = await apiClient.get(`/races/${year}/${round}/result`);
        return response.data;
    },
    lapsByDriver: async (year: number, round: number, driverCode: string): Promise<Lap[]> => {
        const response = await apiClient.get(`/races/${year}/${round}/${driverCode}/laps`);
        return response.data;
    },
    lapsByLapNumber: async (year: number, round: number, lapNumber: number): Promise<Lap[]> => {
        const response = await apiClient.get(`/races/${year}/${round}/laps/${lapNumber}`);
        return response.data;
    },
    telemetry: async (year: number, round: number, lap: number, driver: string): Promise<TelemetryPoint[]> => {
        const response = await apiClient.get(`/races/${year}/${round}/${driver}/laps/${lap}/telemetry`);
        return response.data;
    }
}