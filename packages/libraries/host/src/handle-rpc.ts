import { VirtualRpc, AppRpc, HostRpc as _HostRpc } from "@dothome/rpc";
import { WatchLeaf, ROOTS } from "@dothome/observables";
import { Configuration } from "@dothome/config";

import { AppsManager } from ".";
import { LambdaApp } from "./lambda-app";
import { loadConfigurations } from "./handle-configs";
import { Listener } from "./observable-listener";

export class HostRpc extends _HostRpc {
    constructor(
        private manager: AppsManager,
        private app: LambdaApp,
        private appRpc: VirtualRpc<AppRpc>
    ) {
        super();
    }

    async register(
        configurations: Configuration[],
        observables: WatchLeaf[][]
    ) {
        this.app.config = await loadConfigurations(
            this.app.name,
            configurations,
            this.manager.db
        );
        this.app.chains = observables
            .flat()
            .reduce((acc: Record<string, number>, leaf: WatchLeaf) => {
                acc[leaf.chain] = (acc[leaf.chain] || 0) + 1;
                return acc;
            }, {});

        observables.forEach(async (leaves, idx) => {
            for (const leaf of leaves) {
                const path_arr = leaf.path.split(".");

                // Start at the top this chain's API/Codec, and then
                // traverse properties to the desired observable value
                let watchable: any = await this.manager.getAPI(leaf.chain);
                let codec: any = await this.manager.getCodec(leaf.chain);
                for (const pth of path_arr) {
                    watchable =
                        watchable[pth == ROOTS.storage.name ? "query" : pth];
                    codec = codec[pth == ROOTS.storage.name ? "query" : pth];
                }

                // Begin listening to observable
                let sub = Listener.listenTo(
                    path_arr[0] as any,
                    watchable,
                    leaf,
                    this.appRpc,
                    idx,
                    codec.args ? codec.args.inner.length : 0
                );

                // Keep pointer to subscription in Lambda app
                this.app.subscriptions.set(leaf, sub);
                sub.add(() => {
                    this.app.subscriptions.delete(leaf);
                });
            }
        });
        this.app.alive = true;

        // send requirements for context back
        return this.app.config.settings;
    }

    setSettings(appId: string, setting: object) {
        console.log("not implemented!");
    }
}
