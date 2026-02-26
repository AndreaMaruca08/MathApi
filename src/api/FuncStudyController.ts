import express, { type Request, type Response } from "express";
import { FuncStudy } from "../domain/func/FuncStudy";
import { ok } from "../utils/HttpResponses";
import { InvalidExpression } from "../domain/func/InvalidExpression";

export const FuncStudyController = express.Router();

type ResolveQuery = { expression?: string };

function getExpressionOrThrow(req: Request<{}, {}, {}, ResolveQuery>): string {
    const expression = req.query.expression;
    if (!expression) throw new InvalidExpression("Parametro 'expression' mancante");
    return expression;
}

FuncStudyController.get("/resolve", (req: Request<{}, {}, {}, ResolveQuery>, res: Response) => {
    const funcStudy = new FuncStudy(getExpressionOrThrow(req));
    return ok(res, funcStudy.resolve());
});

FuncStudyController.get("/domain", (req: Request<{}, {}, {}, ResolveQuery>, res: Response) => {
    const funcStudy = new FuncStudy(getExpressionOrThrow(req));
    return ok(res, funcStudy.domain());
});

FuncStudyController.get("/limit", (req: Request<{}, {}, {}, ResolveQuery>, res: Response) => {
    const funcStudy = new FuncStudy(getExpressionOrThrow(req));
    return ok(res, funcStudy.limit());
});