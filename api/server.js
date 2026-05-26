// api/server.js - Vercel serverless function for TanStack Start SSR

import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// dist/server is included via vercel.json functions configuration
const serverPath = path.join(__dirname, "../dist/server/server.js");

let _nodeHandler;
let _initError;

async function getNodeHandler() {
    if (_nodeHandler) return _nodeHandler;
    if (_initError) throw _initError;

    try {
        const { toNodeHandler } = await import("srvx/node");
        const { pathToFileURL } = await import("node:url");
        const { default: serverModule } = await import(pathToFileURL(serverPath).href);
        _nodeHandler = toNodeHandler(serverModule.fetch.bind(serverModule));
        return _nodeHandler;
    } catch (err) {
        _initError = err;
        throw err;
    }
}

export default async function handler(req, res) {
    try {
        const h = await getNodeHandler();
        return h(req, res);
    } catch (err) {
        console.error("[TSS] FATAL:", err?.message);
        console.error("[TSS] STACK:", err?.stack);
        res.statusCode = 500;
        res.setHeader("Content-Type", "text/plain");
        res.end("Internal Server Error: " + (err?.message ?? String(err)));
    }
}
