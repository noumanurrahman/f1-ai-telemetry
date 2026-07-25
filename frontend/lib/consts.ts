import type {TyreCompound} from "@/src/api/types.ts";

export const COMPOUND_COLORS: Record<TyreCompound, string> = {
    SOFT: "var(--color-red-400)",
    MEDIUM: "var(--color-yellow-400)",
    HARD: "var(--color-gray-400)",
    INTERMEDIATE: "var(--color-green-400)",
    WET: "var(--color-blue-400)",
}
