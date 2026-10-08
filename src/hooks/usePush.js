import { useState, useEffect } from "react";
import { urlBase64ToUint8Array } from "../utils/push";
import { VAPID_PUBLIC_KEY } from "../constants/config";

export function usePush(me) {
  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const [permission, setPermission] = useState(supported ? Notification.permission : "unsupported");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const getReg = () => Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, rej) => setTimeout(() => rej(new Error("Service worker is not ready. Reload the app and try again.")), 10000)),
  ]);

  // On load / when the name changes: reflect the REAL state and keep this device linked to the selected person
  useEffect(() => {
    if (!supported || !me || Notification.permission !== "granted") { setSubscribed(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const reg = await getReg();
        const sub = await reg.pushManager.getSubscription();
        if (!sub) { if (!cancelled) setSubscribed(false); return; }
        await window.pushSubs.save(me, sub);
        if (!cancelled) { setSubscribed(true); setError(""); }
      } catch (e) {
        console.error("[push] sync failed", e);
        if (!cancelled) setSubscribed(false);
      }
    })();
    return () => { cancelled = true; };
  }, [me]);

  async function turnOn() {
    if (!VAPID_PUBLIC_KEY) throw new Error("VITE_VAPID_PUBLIC_KEY is missing from this build. Add it in Vercel and redeploy.");
    if (!window.pushSubs) throw new Error("window.pushSubs is missing. Check storageShim.js.");
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== "granted") throw new Error("Notification permission was not granted.");
    const reg = await getReg();
    const old = await reg.pushManager.getSubscription();
    if (old) await old.unsubscribe();   // drop any subscription made with a different key
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    await window.pushSubs.save(me, sub);
    setSubscribed(true);
  }

  async function turnOff() {
    const reg = await getReg();
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      try { await window.pushSubs.remove(sub.endpoint); } catch (e) { console.error(e); }
      await sub.unsubscribe();
    }
    setSubscribed(false);
  }

  async function toggle() {
    if (!supported || !me || busy) return;
    setBusy(true); setError("");
    try {
      if (subscribed) await turnOff(); else await turnOn();
    } catch (e) {
      console.error("[push] toggle failed", e);
      setSubscribed(false);
      setError(e?.message || String(e));
    }
    setBusy(false);
  }

  return { supported, permission, subscribed, busy, error, toggle, iosNeedsInstall: isIOS && !supported };
}
