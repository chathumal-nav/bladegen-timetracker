export function urlBase64ToUint8Array(b64) {
  const base64 = (b64 + "=".repeat((4 - (b64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .replace(/[^A-Za-z0-9+/=]/g, "");  // strip any non-base64 chars (BOM, smart quotes, zero-width spaces, etc.)
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}
