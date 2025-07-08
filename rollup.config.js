import path from "path";
import alias from "@rollup/plugin-alias";
import resolve from "@rollup/plugin-node-resolve";
import esbuild from "rollup-plugin-esbuild";
import dts from "rollup-plugin-dts";
import copy from "rollup-plugin-copy";

const commonOptions = {
    input: "src/index.ts",
    external: (id) => !/^[./]/.test(id) && !/^@\//.test(id),
};

const absoluteAlias = alias({
    entries: [
        {
            find: "@",
            // In tsconfig this would be like `"paths": { "@/*": ["./src/*"] }`
            replacement: path.resolve("./src"),
            customResolver: resolve({
                extensions: [".js", ".ts"],
            }),
        },
    ],
});

export default [
    {
        ...commonOptions,
        plugins: [
            absoluteAlias,
            esbuild({ target: "esnext" }),
            copy({
                targets: [
                    {
                        src: "src/**/migrations/**/*",
                        dest: "dist/esm/database/migrations",
                        preserveHierarchy: true,
                    },
                ],
            }),
        ],
        output: [
            {
                dir: `dist/esm`,
                format: "es",
                sourcemap: true,
                preserveModules: true,
                entryFileNames: "[name].mjs",
            },
        ],
    },
    {
        ...commonOptions,
        plugins: [absoluteAlias, dts()],
        output: {
            dir: "dist",
            format: "es",
            preserveModules: true,
            preserveModulesRoot: "src",
        },
    },
];
