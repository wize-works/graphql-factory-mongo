import { HttpError } from './http';

export class UnauthorizedError extends HttpError {
    constructor(message: string, code: string = 'UNAUTHORIZED') {
        super(401, message, code);
    }
}
