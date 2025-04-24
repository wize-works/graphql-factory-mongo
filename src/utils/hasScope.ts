import { AuthContext } from "../types/authContext";

export function hasScope(ctx: AuthContext, scope: string) {
    return ctx.scopes?.includes(scope);
}