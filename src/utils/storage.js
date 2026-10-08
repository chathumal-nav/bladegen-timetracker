export async function loadStore(key, shared, fallback) {
  try {
    const res = await window.storage.get(key, shared);
    return res ? JSON.parse(res.value) : fallback;
  } catch (e) {
    return fallback;
  }
}
export async function saveStore(key, shared, value) {
  try {
    await window.storage.set(key, JSON.stringify(value), shared);
  } catch (e) {
    console.error("storage save failed", key, e);
  }
}
