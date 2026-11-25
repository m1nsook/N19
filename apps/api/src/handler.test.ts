import { expect, test } from "bun:test";
import { openLocalDatabase, readDatabaseSnapshot } from "../../../packages/database/src/index";
import { AccountStore } from "../../../packages/database/src/accounts";
import { createHandler } from "./handler";

test("register, private credentials, immutable identity, persisted session, logout and login", async () => {
  const db = openLocalDatabase(":memory:");
  const store = new AccountStore(db);
  const handle = createHandler(store);
  const request = (path: string, method = "GET", body?: object, session = "", origin = "http://127.0.0.1:3000") =>
    new Request("http://127.0.0.1:4190" + path, { method, headers: {origin, "content-type": "application/json", cookie: session}, ...(body ? {body: JSON.stringify(body)} : {}) });
  try {
    const data = {email:"test@example.invalid",password:"long-test-password",displayName:"Tester",handle:"admin"};
    expect((await handle(request("/register","POST",data,"","https://evil.invalid"))).status).toBe(403);
    const registered = await handle(request("/register","POST",data));
    expect(registered.status).toBe(201);
    const {account} = await registered.json();
    expect(account.handle).toMatch(/^[a-z]+-[a-z]+-\d{6}$/);
    expect(account.email).toBeUndefined();
    const header = registered.headers.get("set-cookie")!;
    expect(header).toContain("HttpOnly");
    expect(header).toContain("SameSite=Strict");
    const session = header.split(";")[0];
    const snapshot = readDatabaseSnapshot(db);
    expect(snapshot.credentials[0].password_hash).toStartWith("$argon2id$");
    expect(snapshot.credentials[0].password_hash).not.toContain(data.password);
    expect(JSON.stringify(snapshot)).not.toContain(session.split("=")[1]);
    const restarted = createHandler(new AccountStore(db));
    expect((await (await restarted(request("/me","GET",undefined,session))).json()).account.id).toBe(account.id);
    expect((await handle(request("/profile","POST",{displayName:"New",bio:"Hello"}))).status).toBe(401);
    const edit = await (await handle(request("/profile","POST",{displayName:"New",bio:"Hello",handle:"changed"},session))).json();
    expect(edit.account.handle).toBe(account.handle);
    expect(edit.account.bio).toBe("Hello");
    expect((await handle(request("/logout","POST",undefined,session))).status).toBe(200);
    expect((await (await handle(request("/me","GET",undefined,session))).json()).account).toBeNull();
    expect((await handle(request("/login","POST",{email:data.email,password:"wrong-password!"}))).status).toBe(401);
    expect((await handle(request("/login","POST",data))).status).toBe(200);
    expect((await handle(request("/register","POST",data))).status).toBe(409);
  } finally { db.close(); }
});
