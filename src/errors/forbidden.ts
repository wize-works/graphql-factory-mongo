import { HttpError } from './http';

export class ForbiddenError extends HttpError {
    constructor(message: string, code: string = 'FORBIDDEN') {
        super(403, message, code);
    }
}
