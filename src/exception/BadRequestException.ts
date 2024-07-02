import { HTTPException } from "hono/http-exception"
import { ExceptionResponse } from "./ExceptionResponse"

export class BadRequestException extends HTTPException {
    constructor(message: string) {
        super(401, {
            message,
            res: new ExceptionResponse(401, message, "Bad Request"),
        })
    }
}
