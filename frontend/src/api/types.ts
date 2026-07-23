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