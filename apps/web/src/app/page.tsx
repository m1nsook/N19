"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Home, UserRound, LogOut, ArrowRight, ShieldCheck, CircleHelp } from "lucide-react";

type Account = { id: string; handle: string; display_name: string; bio: string; created_at: string };
type Mode = "login" | "register";
type View = "home" | "profile";

async function api(path: string, body?: object) {
  const response = await fetch("/api/n19/" + path, { cache: "no-store", ...(body === undefined ? {} : { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body) }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export default function HomePage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>("register");
  const [view, setView] = useState<View>("home");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    api("me").then(data => { if (active) setAccount(data.account); }).catch(() => { if (active) setError("Local API unavailable. Start N19 with bun run dev."); }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    const data = new FormData(event.currentTarget);
    try {
      const result = await api(mode, {email:data.get("email"),password:data.get("password"),displayName:data.get("displayName")});
      setAccount(result.account); setView("home");
    } catch (e) { setError(e instanceof Error ? e.message : "Request failed."); }
    finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true); setError("");
    try { await api("logout", {}); setAccount(null); setMode("login"); setNotice(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to sign out."); }
    finally { setBusy(false); }
  }
  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    const data = new FormData(event.currentTarget);
    try { const result = await api("profile", {displayName:data.get("displayName"),bio:data.get("bio")}); setAccount(result.account); setNotice("Profile saved."); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to save."); }
    finally { setBusy(false); }
  }
  const inputClass = "w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-white";
  const primary = "flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-neutral-950";
  const feedback = <>{error && <p role="alert" className="rounded-lg border border-red-500/40 p-3 text-sm text-red-600 dark:text-red-400">{error}</p>}{notice && <p role="status" className="text-sm text-neutral-500">{notice}</p>}</>;
  return (
    <main className="min-h-dvh bg-neutral-50 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="mx-auto flex min-h-dvh max-w-[980px] flex-col sm:flex-row">
        <aside className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800 sm:sticky sm:top-0 sm:h-dvh sm:w-24 sm:flex-col sm:border-b-0 sm:py-7">
          <button onClick={() => setView("home")} className="text-2xl font-black tracking-tighter" aria-label="N19 home">N19</button>
          {account && <nav aria-label="Main" className="flex gap-2 sm:flex-col">
            <button aria-label="Home" aria-current={view==="home"?"page":undefined} onClick={()=>{setView("home");setNotice("");}} className={"rounded-xl p-3 "+(view==="home"?"bg-neutral-200 dark:bg-neutral-800":"text-neutral-500")}><Home size={23}/></button>
            <button aria-label="Profile" aria-current={view==="profile"?"page":undefined} onClick={()=>{setView("profile");setNotice("");}} className={"rounded-xl p-3 "+(view==="profile"?"bg-neutral-200 dark:bg-neutral-800":"text-neutral-500")}><UserRound size={23}/></button>
          </nav>}
          {account ? <button aria-label="Sign out" disabled={busy} onClick={logout} className="rounded-xl p-3 text-neutral-500 hover:text-neutral-950 dark:hover:text-white"><LogOut size={21}/></button> : <span className="text-xs text-neutral-500">LOCAL</span>}
        </aside>
        <section className="mx-auto flex w-full max-w-[620px] flex-1 flex-col border-x border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 sm:min-h-dvh">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-center border-b border-neutral-200 bg-white/95 text-sm font-semibold dark:border-neutral-800 dark:bg-neutral-900/95">{account ? view==="profile"?"Profile":"Home" : "Welcome to N19"}</header>
          {!ready ? <p role="status" className="p-8 text-center text-sm text-neutral-500">Loading…</p> : !account ? (
            <div className="mx-auto flex w-full max-w-[410px] flex-1 flex-col justify-center gap-7 px-6 py-14">
              <div><p className="mb-3 text-4xl font-black tracking-tighter">N19</p><h1 className="text-2xl font-semibold tracking-tight">Freedom of expression.<br/>By design.</h1><p className="mt-3 text-sm leading-6 text-neutral-500">An independent social network, developed in public. Your unique handle is assigned automatically.</p></div>
              <div className="grid grid-cols-2 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800" aria-label="Account action">
                {(["register","login"] as const).map(item => <button key={item} aria-pressed={mode===item} onClick={()=>{setMode(item);setError("");}} className={"rounded-lg py-2 text-sm font-medium "+(mode===item?"bg-white shadow-sm dark:bg-neutral-700":"text-neutral-500")}>{item==="register"?"Create account":"Sign in"}</button>)}
              </div>
              <form key={mode} onSubmit={authenticate} className="space-y-3">
                {mode==="register" && <label className="block text-xs font-medium">Display name<input name="displayName" autoComplete="nickname" maxLength={80} required className={inputClass+" mt-1"}/></label>}
                <label className="block text-xs font-medium">Email<input name="email" autoComplete="email" type="email" maxLength={254} required className={inputClass+" mt-1"}/></label>
                <label className="block text-xs font-medium">Password<input name="password" autoComplete={mode==="register"?"new-password":"current-password"} type="password" minLength={12} maxLength={128} required className={inputClass+" mt-1"}/></label>
                {mode==="register" && <p className="text-xs text-neutral-500">Use at least 12 characters. Your email is not public.</p>}
                {feedback}
                <button className={primary} disabled={busy}>{busy?"Please wait…":mode==="register"?"Create account":"Sign in"}<ArrowRight size={16}/></button>
              </form>
              <p className="flex items-start gap-2 text-xs leading-5 text-neutral-500"><ShieldCheck size={16} className="shrink-0"/>Local prototype. Use test credentials only. Email verification is not enabled yet.</p>
            </div>
          ) : view==="profile" ? (
            <div className="space-y-6 p-6 sm:p-9">
              <div className="flex items-center gap-4"><div className="grid size-16 shrink-0 place-items-center rounded-full bg-neutral-200 text-2xl font-semibold dark:bg-neutral-700">{account.display_name.slice(0,1).toUpperCase()}</div><div className="min-w-0"><h1 className="break-words text-xl font-semibold">{account.display_name}</h1><p className="break-all text-sm text-neutral-500">@{account.handle}</p></div></div>
              <form key={account.id} onSubmit={saveProfile} className="space-y-4">
                <label className="block text-sm font-medium">Display name<input name="displayName" defaultValue={account.display_name} maxLength={80} required className={inputClass+" mt-2"}/></label>
                <label className="block text-sm font-medium">Biography<textarea name="bio" defaultValue={account.bio} maxLength={500} rows={4} className={inputClass+" mt-2 resize-y"}/></label>
                <div className="rounded-xl border border-neutral-200 p-3 text-xs leading-5 text-neutral-500 dark:border-neutral-800">Your public handle is permanent. Display names do not need to be unique.</div>
                {feedback}<button className={primary} disabled={busy}>{busy?"Saving…":"Save profile"}</button>
              </form>
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-4 px-6 py-10 sm:px-9">
              <div className="flex items-center gap-3"><div className="grid size-12 shrink-0 place-items-center rounded-full bg-neutral-200 text-lg font-semibold dark:bg-neutral-700">{account.display_name.slice(0,1).toUpperCase()}</div><div className="min-w-0"><h1 className="font-semibold break-words">Welcome, {account.display_name}.</h1><p className="break-all text-sm text-neutral-500">@{account.handle}</p></div></div>
              {feedback}
              <div className="mt-8 rounded-2xl border border-neutral-200 p-8 text-center dark:border-neutral-800"><CircleHelp className="mx-auto mb-4 text-neutral-400" size={26}/><h2 className="font-semibold">Your network starts here.</h2><p className="mt-2 text-sm leading-6 text-neutral-500">Your identity is ready. Posts and feeds are the next development milestone.</p><button onClick={()=>setView("profile")} className="mt-5 rounded-lg border px-4 py-2 text-sm font-medium">Edit profile</button></div>
            </div>
          )}
          <footer className="mt-auto border-t border-neutral-200 p-4 text-center text-xs text-neutral-500 dark:border-neutral-800">N19 · Independent development · <a className="underline underline-offset-2" href="https://github.com/m1nsook/N19" target="_blank" rel="noreferrer">Source</a></footer>
        </section>
        <div className="hidden flex-1 sm:block" aria-hidden="true"/>
      </div>
    </main>
  );
}
