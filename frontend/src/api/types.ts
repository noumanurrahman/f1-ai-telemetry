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
    topSpeed: number | null;
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

export type CoachingSectorDeltas = {
    s1_delta_s: number;
    s2_delta_s: number;
    s3_delta_s: number;
};

export type CoachingBrakingZone = {
    zone: number;
    delta_m: number | null;
};

export type CoachingCornerFeature = {
    corner: string;
    apex_speed_delta: number;
    throttle_reapplication_delta_m: number | null;
};

export type CoachingFeatureSummary = {
    lap_time_delta_s: number;
    sectors: CoachingSectorDeltas;
    braking_zones: CoachingBrakingZone[];
    corners?: CoachingCornerFeature[];
};

export type LapCoachingResponse = {
    lapNumber: number;
    featureSummary: CoachingFeatureSummary;
    narrative: string | null;
    cached: boolean;
    error?: string;
};