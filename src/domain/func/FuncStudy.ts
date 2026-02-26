import { InvalidExpression } from "./InvalidExpression";
import { Expressions } from "../Expressions";

type Operator = "<" | "<=" | ">" | ">=" | "==" | "!=";

type DomainCondition = {
    left: string;
    op: Operator;
    right: string;
};

type Domain = {
    hasDeno: boolean;
    hasRadix: boolean;
    hasLogar: boolean;
    conditions: string[];
};

type DiscontinuityKind =
    | "continua"
    | "eliminabile (III specie)"
    | "a salto (I specie)"
    | "infinita (II specie)"
    | "oscillatoria (II specie)";

type PointLimit = {
    point: string;
    left: string;
    right: string;
    kind: DiscontinuityKind;
};

type LimitResult = {
    atMinusInfinity: string;
    atPlusInfinity: string;
    atCriticalPoints: PointLimit[];
};

type FuncStudyResolveResult = {
    expression: string;
    domain: Domain;
    limits: LimitResult;
    // spazio per future analisi (derivata, studio segno, grafico, ecc.)
    extras: Record<string, unknown>;
};

export class FuncStudy {
    constructor(private readonly expression: string) {
        this.validateOrThrow(expression);
    }

    public domain(): Domain {
        const exp = this.expression.replace(/\s+/g, "");
        const rawConditions = this.buildRawConditions(exp);

        return {
            hasDeno: rawConditions.some((c) => c.op === "!=" && c.right === "0"),
            hasRadix: rawConditions.some((c) => c.op === ">="),
            hasLogar: rawConditions.some((c) => c.op === ">"),
            conditions: rawConditions.map((c) => this.solveCondition(c))
        };
    }

    public limit(): LimitResult {
        const exp = this.expression.replace(/\s+/g, "");
        const rawConditions = this.buildRawConditions(exp);
        const criticalPoints = this.extractCriticalPoints(rawConditions);

        const atMinusInfinity = this.limitAtInfinity(-1);
        const atPlusInfinity = this.limitAtInfinity(1);

        const atCriticalPoints: PointLimit[] = criticalPoints.map((p) => {
            const left = this.oneSidedLimitAtPoint(p, -1);
            const right = this.oneSidedLimitAtPoint(p, 1);

            return {
                point: this.formatReadableNumber(p),
                left,
                right,
                kind: this.classifyDiscontinuity(left, right, p)
            };
        });

        return {
            atMinusInfinity,
            atPlusInfinity,
            atCriticalPoints
        };
    }

    public resolve(): FuncStudyResolveResult {
        return {
            expression: this.expression,
            domain: this.domain(),
            limits: this.limit(),
            extras: {}
        };
    }
    private buildRawConditions(exp: string): DomainCondition[] {
        const rawConditions: DomainCondition[] = [];

        const denominators = this.extractTopLevelDenominators(exp);
        for (const d of denominators) {
            rawConditions.push({ left: d, op: "!=", right: "0" });
        }

        const radixArgs = this.extractFunctionArgs(exp, ["sqrt", "√"]);
        for (const r of radixArgs) {
            rawConditions.push({ left: r, op: ">=", right: "0" });
        }

        const logArgs = this.extractFunctionArgs(exp, ["log", "ln"]);
        for (const l of logArgs) {
            rawConditions.push({ left: l, op: ">", right: "0" });
        }

        return rawConditions;
    }

    private solveCondition(condition: DomainCondition): string {
        const expr = `(${condition.left})-(${condition.right})`;

        try {
            const { a, b } = this.linearCoefficients(expr);

            const eps = 1e-10;
            if (Math.abs(a) < eps) {
                const always = this.compare(b, condition.op, 0);
                return always ? "R" : "∅";
            }

            const x0 = this.formatRootAsFraction(a, b);

            switch (condition.op) {
                case "!=": return `x != ${x0}`;
                case "==": return `x == ${x0}`;
                case ">": return a > 0 ? `x > ${x0}` : `x < ${x0}`;
                case ">=": return a > 0 ? `x >= ${x0}` : `x <= ${x0}`;
                case "<": return a > 0 ? `x < ${x0}` : `x > ${x0}`;
                case "<=": return a > 0 ? `x <= ${x0}` : `x >= ${x0}`;
            }
        } catch {
            // fallback quadratico (utile per denominatori tipo x^2-4)
            if (condition.op !== "!=" && condition.op !== "==") {
                throw new InvalidExpression(`Condizione non lineare, non risolvibile automaticamente: ${expr}`);
            }

            const q = this.quadraticCoefficients(expr);
            if (!q) {
                throw new InvalidExpression(`Condizione non lineare, non risolvibile automaticamente: ${expr}`);
            }

            return this.solveQuadraticZeroCondition(q.a, q.b, q.c, condition.op);
        }
    }

