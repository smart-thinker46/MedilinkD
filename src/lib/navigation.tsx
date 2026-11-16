import React from "react";

/**
 * Desktop navigation shim for pages ported from the Next.js web client.
 *
 * The desktop application is not URL-addressable in the same way as the web
 * client; navigation is handled by the shell's module registry. These helpers
 * reproduce the small surface area of `next/navigation` and `next/link` that
 * the shared screens rely on, by keeping an in-memory route and dispatching
 * shell events that `App.tsx` listens for.
 */

export const HMIS_NAVIGATE_EVENT = "hmis:navigate-path";
export const HMIS_HISTORY_BACK_EVENT = "hmis:navigate-back";

export type NavigatePathDetail = { path: string; replace?: boolean };

const readLocation = () => {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname || "/"}${window.location.search || ""}`;
};

let currentPath = readLocation();
const pathStack: string[] = [];
const listeners = new Set<() => void>();

const notify = () => {
  listeners.forEach((listener) => listener());
};

export function subscribeToPath(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCurrentPath() {
  return currentPath;
}

function applyPath(path: string, replace: boolean) {
  if (typeof window === "undefined") return;
  const target = String(path || "/") || "/";
  if (!replace && currentPath !== target) {
    pathStack.push(currentPath);
  }
  currentPath = target;
  notify();
  window.dispatchEvent(
    new CustomEvent<NavigatePathDetail>(HMIS_NAVIGATE_EVENT, {
      detail: { path: target, replace } as NavigatePathDetail,
    }),
  );
}

export function navigateToPath(path: string, replace = false) {
  applyPath(path, replace);
}

export function navigateBack() {
  if (typeof window === "undefined") return;
  const previous = pathStack.pop();
  if (previous !== undefined) {
    applyPath(previous, true);
    return;
  }
  currentPath = "/";
  notify();
  window.dispatchEvent(new CustomEvent(HMIS_HISTORY_BACK_EVENT));
}

export function useRouter() {
  return React.useMemo(
    () => ({
      push: (path: string) => navigateToPath(path, false),
      replace: (path: string) => navigateToPath(path, true),
      back: () => navigateBack(),
      forward: () => undefined,
      refresh: () => window.dispatchEvent(new CustomEvent("hmis:live-data-changed", { detail: {} })),
      prefetch: () => undefined,
    }),
    [],
  );
}

export function useSearchParams(): URLSearchParams {
  const path = React.useSyncExternalStore(subscribeToPath, getCurrentPath, () => "/");
  const query = path.includes("?") ? path.slice(path.indexOf("?") + 1) : "";
  return React.useMemo(() => new URLSearchParams(query), [query]);
}

export function usePathname(): string {
  const path = React.useSyncExternalStore(subscribeToPath, getCurrentPath, () => "/");
  return path.split("?")[0] || "/";
}

export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  if (typeof window === "undefined") return {} as T;
  // Desktop screens receive record identifiers through the shell instead of
  // path segments. Allow an explicit override for screens that need it.
  try {
    const raw = window.sessionStorage.getItem("hmis_route_params");
    return (raw ? JSON.parse(raw) : {}) as T;
  } catch {
    return {} as T;
  }
}

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  replace?: boolean;
  prefetch?: boolean;
  children?: React.ReactNode;
};

export function Link({ href, replace, prefetch: _prefetch, onClick, children, ...rest }: LinkProps) {
  return React.createElement(
    "a",
    {
      ...rest,
      href,
      onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        navigateToPath(href, Boolean(replace));
      },
    },
    children,
  );
}

export default Link;
