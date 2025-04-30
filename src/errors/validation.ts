import { HttpError } from './http';

export class ValidationError extends HttpError {
    constructor(message: string, code: string = 'BAD_USER_INPUT') {
        super(404, message, code);
    }
}