    private quadraticCoefficients(expr: string): { a: number; b: number; c: number } | null {
        const y0 = this.evaluateExpression(expr, 0); // c
        const y1 = this.evaluateExpression(expr, 1); // a+b+c
        const y2 = this.evaluateExpression(expr, 2); // 4a+2b+c

        const a = (y2 - 2 * y1 + y0) / 2;
        const c = y0;
        const b = y1 - a - c;

        // verifica che sia davvero quadratica (o meno)
        const y3 = this.evaluateExpression(expr, 3);
        const checkY3 = 9 * a + 3 * b + c;

        if (Math.abs(y3 - checkY3) > 1e-7) {
            return null;
        }

        return { a, b, c };
    }

    private solveQuadraticZeroCondition(a: number, b: number, c: number, op: "!=" | "=="): string {
        const eps = 1e-10;

        // degrada a lineare se a ~ 0
        if (Math.abs(a) < eps) {
            if (Math.abs(b) < eps) {
                const alwaysZero = Math.abs(c) < eps;
                return op === "==" ? (alwaysZero ? "R" : "∅") : (alwaysZero ? "∅" : "R");
            }
            const x0 = this.formatRootAsFraction(b, c); // b*x + c = 0 -> x = -c/b
            return op === "==" ? `x == ${x0}` : `x != ${x0}`;
        }

        const delta = b * b - 4 * a * c;

        if (delta < -eps) {
            // nessuna radice reale
            return op === "==" ? "∅" : "R";
        }

        if (Math.abs(delta) <= eps) {
            const x0 = this.formatRootAsFraction(2 * a, b); // 2a*x + b = 0
            return op === "==" ? `x == ${x0}` : `x != ${x0}`;
        }

        const sqrtDelta = Math.sqrt(delta);
        const x1 = (-b - sqrtDelta) / (2 * a);
        const x2 = (-b + sqrtDelta) / (2 * a);

        const r1 = this.formatReadableNumber(x1);
        const r2 = this.formatReadableNumber(x2);

        if (op === "==") {
            return `x == ${r1} oppure x == ${r2}`;
        }
        return `x != ${r1} e x != ${r2}`;
    }

    private extractCriticalPoints(conditions: DomainCondition[]): number[] {
        const points: number[] = [];

        for (const c of conditions) {
            const expr = `(${c.left})-(${c.right})`;

            try {
                const { a, b } = this.linearCoefficients(expr);
                if (Math.abs(a) >= 1e-12) {
                    const x0 = -b / a;
                    if (Number.isFinite(x0)) points.push(x0);
                    continue;
                }
            } catch {
                // provo quadratico sotto
            }

            const q = this.quadraticCoefficients(expr);
            if (q) {
                const { a, b, c: cc } = q;
                const eps = 1e-12;

                if (Math.abs(a) < eps) {
                    if (Math.abs(b) >= eps) {
                        const x0 = -cc / b;
                        if (Number.isFinite(x0)) points.push(x0);
                    }
                    continue;
                }

                const delta = b * b - 4 * a * cc;
                if (delta < -eps) continue;
                if (Math.abs(delta) <= eps) {
                    const x0 = -b / (2 * a);
                    if (Number.isFinite(x0)) points.push(x0);
                } else {
                    const s = Math.sqrt(delta);
                    const x1 = (-b - s) / (2 * a);
                    const x2 = (-b + s) / (2 * a);
                    if (Number.isFinite(x1)) points.push(x1);
                    if (Number.isFinite(x2)) points.push(x2);
                }
            }
        }

        return this.uniqueByTolerance(points, 1e-9).sort((a, b) => a - b);
    }

