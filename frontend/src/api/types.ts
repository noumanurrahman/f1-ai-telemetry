export type Season = number;
export type Race = {
    country: string;
    eventName: string;
    location: string;
    officialName: string;
    raceDate: string; // ISO 8601 date-time
    roundNumber: number;
    totalLaps: number;
    year: number;
}
export type Driver = {
    classifiedPosition: string;
    driverCode: string;
    driverNumber: string;
    finishPosition: number;
    firstName: string;
    fullName: string;
    gridPosition: number;
    headshotUrl: string;
    lastName: string;
    points: number;
    status: string;
    teamName: string;
}

export type TyreCompound = "SOFT" | "MEDIUM" | "HARD" | "INTERMEDIATE" | "WET";

export type Lap = {
    compound: TyreCompound;
    deleted: boolean;
    deltaToFastest: number;
    freshTyre: boolean;
    isAccurate: boolean;
    isPersonalBest: boolean;
    isPitLap: boolean;
    lapNumber: number;
    lapTime: number;
    position: number;
    sector1Time: number | null;
    sector2Time: number | null;
    sector3Time: number | null;
    stint: number;
    tyreLife: number;
};

export type TelemetryPoint = {
    brake: boolean;
    date: string; // ISO 8601 timestamp
    distance: number;
    distanceToDriverAhead: number;
    driverAhead: string | null;
    drs: number;
    gear: number;
    relativeDistance: number;
    rpm: number;
    sessionTime: number;
    speed: number;
    throttle: number;
    time: number;
    x: number;
    y: number;
    z: number;
};