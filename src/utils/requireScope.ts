// src/utils/requireScope.ts

import { UnauthorizedError } from '../errors/unauthorized';
import { AuthContext } from '../types/authContext';
import { getLogger } from '../utils/logger'; // Adjust the path as needed

const logger = getLogger();

export function requireScope(context: AuthContext, scope: string) {
    if (!context.scopes?.includes(scope)) {
        logger.warn?.(`Unauthorized: Missing scope '${scope}'`);
        throw new UnauthorizedError(`Unauthorized: Missing scope '${scope}'`);
    }
}
