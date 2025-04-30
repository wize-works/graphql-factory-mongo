import { HttpError } from './http';

export class NotFoundError extends HttpError {
    constructor(message: string, code: string = 'NOT_FOUND') {
        super(404, message, code);
    }
}
