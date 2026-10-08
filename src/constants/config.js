export const TEST_MODE = false;
export const REMINDER_MS = TEST_MODE ? 5 * 1000 : 30 * 60 * 1000;
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const VAPID_PUBLIC_KEY = (import.meta.env.VITE_VAPID_PUBLIC_KEY || "").trim();
