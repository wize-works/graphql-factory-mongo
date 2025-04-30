export class HttpError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public code: string = 'INTERNAL_SERVER_ERROR'
    ) {
        super(message);
        this.name = this.constructor.name;
    }
}
