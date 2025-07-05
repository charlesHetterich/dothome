import { Configuration } from "@dothome/config";
import { WatchLeaf } from "@dothome/observables";

export abstract class HostRpc {
    async register(
        configurations: Configuration[],
        observables: WatchLeaf[][]
    ): Promise<Record<string, unknown>> {
        return {};
    }
    setSettings(appId: string, setting: object) {
        console.log("not implemented!");
    }
}
