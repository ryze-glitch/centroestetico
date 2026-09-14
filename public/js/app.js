import { SERVICE_CATEGORIES } from "./services-data.js";

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

// ------------------------------------------------------------
// Render the price menu (servizi) from the shared catalog
// ------------------------------------------------------------
const menuCategories = document.getElementById("menuCategories");
if (menuCategories) {
  SERVICE_CATEGORIES.forEach((cat) => {
    const wrap = document.createElement("div");
    wrap.className = "menu-category";

    const title = document.createElement("h3");
    title.className = "menu-category-title";
    title.textContent = cat.category;
    wrap.appendChild(title);

    cat.items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "menu-row";

      const name = document.createElement("span");
      name.className = "menu-row-name";
      name.textContent = item.name;

      const leader = document.createElement("span");
      leader.className = "menu-row-leader";
      leader.setAttribute("aria-hidden", "true");

      const duration = document.createElement("span");
      duration.className = "menu-row-duration";
      duration.textContent = `${item.duration} min`;

      const price = document.createElement("span");
      price.className = "menu-row-price";
      price.textContent = `€${item.price}`;

      const book = document.createElement("button");
      book.type = "button";
      book.className = "menu-row-book";
      book.dataset.service = item.name;
      book.textContent = "Prenota";

      row.append(name, leader, duration, price, book);
      wrap.appendChild(row);
    });

    menuCategories.appendChild(wrap);
  });
}

// ------------------------------------------------------------
// Render the hero marquee from the catalog's treatment names
// ------------------------------------------------------------
function renderMarquee(elId) {
  const track = document.getElementById(elId);
  if (!track) return;
  SERVICE_CATEGORIES.forEach((cat) => {
    cat.items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item.name;
      track.appendChild(li);
    });
  });
}
renderMarquee("marqueeTrack");
renderMarquee("marqueeTrackDup");
