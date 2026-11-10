import { useEffect, useState } from "react";
import { notifyLiveDataChanged } from "./liveRefresh";

export type SyncStatus = "online" | "syncing" | "offline" | "connecting";

export type SyncState = {
  status: SyncStatus;
  lastSyncedAt: string | null;
  queuedCount: number;
  activeChannel: string | null;
  error: string | null;
};

export type QueuedMutation = {
  id: string;
  path: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
  timestamp: number;
  retryCount: number;
};

const QUEUE_STORAGE_KEY = "hmis_offline_mutation_queue";
const SYNC_STATE_STORAGE_KEY = "hmis_sync_state";
export const SYNC_STATUS_CHANGED_EVENT = "hmis:sync-status-changed";

class SyncEngine {
  private status: SyncStatus = navigator.onLine ? "online" : "offline";
  private lastSyncedAt: string | null = new Date().toISOString();
  private activeChannel: string | null = null;
  private socket: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private queue: QueuedMutation[] = [];
  private isFlushingQueue = false;

  constructor() {
    this.loadQueue();
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.handleOnline());
      window.addEventListener("offline", () => this.handleOffline());
      window.addEventListener("storage", (e) => {
        if (e.key === QUEUE_STORAGE_KEY) {
          this.loadQueue();
        }
      });
    }
  }

  public getState(): SyncState {
    return {
      status: this.status,
      lastSyncedAt: this.lastSyncedAt,
      queuedCount: this.queue.length,
      activeChannel: this.activeChannel,
      error: null,
    };
  }

  private setStatus(status: SyncStatus) {
    if (this.status !== status) {
      this.status = status;
      if (status === "online") {
        this.lastSyncedAt = new Date().toISOString();
      }
      this.broadcastState();
    }
  }

  private broadcastState() {
    if (typeof window === "undefined") return;
    const state = this.getState();
    window.dispatchEvent(
      new CustomEvent(SYNC_STATUS_CHANGED_EVENT, { detail: state })
    );
    try {
      window.localStorage.setItem(
        SYNC_STATE_STORAGE_KEY,
        JSON.stringify(state)
      );
    } catch {
      // Storage save best effort
    }
  }

  private loadQueue() {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(QUEUE_STORAGE_KEY);
      if (raw) {
        this.queue = JSON.parse(raw);
      } else {
        this.queue = [];
      }
    } catch {
      this.queue = [];
    }
    this.broadcastState();
  }

  private saveQueue() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        QUEUE_STORAGE_KEY,
        JSON.stringify(this.queue)
      );
    } catch {
      // Save best effort
    }
    this.broadcastState();
  }

  public enqueueMutation(
    path: string,
    method: string,
    body?: string,
    headers?: Record<string, string>
  ): QueuedMutation {
    const mutation: QueuedMutation = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      path,
      method: method.toUpperCase(),
      body,
      headers,
      timestamp: Date.now(),
      retryCount: 0,
    };
    this.queue.push(mutation);
    this.saveQueue();
    return mutation;
  }

  public async flushQueue(apiExecutor: (mutation: QueuedMutation) => Promise<boolean>) {
    if (this.isFlushingQueue || this.queue.length === 0 || !navigator.onLine) {
      return;
    }

    this.isFlushingQueue = true;
    this.setStatus("syncing");

    try {
      const pending = [...this.queue];
      const remaining: QueuedMutation[] = [];

      for (const item of pending) {
        try {
          const success = await apiExecutor(item);
          if (!success) {
            item.retryCount += 1;
            remaining.push(item);
          }
        } catch {
          item.retryCount += 1;
          remaining.push(item);
        }
      }

      this.queue = remaining;
      this.saveQueue();
      this.lastSyncedAt = new Date().toISOString();
      this.setStatus(navigator.onLine ? "online" : "offline");
      notifyLiveDataChanged({ source: "sync_queue_flush" });
    } finally {
      this.isFlushingQueue = false;
    }
  }

  private handleOnline() {
    this.setStatus("online");
    notifyLiveDataChanged({ source: "network_online" });
    if (this.activeChannel) {
      this.connectWebSocket();
    }
  }

  private handleOffline() {
    this.setStatus("offline");
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  public subscribeToTenantChannel(tenantType: string, tenantId: string) {
    if (!tenantId) return;
    const channelName = `tenant-${tenantType}-${tenantId}`;
    if (this.activeChannel === channelName && this.socket) return;

    this.activeChannel = channelName;
    this.connectWebSocket();
  }

  private connectWebSocket() {
    if (!navigator.onLine || !this.activeChannel) return;

    const pusherKey = (import.meta as any).env?.VITE_PUSHER_KEY || "medilink-realtime-key";
    const pusherCluster = (import.meta as any).env?.VITE_PUSHER_CLUSTER || "mt1";

    // Only attempt native websocket if key is configured
    if (!pusherKey || pusherKey === "stub") return;

    try {
      if (this.socket) {
        this.socket.close();
      }

      this.setStatus("connecting");
      const wsUrl = `wss://ws-${pusherCluster}.pusher.com/app/${pusherKey}?protocol=7&client=js&version=8.0.0`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        this.setStatus("online");
        // Subscribe to channel
        if (this.activeChannel) {
          ws.send(
            JSON.stringify({
              event: "pusher:subscribe",
              data: { channel: this.activeChannel },
            })
          );
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleInboundRealtimeEvent(message.event, message.data);
        } catch {
          // ignore non-json messages
        }
      };

      ws.onclose = () => {
        this.socket = null;
        if (navigator.onLine) {
          this.setStatus("online");
          if (!this.reconnectTimer) {
            this.reconnectTimer = window.setTimeout(() => {
              this.reconnectTimer = null;
              this.connectWebSocket();
            }, 10000);
          }
        } else {
          this.setStatus("offline");
        }
      };

      ws.onerror = () => {
        // Websocket fallback gracefully to standard polling & live-refresh
        this.socket = null;
        this.setStatus(navigator.onLine ? "online" : "offline");
      };

      this.socket = ws;
    } catch {
      this.setStatus(navigator.onLine ? "online" : "offline");
    }
  }

  public handleInboundRealtimeEvent(eventName: string, rawData: unknown) {
    let payload: any = {};
    if (typeof rawData === "string") {
      try {
        payload = JSON.parse(rawData);
      } catch {
        payload = { raw: rawData };
      }
    } else if (rawData && typeof rawData === "object") {
      payload = rawData;
    }

    // Map backend Pusher events to HMIS CustomEvents and notify UI
    switch (eventName) {
      case "patient_transfer_requested":
      case "patient_transfer_autoaccepted":
      case "patient_transfer_accepted":
      case "patient_transfer_rejected":
        window.dispatchEvent(
          new CustomEvent("hmis:patient-transfer-event", {
            detail: { event: eventName, payload },
          })
        );
        notifyLiveDataChanged({ url: "/tenant/transfers", source: "pusher" });
        break;

      case "patient_queued":
      case "patient_triaged":
      case "patient_consulted":
        window.dispatchEvent(
          new CustomEvent("hmis:patient-queued", { detail: payload })
        );
        notifyLiveDataChanged({ url: "/opd/queue", source: "pusher" });
        break;

      case "order_created":
      case "clinical_order_created":
        window.dispatchEvent(
          new CustomEvent("hmis:clinical-order-created", { detail: payload })
        );
        notifyLiveDataChanged({ url: "/orchestration/orders", source: "pusher" });
        break;

      case "order_updated":
      case "clinical_order_updated":
        window.dispatchEvent(
          new CustomEvent("hmis:clinical-order-updated", { detail: payload })
        );
        notifyLiveDataChanged({ url: "/orchestration/orders", source: "pusher" });
        break;

      default:
        // Any general mutation event invalidates active view
        notifyLiveDataChanged({ url: eventName, source: "pusher" });
        break;
    }

    this.lastSyncedAt = new Date().toISOString();
    this.broadcastState();
  }
}

export const syncEngine = new SyncEngine();

export function useSyncState(): SyncState {
  const [state, setState] = useState<SyncState>(() => syncEngine.getState());

  useEffect(() => {
    const handleSyncChange = (e: Event) => {
      setState((e as CustomEvent<SyncState>).detail);
    };
    window.addEventListener(SYNC_STATUS_CHANGED_EVENT, handleSyncChange);
    return () => {
      window.removeEventListener(SYNC_STATUS_CHANGED_EVENT, handleSyncChange);
    };
  }, []);

  return state;
}
