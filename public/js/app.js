// General UI behaviour: nav scroll state, mobile menu, scroll reveal, footer year.

const nav = document.getElementById("siteNav");
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

const onScroll = () => {
  nav?.classList.toggle("is-scrolled", window.scrollY > 12);
};
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

hamburger?.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("is-open");
  hamburger.classList.toggle("is-open", isOpen);
  hamburger.setAttribute("aria-expanded", String(isOpen));
});

navLinks?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("is-open");
    hamburger?.classList.remove("is-open");
    hamburger?.setAttribute("aria-expanded", "false");
  });
});

const revealTargets = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealTargets.forEach((el) => observer.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add("is-visible"));
}

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Set a sensible minimum date on the booking date input (today).
const bkDate = document.getElementById("bkDate");
if (bkDate) {
  const today = new Date().toISOString().slice(0, 10);
  bkDate.min = today;
}