    private limitAtInfinity(direction: -1 | 1): string {
        const xs = [1e2, 1e3, 1e4, 1e5, 1e6, 1e7].map((v) => direction * v);
        const values: number[] = [];

        for (const x of xs) {
            const val = this.evaluateExpressionSafe(this.expression, x);
            if (val === null) continue;
            values.push(val);
        }

        if (values.length < 3) return "non determinabile";

        const tail = values.slice(-3);

        // tendenza a infinito
        if (tail.every((v) => Math.abs(v) > 1e8)) {
            const sign = Math.sign(tail[tail.length - 1]);
            return sign >= 0 ? "+∞" : "-∞";
        }

        // tendenza finita (ultimi valori quasi uguali)
        if (this.maxAbsDiff(tail) < 1e-6) {
            return this.formatReadableNumber(tail[tail.length - 1]);
        }

        return "non determinabile";
    }

    private oneSidedLimitAtPoint(point: number, side: -1 | 1): string {
        const epsilons = [1e-1, 1e-2, 1e-3, 1e-4, 1e-5, 1e-6, 1e-7];
        const samples: number[] = [];

        for (const eps of epsilons) {
            const x = point + side * eps;
            const v = this.evaluateExpressionSafe(this.expression, x);
            if (v === null) continue;
            samples.push(v);
        }

        if (samples.length < 3) return "non definito";

        const tail = samples.slice(-3);
        const last = tail[tail.length - 1];

        if (Math.abs(last) > 1e6 && Math.abs(tail[2]) > Math.abs(tail[1]) && Math.abs(tail[1]) > Math.abs(tail[0])) {
            return last > 0 ? "+∞" : "-∞";
        }

        if (this.maxAbsDiff(tail) < 1e-5) {
            return this.formatReadableNumber(last);
        }

        return "non determinabile";
    }

    private classifyDiscontinuity(left: string, right: string, point: number): DiscontinuityKind {
        if (left === "non definito" || right === "non definito") return "oscillatoria (II specie)";
        if (left === "non determinabile" || right === "non determinabile") return "oscillatoria (II specie)";

        const inf = new Set(["+∞", "-∞"]);
        if (inf.has(left) || inf.has(right)) return "infinita (II specie)";

        const leftNum = this.parseReadableToNumber(left);
        const rightNum = this.parseReadableToNumber(right);

        if (leftNum === null || rightNum === null) return "oscillatoria (II specie)";

        const equalSides = Math.abs(leftNum - rightNum) < 1e-7;
        if (!equalSides) return "a salto (I specie)";

        const valueAtPoint = this.evaluateExpressionSafe(this.expression, point);
        if (valueAtPoint === null) return "eliminabile (III specie)";

        if (Math.abs(valueAtPoint - leftNum) < 1e-6) return "continua";
        return "eliminabile (III specie)";
    }

    private parseReadableToNumber(value: string): number | null {
        if (value.includes("/")) {
            const [n, d] = value.split("/");
            const nn = Number(n);
            const dd = Number(d);
            if (!Number.isFinite(nn) || !Number.isFinite(dd) || dd === 0) return null;
            return nn / dd;
        }
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    }

    private formatRootAsFraction(a: number, b: number): string {
        return Expressions.toFractionFromRatio(-b, a);
    }

    private linearCoefficients(expr: string): { a: number; b: number } {
        const y0 = this.evaluateExpression(expr, 0);
        const y1 = this.evaluateExpression(expr, 1);
        const y2 = this.evaluateExpression(expr, 2);

        const a = y1 - y0;
        const b = y0;

        const eps = 1e-8;
        const check = 2 * a + b;
        if (Math.abs(y2 - check) > eps) {
            throw new InvalidExpression(`Condizione non lineare, non risolvibile automaticamente: ${expr}`);
        }

        return { a, b };
    }

    private compare(left: number, op: Operator, right: number): boolean {
        switch (op) {
            case "<": return left < right;
            case "<=": return left <= right;
            case ">": return left > right;
            case ">=": return left >= right;
            case "==": return left === right;
            case "!=": return left !== right;
            default: return false;
        }
    }

    private evaluateExpression(rawExpr: string, xValue: number): number {
        try {
            return Expressions.evaluate(rawExpr, { x: xValue });
        } catch {
            throw new InvalidExpression(`Espressione non valida: ${rawExpr}`);
        }
    }

    private evaluateExpressionSafe(rawExpr: string, xValue: number): number | null {
        try {
            const v = Expressions.evaluate(rawExpr, { x: xValue });
            return Number.isFinite(v) ? v : null;
        } catch {
            return null;
        }
    }

    private formatReadableNumber(value: number): string {
        return Expressions.toReadable(value);
    }

