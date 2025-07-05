import { Subscription } from "rxjs";

import { ChainId } from "@dothome/utils";
import { WatchLeaf } from "@dothome/observables";
import { Context } from "@dothome/context";

import { AppConfig } from "./config";

/**
 * A function that handles launching a `TRoute` specification,
 *
 * @returns `Subscription[]` corresponding to a `TRoute`'s `WatchLeaf[]`
 */
export type RouteHandler = (context: Context) => [WatchLeaf, Subscription][];

/**
 * The object that is derived from loading an `AppModule` specification
 *
 * Contains all relevant information & live metrics for a single app running
 * in our Substrate Lambdas instance.
 *
 * @property name          - The name of the app
 * @property subscriptions - Tracks the live subscriptions associated with `WatchLeaf`s of an application
 * @property config        - The configuration of the app
 * @property alive         - Whether the app is alive or not
 * @property chains        - Mapping of all used `ChainId`s to the number of *observables* associated with that chain
 */
export class LambdaApp {
    public subscriptions: Map<WatchLeaf, Subscription> = new Map();
    public config = {} as AppConfig;
    public alive: boolean = false;
    public chains = {} as Record<ChainId, number>;
    constructor(public name: string) {}

    shutdown() {
        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
        this.alive = false;
    }
}
