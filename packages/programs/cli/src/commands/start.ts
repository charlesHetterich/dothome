import { AppsManager } from "@dothome/host";

export function start(appsDir: string) {
    new AppsManager().startApps(appsDir);
}
