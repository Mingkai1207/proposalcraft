const DEFAULT_RETURN = "/dashboard";
const PENDING_RETURN_KEY = "proposai.pendingAuthReturn";
const PENDING_RETURN_TTL = 30 * 60 * 1000;

type ReturnStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function isSafeReturn(path: unknown): path is string {
  return (
    typeof path === "string" &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !/[\\\u0000-\u001f\u007f]/.test(path)
  );
}

export function safeAuthReturn(path: unknown): string {
  return isSafeReturn(path) ? path : DEFAULT_RETURN;
}

export function getAuthReturn(search: string, pending?: string | null): string {
  const params = new URLSearchParams(search);
  return safeAuthReturn(params.has("return") ? params.get("return") : pending);
}

export function authReturnUrl(
  path: string,
  returnTo: string,
  extra: Record<string, string> = {}
): string {
  const params = new URLSearchParams(extra);
  params.set("return", safeAuthReturn(returnTo));
  return `${path}?${params.toString()}`;
}

export function clearPendingAuthReturn(storage?: ReturnStorage): void {
  try {
    (storage ?? window.localStorage).removeItem(PENDING_RETURN_KEY);
  } catch {
    // Storage may be unavailable. It must not block authentication.
  }
}

export function rememberPendingAuthReturn(
  returnTo: string,
  storage?: ReturnStorage,
  now = Date.now()
): void {
  if (!isSafeReturn(returnTo)) return;
  try {
    (storage ?? window.localStorage).setItem(
      PENDING_RETURN_KEY,
      JSON.stringify({ path: returnTo, expiresAt: now + PENDING_RETURN_TTL })
    );
  } catch {
    // The verification page can still use a return query or the safe default.
  }
}

export function readPendingAuthReturn(
  storage?: ReturnStorage,
  now = Date.now()
): string | null {
  try {
    const selectedStorage = storage ?? window.localStorage;
    const raw = selectedStorage.getItem(PENDING_RETURN_KEY);
    if (!raw) return null;
    const pending = JSON.parse(raw);
    if (
      !isSafeReturn(pending?.path) ||
      typeof pending?.expiresAt !== "number" ||
      !Number.isFinite(pending.expiresAt) ||
      pending.expiresAt <= now ||
      pending.expiresAt > now + PENDING_RETURN_TTL
    ) {
      clearPendingAuthReturn(selectedStorage);
      return null;
    }
    return pending.path;
  } catch {
    clearPendingAuthReturn(storage);
    return null;
  }
}
