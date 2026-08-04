import type {LapCoachingResponse} from "@/src/api/types.ts";

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockAnalyzeLap(args: {
    lapNumber: number;
    fastestLapNumber: number;
    baselineLapTimeDelta: number;
}): Promise<LapCoachingResponse> {
    await wait(900);

    if (args.lapNumber === args.fastestLapNumber) {
        throw new Error("This lap is already this driver's fastest lap this session — nothing to compare it to");
    }

    const lapDelta = Math.abs(args.baselineLapTimeDelta || 0.412);
    const direction = args.lapNumber % 2 === 0 ? 1 : -1;

    return {
        lapNumber: args.lapNumber,
        featureSummary: {
            lap_time_delta_s: Number((lapDelta * direction).toFixed(3)),
            sectors: {
                s1_delta_s: Number((0.142 * direction).toFixed(3)),
                s2_delta_s: Number((-0.228 * direction).toFixed(3)),
                s3_delta_s: Number((0.097 * direction).toFixed(3)),
            },
            braking_zones: [
                {zone: 0, delta_m: Number((-4.2 * direction).toFixed(1))},
                {zone: 1, delta_m: Number((2.8 * direction).toFixed(1))},
                {zone: 2, delta_m: Number((-1.1 * direction).toFixed(1))},
            ],
            corners: [
                {corner: "1", apex_speed_delta: Number((-3.8 * direction).toFixed(1)), throttle_reapplication_delta_m: Number((6.1 * direction).toFixed(1))},
                {corner: "4", apex_speed_delta: Number((2.4 * direction).toFixed(1)), throttle_reapplication_delta_m: Number((-4.5 * direction).toFixed(1))},
                {corner: "10", apex_speed_delta: Number((-1.7 * direction).toFixed(1)), throttle_reapplication_delta_m: null},
                {corner: "14", apex_speed_delta: Number((3.2 * direction).toFixed(1)), throttle_reapplication_delta_m: Number((-7.3 * direction).toFixed(1))},
            ],
        },
        narrative:
            "You are losing most of the time on corner entry in Sector 1. Brake release appears rushed into T1, forcing a lower apex minimum speed and a delayed throttle pickup. Focus on a cleaner trail-brake phase and commit earlier to the apex to open the exit.\n\nIn Sector 2, your lap is relatively strong. Keep the same confidence through medium-speed direction changes, but avoid over-rotating the car at turn-in. A slightly calmer steering trace would let you hold throttle earlier and reduce micro-corrections.\n\nFinal sector cost comes mainly from exit traction at the end of the lap. Prioritize a later but more stable rotation to improve throttle reapplication consistency, especially through the last two corners.",
        cached: false,
    };
}
