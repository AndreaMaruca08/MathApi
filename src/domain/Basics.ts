import {toFiniteNumber} from "../utils/Validators";
import {BadRequestError} from "../utils/AppExceptions";

export class Basics {
    static sum(num1:unknown, num2:unknown): number {
        return this.toNumber(num1) + this.toNumber(num2);
    }

    static sub(num1:unknown, sottraendo:unknown): number {
        return this.toNumber(num1) - this.toNumber(sottraendo);
    }

    static mul(num1:unknown, num2:unknown): number {
        return this.toNumber(num1) * this.toNumber(num2);
    }

    static pow(num:unknown, esp:unknown): number {
        return this.toNumber(num) ** this.toNumber(esp);
    }

    static div(num1:unknown, num2:unknown): number {
        const divisore = this.toNumber(num2);
        if(divisore == 0){throw new BadRequestError("Il divisore non può essere 0");}
        return this.toNumber(num1) / divisore;
    }

    private static toNumber(num:unknown): number {
        const numb = toFiniteNumber(num);
        if(numb == null){throw new BadRequestError("I dati devono essere numeri");}
        return numb;
    }


}