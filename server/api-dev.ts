import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(process.cwd());
const apiRoot = join(root, "api");
const port = Number(process.env.API_PORT ?? 3001);

function loadDotEnv() {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

function setCors(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", process.env.APP_BASE_URL ?? "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
}

function toApiFile(req: IncomingMessage) {
  const requestUrl = new URL(req.url ?? "/", "http://localhost");
  const pathname = requestUrl.pathname;
  if (!pathname.startsWith("/api/")) return null;

  const relative = pathname.replace(/^\/api\//, "");
  const normalized = normalize(relative);
  if (normalized.startsWith("..") || normalized.includes("..\\") || extname(normalized)) return null;

  const filePath = join(apiRoot, `${normalized}.ts`);
  if (!filePath.startsWith(apiRoot) || !existsSync(filePath)) return null;
  return filePath;
}

function patchResponse(res: ServerResponse) {
  const patched = res as ServerResponse & {
    status: (code: number) => typeof patched;
    json: (body: unknown) => void;
    send: (body: unknown) => void;
  };

  patched.status = (code: number) => {
    patched.statusCode = code;
    return patched;
  };

  patched.json = (body: unknown) => {
    if (!patched.headersSent) patched.setHeader("Content-Type", "application/json; charset=utf-8");
    patched.end(JSON.stringify(body));
  };

  patched.send = (body: unknown) => {
    if (typeof body === "string" || Buffer.isBuffer(body)) patched.end(body);
    else patched.json(body);
  };

  return patched;
}

async function readBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

async function attachBody(req: IncomingMessage & { body?: unknown }) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return;
  const rawBody = await readBody(req);
  if (!rawBody) return;

  const contentType = req.headers["content-type"] ?? "";
  if (Array.isArray(contentType) ? contentType.some((value) => value.includes("application/json")) : contentType.includes("application/json")) {
    req.body = JSON.parse(rawBody);
    return;
  }
  req.body = rawBody;
}

loadDotEnv();

createServer(async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const apiFile = toApiFile(req);
  if (!apiFile) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "API route not found" }));
    return;
  }

  try {
    await attachBody(req as IncomingMessage & { body?: unknown });
    const mod = await import(`${pathToFileURL(apiFile).href}?t=${Date.now()}`);
    const handler = mod.default;
    if (typeof handler !== "function") throw new Error(`No default handler exported by ${apiFile}`);
    await handler(req, patchResponse(res));
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
    }
    if (!res.writableEnded) {
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }));
    }
  }
}).listen(port, () => {
  console.log(`ioia API dev server listening on http://localhost:${port}`);
  console.log("Vite proxies /api requests here when npm run dev is running.");
});
