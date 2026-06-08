import { isPhone, phoneMediaQuery } from "./phone.js";
import { getPhoneSheet } from "./phone-sheet.js";
import {
  ensureTodayInCarousel,
  initPhoneLiveCarousel,
  isPhoneLivePageOpen,
  showPhoneHomePage,
  showPhoneLivePage,
} from "./phone-live-carousel.js";

/** Tabs in the bottom mobile nav (Today/overview is homepage; live is top-bar carousel page). */
export const MOBILE_NAV_TABS = ["sleep", "recovery", "strain", "trends"];

/** Phone homepage tab — shown in main content, not the bottom nav or pull-up sheet. */
export const PHONE_HOME_TAB = "overview";

/** Tab panel order in index.html — keeps DOM stable after phone → desktop. */
const DESKTOP_TAB_ORDER = [
  "overview",
  "recovery",
  "sleep",
  "strain",
  "trends",
  "live",
  "coach",
];

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

/** Keep Today/Overview in the visible phone carousel slide (or main on desktop). */
function restoreOverviewToMain() {
  if (isPhone()) {
    ensureTodayInCarousel();
    return;
  }
  restoreDesktopPanels();
}

/**
 * On desktop, tab panels must be direct children of main.content. Phone nav/sheet
 * and #tab-panels-host (hidden) leave panels invisible after a viewport resize.
 */
export function restoreDesktopPanels() {
  if (isPhone()) return;

  restorePhoneNavPanel();

  const main = document.querySelector("main.content");
  if (!main) return;

  const anchor =
    main.querySelector("#phone-page-carousel") || main.querySelector(".top-bar");
  if (!anchor) return;

  let insertAfter = anchor;
  for (const tab of DESKTOP_TAB_ORDER) {
    const panel = getPanel(tab);
    if (!panel) continue;
    insertAfter.insertAdjacentElement("afterend", panel);
    insertAfter = panel;
  }
}

/** Phone homepage: close overlays and show Today in the main scroll area. */
function showPhoneHomeTab() {
  showPhoneHomePage();
  const sheet = getPhoneSheet();
  restorePhoneNavPanel();
  restoreOverviewToMain();
  sheet?.close();
}

function resetSheetScroll(sheet) {
  if (sheet?.bodyEl) sheet.bodyEl.scrollTop = 0;
}

function mountPanel(tab) {
  showPhoneHomePage();

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
  initPhoneLiveCarousel();

  const sheet = getPhoneSheet();
  if (!sheet) return;

  sheet.setOnClose(() => {
    if (sheet.contentMode !== "nav") return;
    const wasTab = mountedTab;
    restorePhoneNavPanel();
    ensureTodayInCarousel();
    if (wasTab && wasTab !== PHONE_HOME_TAB) {
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
    if (!isPhone()) {
      restoreDesktopPanels();
      return;
    }
    if (tab === PHONE_HOME_TAB) {
      showPhoneHomeTab();
      return;
    }
    if (tab === "live") {
      showPhoneLivePage();
      return;
    }
    if (!MOBILE_NAV_TABS.includes(tab)) return;
    if (!document.querySelector(`.mtab[data-tab="${tab}"]`)?.classList.contains("active")) return;
    openNavSheet(tab);
  };

  window.whoofRestoreNavPanel = restorePhoneNavPanel;
  window.whoofRestoreDesktopPanels = restoreDesktopPanels;

  if (!isPhone()) restoreDesktopPanels();

  document.getElementById("topbar-live-btn")?.addEventListener("click", () => {
    if (!isPhone()) {
      window.setTab?.("live");
      return;
    }
    if (isPhoneLivePageOpen()) {
      showPhoneHomePage();
      return;
    }
    showPhoneLivePage();
  });

  /** Hero ring cards on Today → open the matching nav pull-up sheet on phone. */
  document.querySelectorAll(
    `.tab-panel[data-panel="${PHONE_HOME_TAB}"] .ring-card-link[data-nav-tab],` +
    `.tab-panel[data-panel="${PHONE_HOME_TAB}"] .metric-ring-col.ring-card-link[data-nav-tab]`
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
      restoreDesktopPanels();
      window.whoofRestoreBlePanel?.();
      sheet.close();
      showPhoneHomePage();
    }
  });
}
