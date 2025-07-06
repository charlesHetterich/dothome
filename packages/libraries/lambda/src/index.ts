import * as D from "@polkadot-api/descriptors";

import { Expand } from "@dothome/utils";
import { PossiblePayload } from "@dothome/payload";
import { WatchLeaf } from "@dothome/observables";
import { Context } from "@dothome/context";
import { Configuration } from "@dothome/config";

import { connectToHost } from "./handle-rpc";

/**
 * Specifies a single route within an lambda application.
 *
 * A route listens to any single `Observable` path and takes some actionupon some conditions being satisfied.
 *
 * @property watching - The path to the `Observable` to watch
 * @property trigger  - Specifies the conditions under which we will take some `lambda` action
 * @property lambda   - The action to upon `trigger`'s conditions being satisfied
 */
export type Route<
    WLs extends readonly WatchLeaf[] = readonly WatchLeaf[],
    Config extends readonly Configuration[] = readonly Configuration[]
> = {
    /**
     * ## watching
     *
     * DOCS! explain `watching` property
     */
    watching: WLs;

    /**
     * ## trigger
     *
     * DOCS! explain the `trigger` function
     */
    trigger: (
        payload: PossiblePayload<WLs>,
        context: Expand<Context<Config>>
    ) => boolean | Promise<boolean>;

    /**
     * ## lambda
     *
     * DOCS! explain the `lambda` function
     */
    lambda: (
        payload: PossiblePayload<WLs>,
        context: Expand<Context<Config>>
    ) => void | Promise<void>;
};

/**
 * Specifies a complete lambda application as a collection of routes and some peripheral settings.
 */
export interface AppModule<
    WLss extends readonly WatchLeaf[][] = WatchLeaf[][],
    Config extends readonly Configuration[] = Configuration[]
> {
    config: Config;
    routes: { [K in keyof WLss]: Route<WLss[K], Config> };
}

/**
 * Convenience builder function for specifying a lambda `TAppModule` with built-in type hints.
 */
export async function App<
    const Config extends Configuration[],
    const WLss extends readonly WatchLeaf[][]
>(
    config: Config,
    ...routes: { [K in keyof WLss]: Route<WLss[K], Config> }
): Promise<AppModule<WLss, Config>> {
    const app: AppModule<WLss, Config> = {
        config,
        routes,
    };
    connectToHost(app);
    return app;
}

/**
 * ## TApp
 *
 * Convenience type accessor when working outside of the {@link App} function
 *
 * ```ts
 * import { TApp } from "@lambdas/app-support";
 * import app from "./index";
 *
 * type App = TApp<typeof app>;
 *
 * function foo(
 *     transfer: App["Routes"]["0"]["Payload"],
 *     api: App["Context"]["apis"]["polkadot"]
 * ) { }
 * ```
 */
export type TApp<AppM extends AppModule<any, any>> = {
    Routes: {
        [K in Extract<keyof AppM["routes"], `${number}`>]: {
            Payload: PossiblePayload<AppM["routes"][K]["watching"]>;
            RTrigger: ReturnType<AppM["routes"][K]["trigger"]>;
        };
    };
    Context: AppM extends AppModule<infer _, infer Config>
        ? Context<Config>
        : never;
};

if (import.meta.vitest) {
    const { test, expectTypeOf } = import.meta.vitest;
    const { Observables } = await import("@dothome/observables");
    const { Config } = await import("@dothome/config");

    test("`App` function propagates correct payload type", () => {
        App([Config.Description("test")], {
            watching: Observables.event.polkadot.Bounties.BountyProposed(),
            trigger: (payload, _) => {
                expectTypeOf<typeof payload>().toEqualTypeOf<
                    D.PolkadotEvents["Bounties"]["BountyProposed"]
                >();
                return true;
            },
            lambda: (payload, _) => {
                expectTypeOf<typeof payload>().toEqualTypeOf<
                    D.PolkadotEvents["Bounties"]["BountyProposed"]
                >();
            },
        });
    });

    test("`App` function correctly propagates settings configurations through context", () => {
        App(
            [
                Config.Description("test"),
                Config.Setting.string("email"),
                Config.Setting.secret("password"),
                Config.Setting.bool("enabled"),
                Config.Setting.number("frequency"),
                Config.Permission("write-file"),
            ],
            {
                watching: Observables.event.polkadot.Bounties.BountyProposed(),
                trigger: (_, c) => {
                    expectTypeOf<typeof c.settings>().toEqualTypeOf<{
                        email: string;
                        password: string;
                        enabled: boolean;
                        frequency: number;
                    }>();
                    return true;
                },
                lambda: (_, __) => {},
            },
            {
                watching:
                    Observables.event.rococoV2_2.Bounties.BountyProposed(),
                trigger: (_, __) => true,
                lambda: (_, c) => {
                    expectTypeOf<typeof c.settings>().toEqualTypeOf<{
                        email: string;
                        password: string;
                        enabled: boolean;
                        frequency: number;
                    }>();
                },
            }
        );
    });

    test("`TApp` correctly organizes types extracted from an `AppModule` instance", async () => {
        const app = await App(
            [
                Config.Description("test"),
                Config.Setting.string("email"),
                Config.Setting.secret("password"),
            ],
            {
                watching: Observables.event.polkadot.Bounties.BountyProposed(),
                trigger: (_, __) => true,
                lambda: (_, __) => {},
            },
            {
                watching:
                    Observables.event.rococoV2_2.Bounties.BountyProposed(),
                trigger: (_, __) => true,
                lambda: (_, __) => {},
            }
        );

        type A = TApp<typeof app>;
        expectTypeOf<A["Routes"]["0"]["Payload"]>().toEqualTypeOf<
            D.PolkadotEvents["Bounties"]["BountyProposed"]
        >();
        expectTypeOf<A["Routes"]["1"]["Payload"]>().toEqualTypeOf<
            D.Rococo_v2_2Events["Bounties"]["BountyProposed"]
        >();
        expectTypeOf<A["Context"]>().toEqualTypeOf<{
            settings: {
                email: string;
                password: string;
            };
        }>();
    });
}
