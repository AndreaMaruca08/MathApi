import express, { type Request, type Response } from "express";
import { Basics } from "../domain/Basics.js";
import { okResult } from "../utils/HttpResponses";

export const router = express.Router();

type TwoNumbersParams = { num1: number; num2: number };

router.get("/sum/:num1/:num2", (req: Request<TwoNumbersParams>, res: Response) => {
    return okResult(res,
        `${req.params.num1} + ${req.params.num2}`,
        Basics.sum(req.params.num1, req.params.num2)
    );
});
router.get("/sub/:num1/:num2", (req: Request<TwoNumbersParams>, res: Response) => {
    return okResult(res,
        `${req.params.num1} - ${req.params.num2}`,
        Basics.sub(req.params.num1, req.params.num2)
    );
});
router.get("/mul/:num1/:num2", (req: Request<TwoNumbersParams>, res: Response) => {
    return okResult(res,
        `${req.params.num1} * ${req.params.num2}`,
        Basics.mul(req.params.num1, req.params.num2)
    );
});
router.get("/pow/:num1/:num2", (req: Request<TwoNumbersParams>, res: Response) => {
    return okResult(res,
        `${req.params.num1} ^ ${req.params.num2}`,
        Basics.pow(req.params.num1, req.params.num2)
    );
});
router.get("/div/:num1/:num2", (req: Request<TwoNumbersParams>, res: Response) => {
    return okResult(res,
        `${req.params.num1} / ${req.params.num2}`,
        Basics.div(req.params.num1, req.params.num2)
    );
})

