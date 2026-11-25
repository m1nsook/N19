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
    db.exec("UPDATE n19_schema_version SET version = 999");
    expect(() => readAccountSnapshot(db)).toThrow("Unsupported source schema version");
  } finally { db.close(); }
});

test("upgrades a version-1 database without losing accounts", () => {
  const { Database } = require("bun:sqlite");
  const { mkdtempSync, rmSync } = require("node:fs");
  const { tmpdir } = require("node:os");
  const { join } = require("node:path");
  const dir = mkdtempSync(join(tmpdir(), "n19-upgrade-"));
  const path = join(dir, "test.sqlite");
  try {
    const v1 = new Database(path);
    v1.exec("CREATE TABLE n19_schema_version (version INTEGER PRIMARY KEY); INSERT INTO n19_schema_version VALUES (1); CREATE TABLE accounts (id TEXT PRIMARY KEY NOT NULL, handle TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL, created_at TEXT NOT NULL); INSERT INTO accounts VALUES ('old', 'quiet-orbit-000001', 'Old account', '2026-01-01T00:00:00.000Z')");
    v1.close();
    const upgraded = openLocalDatabase(path);
    try { expect(readAccountSnapshot(upgraded)[0].id).toBe("old"); }
    finally { upgraded.close(); }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
