import type { Response } from "express";

export type ResultResponse<T> = { operation: string, result: T };

export function basicResult<T>(operation:string, value: T): ResultResponse<T> {
    return { operation, result: value };
}

export function ok<T>(res: Response, data: T) {
    return res.status(200).json(data);
}

export function okResult<T>(res: Response, operation:string, value: T) {
    return res.status(200).json(basicResult(operation, value));
}

export function created<T>(res: Response, data: T) {
    return res.status(201).json(data);
}

export function noContent(res: Response) {
    return res.status(204).send();
}

export function badRequest(res: Response, message: string) {
    return res.status(400).json({ error: message });
}

export function internal(res: Response, message: string) {
    return res.status(500).json({ error: message });
}