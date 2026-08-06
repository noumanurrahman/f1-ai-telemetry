import apiClient from "@/src/api/client.ts";
import type {Driver, Lap, LapCoachingResponse, Race, Season, TelemetryPoint} from "@/src/api/types.ts";
import axios from "axios";

export class ApiRequestError extends Error {
    status?: number;

    constructor(message: string, status?: number) {
        super(message);
        this.name = "ApiRequestError";
        this.status = status;
    }
}

function getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const payload = error.response?.data as { detail?: string; error?: string; message?: string } | undefined;
        const detail = payload?.detail ?? payload?.error ?? payload?.message;
        return detail ?? (status ? `Request failed with status ${status}` : "Network request failed");
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "Unexpected API error";
}

function unwrapData<T>(data: unknown): T {
    if (data && typeof data === "object" && "error" in data && typeof (data as {
        error?: unknown
    }).error === "string") {
        throw new ApiRequestError((data as { error: string }).error);
    }
    return data as T;
}

async function requestData<T>(promise: Promise<{ data: unknown; status: number }>): Promise<T> {
    try {
        const response = await promise;
        return unwrapData<T>(response.data);
    } catch (error: unknown) {
        if (error instanceof ApiRequestError) {
            throw error;
        }
        if (axios.isAxiosError(error)) {
            throw new ApiRequestError(getErrorMessage(error), error.response?.status);
        }
        throw new ApiRequestError(getErrorMessage(error));
    }
}

export const dataService = {
    seasons: async (): Promise<Season[]> => {
        return requestData<Season[]>(apiClient.get('/seasons'));
    },
    races: async (year: number): Promise<Race[]> => {
        return requestData<Race[]>(apiClient.get(`/races/${year}`));
    },
    raceByRound: async (year: number, round: number): Promise<Race> => {
        return requestData<Race>(apiClient.get(`/races/${year}/${round}`));
    },
    drivers: async (year: number, round: number): Promise<Driver[]> => {
        return requestData<Driver[]>(apiClient.get(`/races/${year}/${round}/drivers`));
    },
    driver: async (year: number, round: number, driverCode: string): Promise<Driver> => {
        return requestData<Driver>(apiClient.get(`/races/${year}/${round}/${driverCode}`));
    },
    result: async (year: number, round: number) => {
        return requestData(apiClient.get(`/races/${year}/${round}/result`));
    },
    lapsByDriver: async (year: number, round: number, driverCode: string): Promise<Lap[]> => {
        return requestData<Lap[]>(apiClient.get(`/races/${year}/${round}/${driverCode}/laps`));
    },
    lapsByLapNumber: async (year: number, round: number, lapNumber: number): Promise<Lap[]> => {
        return requestData<Lap[]>(apiClient.get(`/races/${year}/${round}/laps/${lapNumber}`));
    },
    telemetry: async (year: number, round: number, lap: number, driver: string): Promise<TelemetryPoint[]> => {
        return requestData<TelemetryPoint[]>(apiClient.get<TelemetryPoint[]>(`/races/${year}/${round}/${driver}/laps/${lap}/telemetry`));
    },
    analysis: async (year: number, round: number, lap: number, driver: string): Promise<LapCoachingResponse> => {
        return requestData<LapCoachingResponse>(apiClient.post<LapCoachingResponse>(`/analysis/${year}/${round}/${driver}/${lap}`));
    }
}