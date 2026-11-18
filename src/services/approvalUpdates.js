import { connectHorseActivityHub } from "./horseRealtime";
import { getApiToken } from "./apiSession";

// One shared hub per app. Polling and focus recovery also cover missed events and initial connection failures.
const listeners = new Map();
let connection = null;
let timer = null;

export function notifyApprovalUpdate(topic) {
  for (const [callback, subscribedTopic] of listeners) {
    if (!topic || topic === subscribedTopic) Promise.resolve().then(callback).catch(() => {});
  }
}

function refreshVisible() {
  if (document.visibilityState !== "hidden" && getApiToken()) notifyApprovalUpdate();
}

export function subscribeApprovalUpdates(topic, callback) {
  // Each subscription gets its own key, including when two consumers share a callback.
  const listener = () => callback();
  listeners.set(listener, topic);
  if (listeners.size === 1) {
    if (getApiToken()) connection = connectHorseActivityHub({
      onHorseChanged: ({ kind }) => notifyApprovalUpdate(kind === "TapLuyen" ? "plans" : kind === "ThiDau" ? "races" : null),
      onReconnected: () => notifyApprovalUpdate(),
    });
    timer = window.setInterval(refreshVisible, 15000);
    window.addEventListener("focus", refreshVisible);
    document.addEventListener("visibilitychange", refreshVisible);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      connection?.stop();
      connection = null;
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshVisible);
      document.removeEventListener("visibilitychange", refreshVisible);
    }
  };
}
