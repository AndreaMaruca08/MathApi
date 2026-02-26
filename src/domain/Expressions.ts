export class Expressions{
    static evaluate(expression: string, vars: Record<string, number> = {}): number {
        if (!expression || !expression.trim()) {
            throw new Error("Espressione vuota");
        }

        const normalized = this.normalizeExpression(expression, vars);

        try {
            const fn = new Function(`"use strict"; return (${normalized});`);
            const result = fn();

            if (!Number.isFinite(result)) {
                throw new Error("Risultato non finito");
            }

            return result;
        } catch {
            throw new Error(`Espressione non valida: ${expression}`);
        }
    }

    static evaluateReadable(expression: string, vars: Record<string, number> = {}): string {
        const value = this.evaluate(expression, vars);
        return this.toReadable(value);
    }

    static toReadable(value: number): string {
        if (!Number.isFinite(value)) return "NaN";
        if (Math.abs(value) < 1e-12) return "0";
        if (Number.isInteger(value)) return String(value);

        const frac = this.toFraction(value, 1e-10, 1_000_000);
        if (frac !== null) {
            const [n, d] = frac;
            return d === 1 ? `${n}` : `${n}/${d}`;
        }

        return Number(value.toFixed(10)).toString();
    }

    static toFractionFromRatio(numerator: number, denominator: number): string {
        if (denominator === 0) throw new Error("Denominatore zero");

        const scale = 1e10;
        let n = Math.round(numerator * scale);
        let d = Math.round(denominator * scale);

        if (d < 0) {
            n = -n;
            d = -d;
        }

        const g = this.gcd(Math.abs(n), Math.abs(d));
        n /= g;
        d /= g;

        if (n === 0) return "0";
        if (d === 1) return `${n}`;
        return `${n}/${d}`;
    }

    private static normalizeExpression(expression: string, vars: Record<string, number>): string {
        let expr = expression.replace(/\s+/g, "");

        if (/[^0-9a-zA-Z+\-*/^().,√]/.test(expr)) {
            throw new Error("Caratteri non consentiti");
        }

        expr = expr.replace(/√\(/g, "Math.sqrt(");
        expr = expr.replace(/\bln\(/g, "Math.log(");
        expr = expr.replace(/\blog\(/g, "Math.log10(");
        expr = expr.replace(/\^/g, "**");

        expr = expr
            .replace(/(\d)([a-zA-Z])/g, "$1*$2")
            .replace(/(\d)(\()/g, "$1*$2")
            .replace(/(\))([a-zA-Z0-9])/g, "$1*$2")
            .replace(/(\))(\()/g, "$1*$2");

        for (const [name, value] of Object.entries(vars)) {
            if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
                throw new Error(`Variabile non valida: ${name}`);
            }
            if (!Number.isFinite(value)) {
                throw new Error(`Valore non valido per variabile ${name}`);
            }

            const rgx = new RegExp(`\\b${name}\\b`, "g");
            expr = expr.replace(rgx, `(${value})`);
        }

        return expr;
    }

    private static toFraction(value: number, tolerance: number, maxDen: number): [number, number] | null {
        let x = value;
        let a = Math.floor(x);
        let h1 = 1, k1 = 0;
        let h = a, k = 1;

        while (Math.abs(value - h / k) > tolerance) {
            x = 1 / (x - a);
            if (!Number.isFinite(x)) break;
            a = Math.floor(x);

            const h2 = h1;
            h1 = h;
            const k2 = k1;
            k1 = k;

            h = h2 + a * h1;
            k = k2 + a * k1;

            if (k > maxDen) return null;
        }

        const g = this.gcd(Math.abs(h), Math.abs(k));
        return [h / g, k / g];
    }

    private static gcd(a: number, b: number): number {
        let x = Math.abs(a);
        let y = Math.abs(b);
        while (y !== 0) {
            const t = y;
            y = x % y;
            x = t;
        }
        return x || 1;
    }
}