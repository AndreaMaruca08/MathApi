export function toFiniteNumber(value: unknown): number | null {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

export function isPositiveInt(value: number): boolean {
    return Number.isInteger(value) && value > 0;
}

export function isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
}