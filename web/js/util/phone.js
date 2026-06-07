/** Phone viewport detection — matches styles.css @media (max-width: 720px). */
export const PHONE_MAX_PX = 720;

export function phoneMediaQuery() {
  return window.matchMedia(`(max-width: ${PHONE_MAX_PX}px)`);
}

export function isPhone() {
  return phoneMediaQuery().matches;
}

/** Toggle `is-phone` on <html> for CSS/JS that keys off a class hook. */
export function initPhoneClass() {
  const mq = phoneMediaQuery();
  const apply = () => {
    document.documentElement.classList.toggle("is-phone", mq.matches);
  };
  apply();
  mq.addEventListener("change", apply);
  return mq;
}
