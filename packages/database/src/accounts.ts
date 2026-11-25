import type { Database } from "bun:sqlite";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { generatePublicHandle } from "../../identity/src/index";

export interface PublicAccount {
  id: string;
  handle: string;
  display_name: string;
  bio: string;
  created_at: string;
}

const PUBLIC_SELECT = "SELECT a.id, a.handle, a.display_name, a.created_at, COALESCE(p.bio, '') AS bio FROM accounts a LEFT JOIN profiles p ON p.account_id = a.id";
export const SESSION_SECONDS = 60 * 60 * 24 * 30;
export const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

export class AccountStore {
  constructor(private db: Database) {}
  find(id: string): PublicAccount | null {
    return this.db.query<PublicAccount, [string]>(PUBLIC_SELECT + " WHERE a.id = ?").get(id);
  }
  credentials(email: string) {
    return this.db.query<{ account_id: string; password_hash: string }, [string]>("SELECT account_id, password_hash FROM credentials WHERE email = ?").get(email);
  }
  create(email: string, passwordHash: string, displayName: string): PublicAccount | null {
    return this.db.transaction(() => {
      if (this.credentials(email)) return null;
      const id = randomUUID();
      for (let i = 0; i < 20; i++) {
        const inserted = this.db.query("INSERT INTO accounts (id, handle, display_name, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(handle) DO NOTHING").run(id, generatePublicHandle(), displayName, new Date().toISOString());
        if (!inserted.changes) continue;
        this.db.query("INSERT INTO credentials (account_id, email, password_hash) VALUES (?, ?, ?)").run(id, email, passwordHash);
        this.db.query("INSERT INTO profiles (account_id, bio) VALUES (?, '')").run(id);
        return this.find(id)!;
      }
      throw new Error("Handle allocation exhausted");
    }).immediate();
  }
  issueSession(id: string) {
    const token = randomBytes(32).toString("base64url");
    const now = new Date().toISOString();
    const expires = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString();
    this.db.transaction(() => {
      this.db.query("DELETE FROM sessions WHERE expires_at <= ?").run(now);
      this.db.query("INSERT INTO sessions (token_hash, account_id, expires_at) VALUES (?, ?, ?)").run(tokenHash(token), id, expires);
    })();
    return token;
  }
  session(token: string): PublicAccount | null {
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
    const row = this.db.query<{account_id: string}, [string,string]>("SELECT account_id FROM sessions WHERE token_hash = ? AND expires_at > ?").get(tokenHash(token), new Date().toISOString());
    return row ? this.find(row.account_id) : null;
  }
  revoke(token: string) {
    this.db.query("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash(token));
  }
  edit(id: string, displayName: string, bio: string) {
    return this.db.transaction(() => {
      this.db.query("UPDATE accounts SET display_name = ? WHERE id = ?").run(displayName, id);
      this.db.query("INSERT INTO profiles (account_id, bio) VALUES (?, ?) ON CONFLICT(account_id) DO UPDATE SET bio = excluded.bio").run(id, bio);
      return this.find(id);
    })();
  }
}
