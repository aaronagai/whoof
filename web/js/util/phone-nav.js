import { isPhone, phoneMediaQuery } from "./phone.js";
import { getPhoneSheet } from "./phone-sheet.js";

/** Tabs exposed in the bottom mobile nav (Today/overview is the default homepage; coach is sidebar-only). */
export const MOBILE_NAV_TABS = ["sleep", "recovery", "strain", "trends", "live"];

/** Phone homepage tab — shown in main content, not the bottom nav or pull-up sheet. */
export const PHONE_HOME_TAB = "overview";

const TAB_TITLES = {
  overview: "Today",
  recovery: "Recovery",
  sleep: "Sleep",
  strain: "Strain",
  trends: "Trends",
  live: "Live",
};

let panelHome = null;
let mountedTab = null;

function getPanelHome() {
  if (!panelHome) {
    panelHome = document.createElement("div");
    panelHome.id = "tab-panels-host";
    panelHome.hidden = true;
    panelHome.setAttribute("aria-hidden", "true");
    document.querySelector("main.content")?.appendChild(panelHome);
  }
  return panelHome;
}

function getPanel(tab) {
  return document.querySelector(`.tab-panel[data-panel="${tab}"]`);
}

/** Move the active tab panel back to the hidden host (out of the sheet). */
export function restorePhoneNavPanel() {
  const sheet = getPhoneSheet();
  const body = sheet?.bodyEl;
  if (!body) return;
  const panel = body.querySelector(".tab-panel");
  if (panel) getPanelHome().appendChild(panel);
  mountedTab = null;
  if (sheet) sheet.mountedTab = null;
  sheet?.setContentMode(null);
}

/** Keep Today/Overview in main.content (homepage), not the hidden host or sheet. */
function restoreOverviewToMain() {
  const panel = getPanel(PHONE_HOME_TAB);
  const main = document.querySelector("main.content");
  if (!panel || !main || panel.parentElement === main) return;
  const topBar = main.querySelector(".top-bar");
  if (topBar?.nextElementSibling) main.insertBefore(panel, topBar.nextElementSibling);
  else main.prepend(panel);
}

/** Phone homepage: close nav sheet and show Today in the main scroll area. */
function showPhoneHomeTab() {
  const sheet = getPhoneSheet();
  restorePhoneNavPanel();
  restoreOverviewToMain();
  sheet?.close();
}

function resetSheetScroll(sheet) {
  if (sheet?.bodyEl) sheet.bodyEl.scrollTop = 0;
}

function mountPanel(tab) {
  const sheet = getPhoneSheet();
  const panel = getPanel(tab);
  if (!sheet?.bodyEl || !panel) return false;

  window.whoofRestoreBlePanel?.();

  const inSheet = sheet.bodyEl.querySelector(".tab-panel");
  if (mountedTab === tab && inSheet === panel) {
    sheet.setContentMode("nav");
    resetSheetScroll(sheet);
    return true;
  }

  if (inSheet && inSheet !== panel) {
    getPanelHome().appendChild(inSheet);
  } else if (!inSheet) {
    restorePhoneNavPanel();
  }

  sheet.bodyEl.appendChild(panel);
  mountedTab = tab;
  sheet.mountedTab = tab;
  sheet.setContentMode("nav");
  resetSheetScroll(sheet);
  return true;
}

function openNavSheet(tab) {
  const sheet = getPhoneSheet();
  if (!sheet || !MOBILE_NAV_TABS.includes(tab)) return false;

  sheet.setTitle(TAB_TITLES[tab] || tab);
  if (!mountPanel(tab)) return false;

  if (sheet.isOpen) return true;
  return sheet.open();
}

/**
 * Wire bottom-nav taps + post-setTab hook so phone uses pull-up cards.
 * Requires window.setTab from app.js.
 */
export function initPhoneNavSheets() {
  const sheet = getPhoneSheet();
  if (!sheet) return;

  sheet.setOnClose(() => {
    if (sheet.contentMode !== "nav") return;
    restorePhoneNavPanel();
    // Dismissed detail sheet → return to Today home in main scroll area.
    const activeMtab = document.querySelector(".mtab.active");
    if (activeMtab?.dataset.tab && activeMtab.dataset.tab !== PHONE_HOME_TAB) {
      window.setTab?.(PHONE_HOME_TAB);
    }
  });

  window.whoofPhoneNavTap = (tab) => {
    if (!isPhone() || !MOBILE_NAV_TABS.includes(tab)) return false;

    const alreadyActive = document.querySelector(`.mtab[data-tab="${tab}"]`)?.classList.contains("active");
    if (alreadyActive && sheet.isOpen && sheet.contentMode === "nav" && mountedTab === tab) {
      sheet.close();
      return true;
    }
    if (alreadyActive && !sheet.isOpen) {
      openNavSheet(tab);
      return true;
    }

    window.setTab?.(tab); // whoofAfterSetTab opens the sheet
    return true;
  };

  window.whoofAfterSetTab = (tab) => {
    if (!isPhone()) return;
    if (tab === PHONE_HOME_TAB) {
      showPhoneHomeTab();
      return;
    }
    if (!MOBILE_NAV_TABS.includes(tab)) return;
    // Sidebar hash links / deep links: sheet for mobile nav tabs only.
    if (!document.querySelector(`.mtab[data-tab="${tab}"]`)?.classList.contains("active")) return;
    openNavSheet(tab);
  };

  window.whoofRestoreNavPanel = restorePhoneNavPanel;

  /** Hero ring cards on Today → open the matching nav pull-up sheet on phone. */
  document.querySelectorAll(
    `.tab-panel[data-panel="${PHONE_HOME_TAB}"] .ring-card-link[data-nav-tab]`
  ).forEach((card) => {
    const tab = card.dataset.navTab;
    if (!tab || !MOBILE_NAV_TABS.includes(tab)) return;

    card.addEventListener("click", () => {
      window.setTab?.(tab);
    });
    card.addEventListener("keydown", (ev) => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      ev.preventDefault();
      card.click();
    });
  });

  phoneMediaQuery().addEventListener("change", (ev) => {
    if (!ev.matches) {
      restorePhoneNavPanel();
      restoreOverviewToMain();
      window.whoofRestoreBlePanel?.();
      sheet.close();
    }
  });
}
