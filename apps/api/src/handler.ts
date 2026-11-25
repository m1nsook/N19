import { AccountStore, SESSION_SECONDS } from "../../../packages/database/src/accounts";

const COOKIE = "n19_session";
const ORIGINS = new Set(["http://127.0.0.1:3000", "http://localhost:3000"]);
const cookie = (token: string, maxAge = SESSION_SECONDS) => `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`;
const readToken = (req: Request) => (req.headers.get("cookie") || "").split(";").map(s => s.trim()).find(s => s.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1) || "";
function response(body: unknown, status = 200, setCookie?: string) {
  const headers = new Headers({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  if (setCookie) headers.set("Set-Cookie", setCookie);
  return Response.json(body, {status, headers});
}
const error = (message: string, status = 400) => response({error: message}, status);
const validName = (value: unknown): value is string => typeof value === "string" && value.trim().length >= 1 && value.trim().length <= 80;
const validPassword = (value: unknown): value is string => typeof value === "string" && value.length >= 12 && value.length <= 128;
const validEmail = (value: unknown): value is string => typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function createHandler(store: AccountStore) {
  // Local-development safeguard. Production needs distributed rate limits.
  let count = 0;
  let resetAt = 0;
  let hashing = 0;
  const dummyHash = Bun.password.hash(crypto.randomUUID(), {algorithm: "argon2id"});
  return async (req: Request): Promise<Response> => {
    const {pathname} = new URL(req.url);
    if (req.method === "GET" && pathname === "/health") return response({service: "n19-api"});
    try {
      const token = readToken(req);
      if (req.method === "GET" && pathname === "/me") return response({account: store.session(token)});
      if (req.method !== "POST") return error("Not found.", 404);
      if (!ORIGINS.has(req.headers.get("origin") || "")) return error("Request origin rejected.", 403);
      if (pathname === "/logout") {
        if (token) store.revoke(token);
        return response({ok: true}, 200, cookie("", 0));
      }
      if (!["/register", "/login", "/profile"].includes(pathname)) return error("Not found.", 404);
      if (!req.headers.get("content-type")?.startsWith("application/json")) return error("JSON required.", 415);
      let body: Record<string, unknown>;
      try {
        const parsed = await req.json();
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return error("Invalid request.");
        body = parsed;
      } catch { return error("Invalid request."); }
      if (pathname === "/profile") {
        const account = store.session(token);
        if (!account) return error("Sign in first.", 401);
        if (!validName(body.displayName) || typeof body.bio !== "string" || body.bio.length > 500) return error("Invalid profile.");
        return response({account: store.edit(account.id, body.displayName.trim(), body.bio.trim())});
      }
      if (!validEmail(body.email) || !validPassword(body.password)) return error("Enter a valid email and a password of 12–128 characters.");
      if (pathname === "/register" && !validName(body.displayName)) return error("Enter a display name.");
      if (Date.now() >= resetAt) { count = 0; resetAt = Date.now() + 60_000; }
      if (count >= 30 || hashing >= 2) return error("Too many attempts. Try again shortly.", 429);
      count++; hashing++;
      try {
        const email = body.email.toLowerCase();
        let account;
        if (pathname === "/register") {
          const hash = await Bun.password.hash(body.password, {algorithm: "argon2id"});
          account = store.create(email, hash, (body.displayName as string).trim());
          if (!account) return error("Unable to create account with these details.", 409);
        } else {
          const credential = store.credentials(email);
          const matches = await Bun.password.verify(body.password, credential?.password_hash || await dummyHash);
          if (!credential || !matches) return error("Invalid email or password.", 401);
          account = store.find(credential.account_id);
          if (!account) return error("Invalid email or password.", 401);
        }
        const session = store.issueSession(account.id);
        if (token) store.revoke(token);
        return response({account}, pathname === "/register" ? 201 : 200, cookie(session));
      } finally { hashing--; }
    } catch { return error("Something went wrong. Try again.", 500); }
  };
}