    private maxAbsDiff(values: number[]): number {
        let max = 0;
        for (let i = 1; i < values.length; i++) {
            max = Math.max(max, Math.abs(values[i] - values[i - 1]));
        }
        return max;
    }

    private uniqueByTolerance(values: number[], tol: number): number[] {
        const out: number[] = [];
        for (const v of values) {
            if (!out.some((x) => Math.abs(x - v) < tol)) out.push(v);
        }
        return out;
    }

    private extractTopLevelDenominators(exp: string): string[] {
        const out: string[] = [];
        let depth = 0;

        for (let i = 0; i < exp.length; i++) {
            const ch = exp[i];
            if (ch === "(") depth++;
            else if (ch === ")") depth--;
            else if (ch === "/" && depth >= 0) {
                const right = this.readRightTerm(exp, i + 1);
                if (right) out.push(right.term);
            }
        }

        return out;
    }

    private readRightTerm(exp: string, start: number): { term: string; end: number } | null {
        if (start >= exp.length) return null;

        if (exp[start] === "(") {
            let depth = 0;
            for (let i = start; i < exp.length; i++) {
                if (exp[i] === "(") depth++;
                else if (exp[i] === ")") {
                    depth--;
                    if (depth === 0) return { term: exp.slice(start, i + 1), end: i + 1 };
                }
            }
            return null;
        }

        let i = start;
        while (i < exp.length && /[a-zA-Z0-9_.^]/.test(exp[i])) i++;
        const term = exp.slice(start, i);
        return term ? { term, end: i } : null;
    }

    private extractFunctionArgs(exp: string, names: string[]): string[] {
        const args: string[] = [];

        for (const name of names) {
            if (name === "√") {
                const regex = /√\(([^()]+)\)/g;
                for (const m of exp.matchAll(regex)) args.push(m[1]);
                continue;
            }

            const regex = new RegExp(`${name}\\(([^()]+)\\)`, "g");
            for (const m of exp.matchAll(regex)) args.push(m[1]);
        }

        return args;
    }

    private validateOrThrow(exp: string): void {
        if (!exp) throw new InvalidExpression("L'espressione è vuota");

        if (/[^0-9a-zA-Z+\-*/^().,\s√]/.test(exp)) {
            throw new InvalidExpression("Sono presenti caratteri non consentiti");
        }

        const noSpaces = exp.replace(/\s+/g, "");

        let depth = 0;
        for (const ch of noSpaces) {
            if (ch === "(") depth++;
            if (ch === ")") depth--;
            if (depth < 0) throw new InvalidExpression("Parentesi non bilanciate");
        }
        if (depth !== 0) throw new InvalidExpression("Parentesi non bilanciate");

        let i = 0;
        let expectOperand = true;

        while (i < noSpaces.length) {
            const ch = noSpaces[i];

            if (/[0-9.]/.test(ch)) {
                if (!expectOperand) throw new InvalidExpression("Manca un operatore tra due termini");
                let dotCount = 0;
                while (i < noSpaces.length && /[0-9.]/.test(noSpaces[i])) {
                    if (noSpaces[i] === ".") dotCount++;
                    if (dotCount > 1) throw new InvalidExpression("Numero decimale non valido");
                    i++;
                }
                expectOperand = false;
                continue;
            }

            if (/[a-zA-Z]/.test(ch)) {
                if (!expectOperand) throw new InvalidExpression("Manca un operatore tra due termini");
                while (i < noSpaces.length && /[a-zA-Z]/.test(noSpaces[i])) i++;
                expectOperand = false;
                continue;
            }

            if (ch === "(") {
                if (!expectOperand) throw new InvalidExpression("Manca un operatore prima di '('");
                i++;
                expectOperand = true;
                continue;
            }

            if (ch === ")") {
                if (expectOperand) throw new InvalidExpression("Parentesi o operatore in posizione non valida");
                i++;
                expectOperand = false;
                continue;
            }

            if ("+-*/^".includes(ch)) {
                if (expectOperand && ch !== "+" && ch !== "-") {
                    throw new InvalidExpression(`Operatore '${ch}' in posizione non valida`);
                }
                i++;
                expectOperand = true;
                continue;
            }

            if (ch === "√") {
                if (!expectOperand) throw new InvalidExpression("Manca un operatore prima di '√'");
                i++;
                expectOperand = true;
                continue;
            }

            throw new InvalidExpression("Sintassi non valida");
        }

        if (expectOperand) throw new InvalidExpression("Espressione incompleta");
    }
}