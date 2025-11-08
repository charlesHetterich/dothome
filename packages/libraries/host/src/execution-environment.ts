import fs from "node:fs";
import path from "node:path";
import { ChildProcessByStdio, spawn } from "node:child_process";
import { Readable, Writable } from "node:stream";

export type ExecutionEnvironmentName = "vm" | "local";

export type ExecutionEnvironmentSpecifier =
    | ExecutionEnvironmentName
    | string
    | undefined
    | null;

export interface LaunchRequest {
    appName: string;
    appPath: string;
    hostPort: number;
    sessionToken: string;
}

export type ManagedChildProcess = ChildProcessByStdio<
    Writable | null,
    Readable,
    Readable
>;

export interface ExecutionEnvironment {
    readonly name: ExecutionEnvironmentName;
    launchApp(request: LaunchRequest): ManagedChildProcess;
}

const ENVIRONMENT_ENV_VAR = "DOTHOME_EXECUTION_ENV";

export function createExecutionEnvironment(
    specifier?: ExecutionEnvironmentSpecifier
): ExecutionEnvironment {
    const name = normalizeEnvironmentName(specifier);
    switch (name) {
        case "vm":
            return new VmExecutionEnvironment();
        case "local":
        default:
            return new LocalBunExecutionEnvironment();
    }
}

export function normalizeEnvironmentName(
    value?: ExecutionEnvironmentSpecifier
): ExecutionEnvironmentName {
    const raw =
        (typeof value === "string" && value) ||
        (value as ExecutionEnvironmentName | undefined) ||
        process.env[ENVIRONMENT_ENV_VAR] ||
        "local";

    const normalized = raw.toLowerCase();
    if (normalized === "vm" || normalized === "broken-vm") {
        return "vm";
    }
    return "local";
}

class VmExecutionEnvironment implements ExecutionEnvironment {
    readonly name: ExecutionEnvironmentName = "vm";

    launchApp(): ManagedChildProcess {
        return spawnWithPipes("vm", ["launch"]);
    }
}

class LocalBunExecutionEnvironment implements ExecutionEnvironment {
    readonly name: ExecutionEnvironmentName = "local";

    launchApp({
        appName,
        appPath,
        hostPort,
        sessionToken,
    }: LaunchRequest): ManagedChildProcess {
        const { command, args } = this.resolveLaunchCommand(appPath);
        const env = {
            ...process.env,
            HOST_PORT: String(hostPort),
            SESSION_TOKEN: sessionToken,
            APP_NAME: appName,
        };

        return spawn(command, args, {
            cwd: appPath,
            env,
            stdio: ["ignore", "pipe", "pipe"] as const,
        });
    }

    private resolveLaunchCommand(appPath: string) {
        const packageJsonPath = path.join(appPath, "package.json");
        if (fs.existsSync(packageJsonPath)) {
            try {
                const pkg = JSON.parse(
                    fs.readFileSync(packageJsonPath, "utf-8")
                );
                if (pkg?.scripts?.start) {
                    return {
                        command: "bun",
                        args: ["run", "start"] as string[],
                    };
                }
            } catch (err) {
                console.warn(
                    `Unable to parse package.json for ${appPath}:`,
                    err
                );
            }
        }

        const defaultEntry = fs.existsSync(
            path.join(appPath, "src", "index.ts")
        )
            ? "src/index.ts"
            : "index.ts";

        return {
            command: "bun",
            args: [defaultEntry] as string[],
        };
    }
}

function spawnWithPipes(command: string, args: string[]): ManagedChildProcess {
    return spawn(command, args, {
        stdio: ["ignore", "pipe", "pipe"] as const,
    });
}
