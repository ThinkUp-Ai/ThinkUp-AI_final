export type ChatRole = "user" | "model";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  ts: number;
};

type StoreShape = {
  messagesByNumber: Map<string, ChatMessage[]>;
  processedIds: Set<string>;
};

const getStore = (): StoreShape => {
  const g = globalThis as unknown as {
    __thinkupWaStore?: StoreShape;
  };

  if (!g.__thinkupWaStore) {
    g.__thinkupWaStore = {
      messagesByNumber: new Map(),
      processedIds: new Set(),
    };
  }

  return g.__thinkupWaStore;
};

export function appendWaMessage(
  number: string,
  message: Omit<ChatMessage, "ts">
): ChatMessage {
  const store = getStore();
  const arr = store.messagesByNumber.get(number) ?? [];
  const msg: ChatMessage = { ...message, ts: Date.now() };
  arr.push(msg);
  store.messagesByNumber.set(number, arr);
  return msg;
}

export function isWaMessageProcessed(id: string): boolean {
  const store = getStore();
  return store.processedIds.has(id);
}

export function markWaMessageProcessed(id: string): void {
  const store = getStore();
  store.processedIds.add(id);
  // keep memory bounded
  if (store.processedIds.size > 5000) {
    // simple prune: clear when too large
    store.processedIds.clear();
  }
}

export function getWaMessages(number: string): ChatMessage[] {
  const store = getStore();
  return store.messagesByNumber.get(number) ?? [];
}

