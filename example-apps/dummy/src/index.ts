import { App, Observables, Config } from "@dothome/lambda";

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
        watching: Observables.event.polkadotAssetHub.all(),
        trigger: (transfer, c) => true,

        async lambda(transfer, c) {
            const okk = c.settings;
            console.log("Here!");
            console.log(transfer);
        },
    }
);
