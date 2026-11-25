// Keep Next's runtime separate from Bun's native SQLite driver, behind one origin.
const mode = process.argv[2] === "start" ? "start" : "dev";
const api = Bun.spawn([process.execPath, "apps/api/src/server.ts"], { stdout: "inherit", stderr: "inherit", stdin: "ignore" });
let web: ReturnType<typeof Bun.spawn> | undefined;
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  web?.kill();
  api.kill();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
try {
  let ready = false;
  for (let i = 0; i < 100 && !stopping; i++) {
    if (api.exitCode !== null) break;
    try {
      const res = await fetch("http://127.0.0.1:4190/health", { signal: AbortSignal.timeout(500) });
      if (res.ok && (await res.json()).service === "n19-api") { ready = true; break; }
    } catch {}
    await Bun.sleep(100);
  }
  if (!ready) throw new Error("N19 local API failed to start. Check port 4190.");
  if (!stopping) {
    web = Bun.spawn([process.execPath, "run", "--filter", "@n19/web", mode], { stdout: "inherit", stderr: "inherit", stdin: "inherit" });
    const code = await Promise.race([api.exited, web.exited]);
    process.exitCode = code;
  }
} finally {
  stop();
  await Promise.allSettled([api.exited, ...(web ? [web.exited] : [])]);
}
