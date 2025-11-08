#!/usr/bin/env node
/**
 * DotHome CLI
 *
 * Usage:
 *   dothome start <path-to-appsDir>
 */

import { Command } from "commander";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { AppsManager } from "@dothome/host";

const program = new Command();

program.name("dothome").description("Manage DotHome apps").version("0.1.0");

program
    .command("start")
    .argument("<appsDir>", "Path to the directory that hosts your apps")
    .description("Start DotHome host (demo stub)")
    .action(async (appsDir: string) => {
        const fullPath = resolve(appsDir);
        console.log("test test testing");

        if (!existsSync(fullPath)) {
            console.error(`❌  Path not found: ${fullPath}`);
            process.exitCode = 1;
            return;
        }

        console.log(
            `👋  Hello world! Starting DotHome with apps in:\n    ${fullPath}`
        );

        // Start up w/o micro-vm protection no 'local'
        const manager = new AppsManager(undefined, "local");
        await manager.startApps(fullPath);
    });

program.parse();
