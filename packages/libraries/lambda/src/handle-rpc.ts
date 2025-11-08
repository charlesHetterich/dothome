import WebSocket from "ws";
import { Context } from "@dothome/context";
import { RpcPeer, HostRpc, AppRpc as _AppRpc } from "@dothome/rpc";

import { AppModule } from ".";
import { processPayload } from "./handle-payload";

export class AppRpc extends _AppRpc {
    constructor(private context: Context, private app: AppModule<any, any>) {
        super();
    }

    setSettings(settings: object) {
        for (const [key, value] of Object.entries(settings)) {
            (this.context.settings as any)[key] = value;
        }
    }

    pushPayload(routeIndex: number, rawPayload: any) {
        processPayload(
            rawPayload,
            this.context,
            this.app.routes[routeIndex].trigger,
            this.app.routes[routeIndex].lambda
        );
    }
}

/**
 * Connects the lambda application to the host RPC server.
 *
 * NOTE: This code runs inside of the deno-containerized application.
 *       Host always launches with the given environment variables set.
 */
export async function connectToHost(app: AppModule<any, any>) {
    const hostPort = process.env.HOST_PORT!;
    const token = process.env.SESSION_TOKEN!;

    // Establish App <--> Host RPC
    const ws = new WebSocket(`ws://127.0.0.1:${hostPort}?token=${token}`);
    await new Promise((r) => (ws.onopen = r));
    const peer = new RpcPeer(ws, HostRpc.prototype);

    // Register with host & fetch settings
    peer.awayRpc
        .register(
            app.config,
            app.routes.map((r) => r.watching)
        )
        .then((settings) => {
            peer.homeRpc = new AppRpc(new Context(settings), app);
        })
        .catch((err) => {
            if (err instanceof Error) {
                console.error("Failed to connect to host:", err.stack || err);
            } else {
                console.error("Failed to connect to host:", err);
            }
        });
}
