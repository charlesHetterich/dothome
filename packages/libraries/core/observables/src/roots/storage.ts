import * as D from "@polkadot-api/descriptors";

import { FromVirtual, VirtualChainId, Expand } from "@dothome/utils";
import { FuncTree } from "..";

export const name = "storage";

/**
 * Options for `Observables.storage` leaves
 */
export class LeafOptions {
    /**
     * Specifies whether to hold off on triggering until a change to this leaf's storage
     * item is finalized— or trigger immedidately when any changes are detected on the "best" block.
     *
     * You should only want to set this to `false` if you are doing something that is time sensitive and
     * can handle changes being reverted at some point in the near future (e.g. real-time gaming or messaging).
     *
     * Defaults to `true`.
     */
    finalized?: boolean;

    /**
     * Optionally trigger only on updates/inserts, or only deletions, of the storage
     * item being watched. If not specified, all changes will trigger.
     */
    changeType?: "upsert" | "deleted";

    constructor(
        options: { finalized?: boolean; changeType?: "upsert" | "deleted" } = {}
    ) {
        this.finalized = options.finalized;
        this.changeType = options.changeType;
    }
}

/**
 * The structure of a payload under `Observables.storage`
 *
 * @property Key   - the actual full set of keys used to access this storage item
 * @property Value - the latest value of the storage item
 */
export type PayloadStructure<Key, Value> = Expand<{
    key: Key;
    value: Value;
}>;

/**
 * A `storage` FuncTree for a blockchain given by `V`.
 */
export type Tree<V extends VirtualChainId = VirtualChainId> = FuncTree<
    (typeof D)[FromVirtual<V>]["descriptors"]["pallets"]["__storage"],
    `storage`,
    FromVirtual<V>
>;
