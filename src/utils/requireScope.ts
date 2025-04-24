// src/utils/requireScope.ts

import { AuthContext } from '../types/authContext';

export function requireScope(context: AuthContext, scope: string) {
    if (!context.scopes?.includes(scope)) {
        throw new Error(`Unauthorized: Missing scope '${scope}'`);
    }
}
