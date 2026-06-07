import { isPhone, initPhoneClass } from "./phone.js";

let _sheet = null;

/**
 * Pull-up bottom sheet — only interactive when isPhone() is true.
 * On desktop/tablet the DOM exists but stays hidden via CSS.
 */
export class PhoneSheet {
  constructor(root) {
    this.root = root;
    this.backdrop = document.getElementById("phone-sheet-backdrop");
    this.titleEl = root.querySelector(".phone-sheet-title");
    this.bodyEl = root.querySelector(".phone-sheet-body");
    this.closeBtn = root.querySelector(".phone-sheet-close");

    this._open = false;
    this._onClose = null;
    this._contentMode = null;
    this.mountedTab = null;

    initPhoneClass();

    this.closeBtn?.addEventListener("click", () => this.close());
    this.backdrop?.addEventListener("click", () => this.close());

    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && this._open) this.close();
    });
  }

  setTitle(text) {
    if (this.titleEl) this.titleEl.textContent = text;
  }

  setBody(content, mode = "custom") {
    if (!this.bodyEl) return;
    if (this._contentMode === "nav") {
      window.whoofRestoreNavPanel?.();
    }
    if (this._contentMode === "ble") {
      window.whoofRestoreBlePanel?.();
    }
    this._contentMode = mode;
    this.root.classList.remove("phone-sheet--page");
    if (typeof content === "string") this.bodyEl.innerHTML = content;
    else {
      this.bodyEl.innerHTML = "";
      this.bodyEl.appendChild(content);
    }
  }

  setContentMode(mode) {
    this._contentMode = mode;
    this.root.classList.toggle("phone-sheet--page", mode === "nav");
  }

  get contentMode() {
    return this._contentMode;
  }

  setOnClose(fn) {
    this._onClose = typeof fn === "function" ? fn : null;
  }

  open() {
    if (!isPhone()) return false;
    this._open = true;
    this.root.hidden = false;
    this.root.classList.add("open");
    this.backdrop?.classList.add("open");
    this.backdrop?.removeAttribute("hidden");
    document.body.classList.add("phone-sheet-open");
    this.root.setAttribute("aria-hidden", "false");
    if (this.bodyEl) this.bodyEl.scrollTop = 0;
    return true;
  }

  close() {
    if (!this._open) return;
    if (this._contentMode === "ble") {
      window.whoofRestoreBlePanel?.();
    }
    this._onClose?.();
    this._open = false;
    this.root.classList.remove("open");
    this.backdrop?.classList.remove("open");
    document.body.classList.remove("phone-sheet-open");
    const root = this.root;
    const backdrop = this.backdrop;
    window.setTimeout(() => {
      if (!root.classList.contains("open")) {
        root.hidden = true;
        root.setAttribute("aria-hidden", "true");
        backdrop?.setAttribute("hidden", "");
      }
    }, 260);
  }

  get isOpen() {
    return this._open;
  }
}

export function getPhoneSheet() {
  if (!_sheet) {
    const el = document.getElementById("phone-sheet");
    if (el) _sheet = new PhoneSheet(el);
  }
  return _sheet;
}
