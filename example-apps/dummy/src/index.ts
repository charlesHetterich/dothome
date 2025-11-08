import * as D from "@polkadot-api/descriptors";
import { App, Observables, Config } from "@dothome/lambda";

// console.log(Object.keys(D).join("\n"));
// console.log(D["polkadot_asset_hub"]);

// console.log(Observables.event.polkadotAssetHub.all());

export default App(
    [
        Config.Description("This is a dummy application!"),
        Config.Setting.string("email"),
        Config.Setting.secret("password"),
        Config.Setting.bool("enabled"),
        Config.Setting.number("_f1__requency"),
        Config.Permission("write-file"),
    ],
    {
        watching: [Observables.event.polkadotAssetHub.all()[0]],
        trigger: (transfer, c) => true,

        async lambda(transfer, c) {
            const okk = c.settings;
            console.log("here!~");
        },
    }
);
