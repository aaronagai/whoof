import { isPhone, phoneMediaQuery } from "./phone.js";
import { getPhoneSheet } from "./phone-sheet.js";

/** Live sidebar nodes moved into the phone sheet (order preserved on restore). */
const BLE_SHEET_NODE_IDS = ["mvp-panel", "open-settings"];

let bleMounted = false;

function getSidebar() {
  return document.querySelector(".sidebar");
}

/** Move BLE panel (+ settings) back into the sidebar for desktop / when sheet closes. */
export function restorePhoneBlePanel() {
  const sidebar = getSidebar();
  if (!sidebar) return;

  const anchor = document.getElementById("health-setup");
  for (const id of BLE_SHEET_NODE_IDS) {
    const el = document.getElementById(id);
    if (!el || el.parentElement === sidebar) continue;
    if (anchor) sidebar.insertBefore(el, anchor);
    else sidebar.appendChild(el);
  }
  bleMounted = false;
  const sheet = getPhoneSheet();
  if (sheet?.contentMode === "ble") sheet.setContentMode(null);
}

function mountBlePanel() {
  const sheet = getPhoneSheet();
  if (!sheet?.bodyEl) return false;

  const wrapper =
    sheet.bodyEl.querySelector(".phone-ble-sheet") ||
    (() => {
      const el = document.createElement("div");
      el.className = "phone-ble-sheet";
      return el;
    })();

  for (const id of BLE_SHEET_NODE_IDS) {
    const node = document.getElementById(id);
    if (node && node.parentElement !== wrapper) wrapper.appendChild(node);
  }

  if (!wrapper.childElementCount) return false;

  sheet.setTitle("Bluetooth");
  sheet.setBody(wrapper, "ble");
  bleMounted = true;
  return true;
}

function openBleSheet() {
  const sheet = getPhoneSheet();
  if (!sheet) return false;

  if (sheet.isOpen && sheet.contentMode === "ble") {
    sheet.close();
    return true;
  }

  if (!mountBlePanel()) return false;
  if (sheet.isOpen) return true;
  return sheet.open();
}

/**
 * Phone-only: profile avatar opens the sidebar BLE / device panel in a pull-up sheet.
 */
export function initPhoneBleSheet() {
  const profile = document.getElementById("profile-btn") || document.querySelector(".user-profile");
  const sheet = getPhoneSheet();
  if (!profile || !sheet) return;

  window.whoofRestoreBlePanel = restorePhoneBlePanel;

  profile.addEventListener("click", () => {
    if (!isPhone()) return;
    openBleSheet();
  });

  profile.addEventListener("keydown", (ev) => {
    if (!isPhone()) return;
    if (ev.key !== "Enter" && ev.key !== " ") return;
    ev.preventDefault();
    openBleSheet();
  });

  phoneMediaQuery().addEventListener("change", (ev) => {
    if (!ev.matches) {
      restorePhoneBlePanel();
      getPhoneSheet()?.close();
    }
  });
}

export function isBlePanelMounted() {
  return bleMounted;
}
