import * as signalR from "@microsoft/signalr";
import { getApiToken } from "./apiSession";
import { syncFromServer } from "./sharedStorage";

const HUB_PATH = "/hubs/horse-activity";
const EVENT_NAME = "horseChanged";

function hubUrl() {
  const base = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");
  return `${base}${HUB_PATH}`;
}

/** Kết nối SignalR cho chủ ngựa; trả về connection + hàm hủy. */
export function connectHorseActivityHub({ onHorseChanged, onReconnecting, onReconnected }) {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl(), {
      accessTokenFactory: () => getApiToken() ?? "",
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  connection.on(EVENT_NAME, (payload) => {
    const horseId = Number(payload?.horseId ?? payload?.HorseId ?? 0);
    const kind = payload?.kind ?? payload?.Kind ?? "";
    if (!horseId) return;
    onHorseChanged?.({ horseId, kind });
  });

  connection.on("sharedStateChanged", () => {
    syncFromServer();
  });

  connection.on("sharedStateCleared", () => {
    syncFromServer();
  });

  if (onReconnecting) connection.onreconnecting(onReconnecting);
  if (onReconnected) connection.onreconnected(onReconnected);

  let stopped = false;
  const start = connection.start().catch((err) => {
    if (!stopped) console.warn("[horseRealtime] không kết nối được hub:", err?.message ?? err);
  });

  return {
    connection,
    ready: start,
    async stop() {
      stopped = true;
      connection.off(EVENT_NAME);
      try {
        await connection.stop();
      } catch {
        // bỏ qua
      }
    },
  };
}
