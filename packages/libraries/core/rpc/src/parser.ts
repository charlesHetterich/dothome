export type RpcSerializedError = {
    message: string;
    stack?: string;
    name?: string;
};

const BIGINT_KEY = "__rpc_bigint__" as const;

function serializeError(error: unknown): RpcSerializedError {
    if (error instanceof Error) {
        return { name: error.name, message: error.message, stack: error.stack };
    }
    if (typeof error === "string") return { message: error };
    if (error === undefined) return { message: "Unknown error" };
    try {
        return { message: JSON.stringify(error) };
    } catch {
        return { message: String(error) };
    }
}

function deserializeError(error: RpcSerializedError | string): Error {
    if (typeof error === "string") return new Error(error);
    const err = new Error(error.message);
    if (error.name) err.name = error.name;
    if (error.stack) err.stack = error.stack;
    return err;
}

function jsonReplacer(_key: string, value: any) {
    if (typeof value === "bigint") {
        return { [BIGINT_KEY]: value.toString() };
    }
    return value;
}

function jsonReviver(_key: string, value: any) {
    if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        Object.keys(value).length === 1 &&
        BIGINT_KEY in value
    ) {
        return BigInt((value as Record<string, string>)[BIGINT_KEY as string]);
    }
    return value;
}

function serializeMessage<T>(message: T): string {
    return JSON.stringify(message, jsonReplacer);
}

export const ParseRPC = {
    BIGINT_KEY,
    serializeError,
    deserializeError,
    jsonReplacer,
    jsonReviver,
    serializeMessage,
} as const;
