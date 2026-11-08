import { useEffect } from "react";

type TableInteractionLayerProps = {
  activeModuleId?: number | null;
};

/**
 * Adds consistent table affordances to module tables rendered by different
 * screens in Medilink-Desktop. Existing React row handlers and action buttons
 * are left intact.
 */
export function TableInteractionLayer({ activeModuleId }: TableInteractionLayerProps) {
  useEffect(() => {
    let activeWrap: HTMLElement | null = null;
    let backdrop: HTMLDivElement | null = null;
    const cleanups: Array<() => void> = [];
    const paginationCleanups: Array<() => void> = [];
    const paginationRefreshers: Array<() => void> = [];

    const addPagination = (table: HTMLTableElement, wrap: HTMLElement) => {
      if (table.dataset.paginationEnhanced === "true") return;
      const body = table.tBodies[0];
      if (!body) return;
      table.dataset.paginationEnhanced = "true";
      let page = 0;
      const pageSize = 12;
      const pagination = document.createElement("div");
      pagination.className = "global-table-pagination";
      const previous = document.createElement("button");
      previous.type = "button";
      previous.className = "global-table-page-btn";
      previous.textContent = "Back";
      const status = document.createElement("span");
      status.className = "global-table-page-status";
      const next = document.createElement("button");
      next.type = "button";
      next.className = "global-table-page-btn";
      next.textContent = "Next";
      pagination.append(previous, status, next);
      wrap.appendChild(pagination);

      const refresh = () => {
        const rows = Array.from(body.rows);
        const pages = Math.max(1, Math.ceil(rows.length / pageSize));
        page = Math.min(page, pages - 1);
        rows.forEach((row, index) => {
          row.hidden =
            rows.length > pageSize &&
            (index < page * pageSize || index >= (page + 1) * pageSize);
        });
        pagination.hidden = rows.length <= pageSize;
        status.textContent = rows.length
          ? `Page ${page + 1} of ${pages} · ${rows.length} rows`
          : "No rows";
        previous.disabled = page <= 0;
        next.disabled = page >= pages - 1;
      };
      const onPrevious = () => {
        page = Math.max(0, page - 1);
        refresh();
      };
      const onNext = () => {
        page += 1;
        refresh();
      };
      previous.addEventListener("click", onPrevious);
      next.addEventListener("click", onNext);
      paginationRefreshers.push(refresh);
      refresh();
      paginationCleanups.push(() => {
        previous.removeEventListener("click", onPrevious);
        next.removeEventListener("click", onNext);
        pagination.remove();
        delete table.dataset.paginationEnhanced;
        const index = paginationRefreshers.indexOf(refresh);
        if (index >= 0) paginationRefreshers.splice(index, 1);
      });
    };

    const closeExpanded = () => {
      if (activeWrap) {
        activeWrap.classList.remove("is-global-expanded");
        activeWrap = null;
      }
      document
        .querySelectorAll<HTMLElement>(".global-table-module-root.has-global-expanded-table")
        .forEach((root) => {
          root.classList.remove("has-global-expanded-table");
        });
      backdrop?.remove();
      backdrop = null;
    };

    const openExpanded = (wrap: HTMLElement, root: HTMLElement) => {
      if (activeWrap === wrap) {
        closeExpanded();
        return;
      }
      closeExpanded();
      activeWrap = wrap;
      activeWrap.classList.add("is-global-expanded");
      root.classList.add("has-global-expanded-table");
      backdrop = document.createElement("div");
      backdrop.className = "global-table-backdrop";
      backdrop.setAttribute("aria-hidden", "true");
      document.body.appendChild(backdrop);
    };

    const enhance = (wrap: HTMLElement) => {
      if (wrap.dataset.tableEnhanced === "true") return;
      if (wrap.closest("button, a, [role='button']")) return;
      if (wrap.closest(".cost-table-wrap")) return;
      if (wrap.closest(".module-dashboard-table-shell, .qa-view, .research-view")) return;
      if (!wrap.querySelector("table")) return;

      wrap.dataset.tableEnhanced = "true";
      wrap.classList.add("global-table-wrap");
      const root =
        (wrap.closest("main, .pv-page, .nursing-view, .desktop-main-scroll") as HTMLElement | null) ??
        wrap.parentElement;
      if (!root) return;
      root.classList.add("global-table-module-root");

      const expand = document.createElement("button");
      expand.type = "button";
      expand.className = "global-table-expand-btn";
      expand.setAttribute("aria-label", "Expand table");
      expand.title = "Expand table";
      expand.textContent = "⛶";
      const onExpand = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        const expanded = !wrap.classList.contains("is-global-expanded");
        openExpanded(wrap, root);
        expand.textContent = expanded ? "×" : "⛶";
        expand.setAttribute("aria-label", expanded ? "Collapse table" : "Expand table");
        expand.title = expanded ? "Collapse table" : "Expand table";
      };
      expand.addEventListener("click", onExpand);
      wrap.appendChild(expand);

      const onRowClick = (event: Event) => {
        const target = event.target as HTMLElement | null;
        if (target?.closest("button, a, input, select, textarea, [role='button']")) return;
        const row = target?.closest("tbody tr") as HTMLElement | null;
        if (!row) return;
        wrap
          .querySelectorAll<HTMLElement>("tbody tr.is-global-selected-row")
          .forEach((item) => {
            if (item !== row) {
              item.classList.remove("is-global-selected-row");
              item.removeAttribute("aria-selected");
            }
          });
        const selected = !row.classList.contains("is-global-selected-row");
        row.classList.toggle("is-global-selected-row", selected);
        row.setAttribute("aria-selected", String(selected));
        row.dispatchEvent(new CustomEvent("hmis:table-row-selected", { bubbles: true }));
      };
      wrap.addEventListener("click", onRowClick);

      cleanups.push(() => {
        wrap.removeEventListener("click", onRowClick);
        expand.removeEventListener("click", onExpand);
        expand.remove();
        delete wrap.dataset.tableEnhanced;
        wrap.classList.remove("global-table-wrap", "is-global-expanded");
      });
    };

    const scan = () => {
      document.querySelectorAll<HTMLTableElement>("table").forEach((table) => {
        const existing = table.closest<HTMLElement>(
          ".pv-table-wrap, .global-table-wrap, .wf-table-wrap, .facility-table-wrap, .biomed-table-wrap, .data-table-wrap",
        );
        if (existing) {
          addPagination(table, existing);
          enhance(existing);
          return;
        }
        const parent = table.parentElement;
        if (!parent) return;
        const wrap = document.createElement("div");
        wrap.className = "pv-table-wrap global-table-wrap global-generated-table-wrap";
        parent.insertBefore(wrap, table);
        wrap.appendChild(table);
        addPagination(table, wrap);
        enhance(wrap);
      });
      paginationRefreshers.forEach((refresh) => refresh());
    };

    let scanScheduled = false;
    let scanFrame: number | null = null;
    const scheduleScan = () => {
      if (scanScheduled) return;
      scanScheduled = true;
      scanFrame = window.requestAnimationFrame(() => {
        scanFrame = null;
        scanScheduled = false;
        scan();
      });
    };

    scan();
    const scheduledObserver = new MutationObserver(scheduleScan);
    scheduledObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      scheduledObserver.disconnect();
      if (scanFrame !== null) window.cancelAnimationFrame(scanFrame);
      closeExpanded();
      cleanups.splice(0).forEach((cleanup) => cleanup());
      paginationCleanups.splice(0).forEach((cleanup) => cleanup());
      document.querySelectorAll<HTMLElement>(".global-table-module-root").forEach((root) => {
        root.classList.remove("global-table-module-root", "has-global-expanded-table");
      });
    };
  }, [activeModuleId]);

  return null;
}

