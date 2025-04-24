export function normalizeArgs(args: any): Record<string, any> {
    if (!Array.isArray(args)) return args;

    const result: Record<string, any> = {};
    for (const arg of args) {
        if (!arg.name) throw new Error("Argument missing 'name'");
        result[arg.name] = {
            type: arg.type,
            defaultValue: arg.defaultValue,
            description: arg.description,
            deprecationReason: arg.deprecationReason,
            extensions: arg.extensions,
            astNode: arg.astNode
        };
    }
    return result;
}