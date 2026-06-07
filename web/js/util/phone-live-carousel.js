import { isPhone, initPhoneClass, phoneMediaQuery } from "./phone.js";

const LIVE_TAB = "live";
const HOME_TAB = "overview";

let carousel = null;
let track = null;
let liveOpen = false;
let carouselReady = false;

function getPanel(tab) {
  return document.querySelector(`.tab-panel[data-panel="${tab}"]`);
}

function ensurePanelHost() {
  let host = document.getElementById("tab-panels-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "tab-panels-host";
    host.hidden = true;
    host.setAttribute("aria-hidden", "true");
    document.querySelector("main.content")?.appendChild(host);
  }
  return host;
}

function ensureCarousel() {
  if (!isPhone()) return false;
  if (carouselReady && carousel) return true;

  const main = document.querySelector("main.content");
  const topBar = main?.querySelector(".top-bar");
  const overview = getPanel(HOME_TAB);
  const live = getPanel(LIVE_TAB);
  if (!main || !topBar || !overview || !live) return false;

  initPhoneClass();

  carousel = document.createElement("div");
  carousel.className = "phone-page-carousel";
  carousel.id = "phone-page-carousel";

  track = document.createElement("div");
  track.className = "phone-page-track";

  const homeSlide = document.createElement("div");
  homeSlide.className = "phone-page-slide";
  homeSlide.dataset.phonePage = HOME_TAB;

  const liveSlide = document.createElement("div");
  liveSlide.className = "phone-page-slide";
  liveSlide.dataset.phonePage = LIVE_TAB;

  track.appendChild(liveSlide);
  track.appendChild(homeSlide);
  carousel.appendChild(track);
  topBar.insertAdjacentElement("afterend", carousel);

  homeSlide.appendChild(overview);
  liveSlide.appendChild(live);

  carouselReady = true;
  if (liveOpen) carousel.classList.add("is-live");
  window.whoofTopbarScrollRefresh?.();
  return true;
}

function teardownCarousel() {
  if (!carouselReady) return;

  const main = document.querySelector("main.content");
  const topBar = main?.querySelector(".top-bar");
  const overview = getPanel(HOME_TAB);
  const live = getPanel(LIVE_TAB);
  const host = ensurePanelHost();

  if (overview && topBar) {
    topBar.insertAdjacentElement("afterend", overview);
  }
  if (live) {
    host.appendChild(live);
  }

  carousel?.remove();
  carousel = null;
  track = null;
  carouselReady = false;
  liveOpen = false;
  document.body.classList.remove("phone-live-page");
  document.getElementById("topbar-live-btn")?.classList.remove("active");
  window.whoofTopbarScrollRefresh?.();
}

export function isPhoneLivePageOpen() {
  return liveOpen;
}

export function showPhoneLivePage() {
  if (!isPhone()) return false;
  if (!ensureCarousel()) return false;
  if (liveOpen) return true;

  liveOpen = true;
  carousel.classList.add("is-live");
  document.body.classList.add("phone-live-page");
  document.getElementById("topbar-live-btn")?.classList.add("active");
  window.whoofLoadLive?.();

  const liveSlide = track?.querySelector(`[data-phone-page="${LIVE_TAB}"]`);
  if (liveSlide) liveSlide.scrollTop = 0;
  window.whoofTopbarScrollRefresh?.();
  return true;
}

export function showPhoneHomePage() {
  if (!liveOpen) return;
  liveOpen = false;
  carousel?.classList.remove("is-live");
  document.body.classList.remove("phone-live-page");
  document.getElementById("topbar-live-btn")?.classList.remove("active");

  const homeSlide = track?.querySelector(`[data-phone-page="${HOME_TAB}"]`);
  if (homeSlide) homeSlide.scrollTop = 0;
  window.whoofTopbarScrollRefresh?.();
}

export function initPhoneLiveCarousel() {
  if (isPhone()) ensureCarousel();

  window.whoofShowPhoneLivePage = showPhoneLivePage;
  window.whoofShowPhoneHomePage = showPhoneHomePage;

  phoneMediaQuery().addEventListener("change", (ev) => {
    if (!ev.matches) teardownCarousel();
  });
}
