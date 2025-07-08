import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    test: {
        // include: ["**/*.spec.ts"],
        // disableConsoleIntercept: true,
        silent: true,
        globals: true,
        includeSource: ["**/*/src/**/*.{js,ts}"],
        reporters: "verbose",
        environment: "node",
        // typecheck: {
        //     enabled: true,
        //     include: ["packages/**/*/src/**/*.{js,ts}"],
        //     exclude: ["**/node_modules/**", "**/dist/**", "**/*.d.ts"],
        // },
    },
    // plugins: [tsconfigPaths()],
});
