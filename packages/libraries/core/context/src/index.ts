import { SettingsConfiguration, Configuration } from "@dothome/config";
import { Expand } from "@dothome/utils";

export type ContextualSettings<Config extends readonly Configuration[]> = {
    [K in keyof Config as Config[K] extends SettingsConfiguration
        ? Config[K]["fieldName"]
        : never]: Config[K] extends SettingsConfiguration
        ? Config[K]["__fieldType"]
        : never;
};

/**
 * Provides system context to lambda apps
 */
export class Context<Config extends readonly Configuration[] = []> {
    constructor(
        /**
         * These are the settings for the app.
         */
        public settings: Expand<ContextualSettings<Config>>
    ) {}
}

/**
 * Tests coverage handled in `types/apps`
 *
 * TODO! move relevant tests from `@dothome/lambda/index.ts` to here
 */
