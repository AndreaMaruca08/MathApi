import {AppError} from "../../utils/AppExceptions";

export class InvalidExpression extends AppError {
    constructor(message: string) {
        super(message, 400);
        this.name = "InvalidExpression";
    }
}