import express, { type NextFunction, type Request, type Response } from "express";
import {Logger} from "./utils/Logger.js";
import {router} from './api/basicsController.js';
import {AppError} from "./utils/AppExceptions";
import {internal} from "./utils/HttpResponses";
import {FuncStudyController} from "./api/FuncStudyController";


const app = express();
const port = 3000;

app.use(express.json());
app.listen(port, () => {Logger.start(port);});

app.use("/basics", router);
app.use("/func", FuncStudyController);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
        Logger.warn(err);
        return res.status(err.statusCode).json({ error: err.message });
    }

    Logger.err(err);
    return internal(res, "Internal Server Error");
});
