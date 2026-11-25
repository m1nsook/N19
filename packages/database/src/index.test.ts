import { expect, test } from "bun:test";
import { openLocalDatabase, readAccountSnapshot } from "./index";
import { randomUUID } from "node:crypto";

test("initializes SQLite and preserves IDs and handles in snapshots", () => {
  const db = openLocalDatabase(":memory:");
  try {
    const row = { id: randomUUID(), handle: "quiet-orbit-000001", display_name: "Local test", created_at: new Date().toISOString() };
    db.query("INSERT INTO accounts VALUES (?, ?, ?, ?)").run(row.id, row.handle, row.display_name, row.created_at);
    expect(readAccountSnapshot(db)).toEqual([row]);
    expect(() => db.query("INSERT INTO accounts VALUES (?, ?, ?, ?)").run(randomUUID(), row.handle, row.display_name, row.created_at)).toThrow();
    expect(() => db.query("INSERT INTO accounts VALUES (?, ?, ?, ?)").run(randomUUID(), "Quiet-orbit-000002", row.display_name, row.created_at)).toThrow();
  } finally { db.close(); }
});

test("fails closed when a new table has no migration mapping", () => {
  const db = openLocalDatabase(":memory:");
  try {
    db.exec("CREATE TABLE future_posts (id TEXT PRIMARY KEY)");
    expect(() => readAccountSnapshot(db)).toThrow("Unsupported source tables");
  } finally { db.close(); }
});

test("rejects unsupported schema versions", () => {
  const db = openLocalDatabase(":memory:");
  try {
    db.exec("UPDATE n19_schema_version SET version = 2");
    expect(() => readAccountSnapshot(db)).toThrow("Unsupported source schema version");
  } finally { db.close(); }
});
