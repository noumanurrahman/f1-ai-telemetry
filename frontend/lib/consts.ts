import type {TyreCompound} from "@/src/api/types.ts";

export const COMPOUND_COLORS: Record<TyreCompound, string> = {
    SOFT: "var(--color-red-500)",
    MEDIUM: "var(--color-yellow-500)",
    HARD: "var(--color-gray-500)",
    INTERMEDIATE: "var(--color-green-500)",
    WET: "var(--color-blue-500)",
}
