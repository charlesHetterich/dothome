import { Observable, Subscription } from "rxjs";

import { AppRpc, VirtualRpc } from "@dothome/rpc";
import { ROOTS, WatchLeaf } from "@dothome/observables";

type ObservableType = keyof typeof ROOTS;

type EventWatchable = {
    watch: () => Observable<any>;
};

/**
 * See PAPI [Storage Queries](https://papi.how/typed/queries) for more understanding
 * of how we handle `.watchEntries` and `.watchValue`.
 */
type StorageWatchable = {
    watchEntries: (...args: any[]) => Observable<any>;
    watchValue: (...args: any[]) => Observable<any>;
};

type Watchable<ObsType extends ObservableType = any> = ObsType extends "event"
    ? EventWatchable
    : ObsType extends "storage"
    ? StorageWatchable
    : never;

function narrowWatchable<ObsType extends ObservableType>(
    expected: ObsType,
    actual: ObservableType,
    watchable: Watchable
): watchable is Watchable<ObsType> {
    return expected === actual;
}

export const Listener = {
    listenTo<ObsType extends ObservableType>(
        observableType: ObsType,
        watchable: Watchable<ObsType>,
        leaf: WatchLeaf,
        appRpc: VirtualRpc<AppRpc>,
        routeId: number,
        nArgs: number
    ): Subscription {
        if (narrowWatchable("event", observableType, watchable)) {
            return this.event(watchable, leaf, appRpc, routeId);
        } else if (narrowWatchable("storage", observableType, watchable)) {
            return this.storage(watchable, leaf, appRpc, routeId, nArgs);
        }
        throw new Error(
            ` Unknown observable type "${observableType}" for leaf at path "${leaf.path}" on chain "${leaf.chain}".`
        );
    },

    event(
        watchable: {
            watch: () => Observable<any>;
        },
        leaf: WatchLeaf,
        appRpc: VirtualRpc<AppRpc>,
        routeId: number
    ): Subscription {
        return watchable.watch().subscribe((data: any) => {
            const payload = {
                ...data.payload,
                __meta: {
                    chain: leaf.chain,
                    path: leaf.path,
                },
            };
            appRpc.pushPayload(routeId, payload);
        });
    },

    storage(
        watchable: {
            watchEntries: (...args: any[]) => Observable<any>;
            watchValue: (...args: any[]) => Observable<any>;
        },
        leaf: WatchLeaf,
        appRpc: VirtualRpc<AppRpc>,
        routeId: number,
        nArgs: number
    ): Subscription {
        return (
            leaf.args.length < nArgs
                ? leaf.options.finalized == false
                    ? watchable.watchEntries(...leaf.args, { at: "best" })
                    : watchable.watchEntries(...leaf.args)
                : watchable.watchValue(
                      ...leaf.args,
                      leaf.options.finalized ? "finalized" : "best"
                  )
        ).subscribe((payload: any) => {
            // Normalize payload structures from `watchEntries` and `watchValue`
            let _payload: { args: any; value: any }[];
            if (payload.entries) {
                _payload = payload.entries;
            } else {
                _payload = [{ args: leaf.args, value: payload }];
            }

            const refinedPayloads = _payload.map((p) => {
                return {
                    key: p.args,
                    value: p.value,
                    __meta: {
                        chain: leaf.chain,
                        path: leaf.path,
                    },
                };
            });
            for (const p of refinedPayloads) {
                appRpc.pushPayload(routeId, p);
            }
        });
    },
};
