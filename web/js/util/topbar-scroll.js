/** Toggle frosted glass on the sticky top bar when content is scrolled. */

const SCROLL_THRESHOLD = 12;

let topBar = null;
let rafPending = false;
const bound = new WeakSet();

function isWindowScroll(el) {
  return el === window;
}

function scrollTop(el) {
  if (isWindowScroll(el)) {
    return window.scrollY || document.documentElement.scrollTop || 0;
  }
  return el.scrollTop || 0;
}

/** Slides that can scroll on phone (bind listeners to all of them). */
function phoneSlides() {
  const carousel = document.getElementById("phone-page-carousel");
  if (!carousel) return [];
  return [...carousel.querySelectorAll(".phone-page-slide")];
}

/** Which slide's scroll position should drive the frosted state right now. */
function activePhoneSlide() {
  const carousel = document.getElementById("phone-page-carousel");
  if (!carousel) return null;
  const page = carousel.classList.contains("is-live") ? "live" : "overview";
  return carousel.querySelector(`.phone-page-slide[data-phone-page="${page}"]`);
}

/** Scroll containers that should drive top-bar state for the current layout. */
function activeScrollContainers() {
  const out = [];
  const carousel = document.getElementById("phone-page-carousel");

  if (carousel) {
    const slide = activePhoneSlide();
    if (slide) out.push(slide);
  } else {
    out.push(window);
  }

  if (document.body.classList.contains("phone-sheet-open")) {
    const sheetBody = document.querySelector(".phone-sheet.open .phone-sheet-body");
    if (sheetBody) out.push(sheetBody);
  }

  return out;
}

/** Every scrollable region we should listen to (may be wider than active). */
function scrollListenTargets() {
  const targets = [window, ...phoneSlides()];
  if (document.body.classList.contains("phone-sheet-open")) {
    const sheetBody = document.querySelector(".phone-sheet.open .phone-sheet-body");
    if (sheetBody) targets.push(sheetBody);
  }
  return targets;
}

function bindScrollTarget(target) {
  if (!target || bound.has(target)) return;
  bound.add(target);
  target.addEventListener("scroll", scheduleTopbarUpdate, { passive: true });
}

function updateTopbar() {
  rafPending = false;
  const bar = topBar || document.querySelector(".top-bar");
  if (!bar) return;

  const scrolled = activeScrollContainers().some(
    (el) => scrollTop(el) > SCROLL_THRESHOLD
  );
  bar.classList.toggle("is-scrolled", scrolled);
}

export function scheduleTopbarUpdate() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(updateTopbar);
}

/** Re-bind listeners after carousel/sheet layout changes and sync class. */
export function refreshTopbarScroll() {
  for (const el of scrollListenTargets()) bindScrollTarget(el);
  scheduleTopbarUpdate();
}

export function initTopbarScroll() {
  topBar = document.querySelector(".top-bar");
  if (!topBar) return;

  refreshTopbarScroll();
  requestAnimationFrame(refreshTopbarScroll);
  window.addEventListener("load", refreshTopbarScroll, { once: true });

  window.addEventListener("scroll", scheduleTopbarUpdate, { passive: true });
  window.addEventListener("resize", scheduleTopbarUpdate, { passive: true });

  const bodyObserver = new MutationObserver(refreshTopbarScroll);
  bodyObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });

  const main = document.querySelector("main.content");
  if (main) {
    const layoutObserver = new MutationObserver(refreshTopbarScroll);
    layoutObserver.observe(main, { childList: true, subtree: true });
  }

  const carousel = document.getElementById("phone-page-carousel");
  if (carousel) {
    const carouselObserver = new MutationObserver(refreshTopbarScroll);
    carouselObserver.observe(carousel, { attributes: true, attributeFilter: ["class"] });
  }

  window.whoofTopbarScrollRefresh = refreshTopbarScroll;
}
