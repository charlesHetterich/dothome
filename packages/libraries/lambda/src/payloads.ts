import { PossiblePayload } from "@dothome/payload";
import { Context } from "@dothome/context";
import { WatchLeaf } from "@dothome/observables";

import { Route } from ".";

/**
 * DOCS! docs
 */
export async function processPayload<WLs extends WatchLeaf[]>(
    payload: PossiblePayload<WLs>,
    context: Context,
    trigger: Route<WLs>["trigger"],
    lambda: Route<WLs>["lambda"]
) {
    if (await trigger(payload, context)) {
        lambda(payload, context);
    }
}
