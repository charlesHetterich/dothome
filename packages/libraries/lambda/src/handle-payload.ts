import { PossiblePayload } from "@dothome/payload";
import { Context } from "@dothome/context";
import { WatchLeaf } from "@dothome/observables";

import { Route } from ".";

/**
 * Process a new payload pushed to a {@link Route} within this application.
 *
 * {@link Context} is provided to both trigger & lambda, which is built
 * before the Host can ever push a payload. We filter the payload through our
 * trigger, and pass filtered payload to the lambda.
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
