import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { db } from "./firebase-init.js";
import { getCurrentUser } from "./auth.js";
import { showToast, setFormMessage } from "./ui.js";
import {
  SERVICE_CATEGORIES,
  SERVICE_BY_NAME,
  STAFF,
  OPENING_HOURS,
  LUNCH_BREAK,
  SLOT_STEP_MINUTES,
} from "./services-data.js";

const bookingForm = document.getElementById("bookingForm");
const bookingsList = document.getElementById("bookingsList");
const bookingsEmpty = document.getElementById("bookingsEmpty");
const bkServiceSelect = document.getElementById("bkService");
const bkOperatorSelect = document.getElementById("bkOperator");
const bkServiceInfo = document.getElementById("bkServiceInfo");
const bkDateInput = document.getElementById("bkDate");
const bkSlotsContainer = document.getElementById("bkSlots");
const bkTimeInput = document.getElementById("bkTime");

let unsubscribe = null;

const STATUS_LABEL = {
  richiesta: "In attesa",
  confermata: "Confermata",
  annullata: "Annullata",
};

// ------------------------------------------------------------
// Populate the treatment + operator selects from the catalog
// ------------------------------------------------------------
function populateServiceSelect() {
  if (!bkServiceSelect) return;
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.disabled = true;
  placeholder.selected = true;
  placeholder.textContent = "Scegli un trattamento";
  bkServiceSelect.appendChild(placeholder);

  SERVICE_CATEGORIES.forEach((cat) => {
    const group = document.createElement("optgroup");
    group.label = cat.category;
    cat.items.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item.name;
      opt.textContent = `${item.name} — ${item.duration} min — €${item.price}`;
      group.appendChild(opt);
    });
    bkServiceSelect.appendChild(group);
  });
}

function populateOperatorSelect() {
  if (!bkOperatorSelect) return;
  STAFF.forEach((person) => {
    const opt = document.createElement("option");
    opt.value = person.id === "any" ? "" : person.name;
    opt.textContent = person.name;
    bkOperatorSelect.appendChild(opt);
  });
}

populateServiceSelect();
populateOperatorSelect();

// ------------------------------------------------------------
// Time slot generation from opening hours + treatment duration
// ------------------------------------------------------------
function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minutesToTime(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function generateSlots(dateStr, durationMinutes) {
  if (!dateStr || !durationMinutes) return [];
  const [y, mo, da] = dateStr.split("-").map(Number);
  const dateObj = new Date(y, mo - 1, da);
  const hours = OPENING_HOURS[dateObj.getDay()];
  if (!hours) return [];

  const openMin = timeToMinutes(hours.open);
  const closeMin = timeToMinutes(hours.close);
  const lunchStart = timeToMinutes(LUNCH_BREAK.start);
  const lunchEnd = timeToMinutes(LUNCH_BREAK.end);

  const now = new Date();
  const isToday = dateObj.toDateString() === now.toDateString();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const slots = [];
  for (let t = openMin; t + durationMinutes <= closeMin; t += SLOT_STEP_MINUTES) {
    if (isToday && t <= nowMin) continue;
    const slotEnd = t + durationMinutes;
    const overlapsLunch = t < lunchEnd && slotEnd > lunchStart;
    if (overlapsLunch) continue;
    slots.push(minutesToTime(t));
  }
  return slots;
}

function renderSlots() {
  if (!bkSlotsContainer) return;
  bkSlotsContainer.innerHTML = "";
  bkTimeInput.value = "";

  const service = SERVICE_BY_NAME[bkServiceSelect.value];
  const date = bkDateInput.value;

  if (!service || !date) {
    const hint = document.createElement("p");
    hint.className = "muted small";
    hint.textContent = "Scegli prima un trattamento e una data.";
    bkSlotsContainer.appendChild(hint);
    return;
  }

  const slots = generateSlots(date, service.duration);
  if (slots.length === 0) {
    const hint = document.createElement("p");
    hint.className = "muted small";
    hint.textContent = "Nessun orario disponibile in questa data: prova un altro giorno.";
    bkSlotsContainer.appendChild(hint);
    return;
  }

  slots.forEach((slot) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "slot-btn";
    btn.textContent = slot;
    btn.addEventListener("click", () => {
      bkTimeInput.value = slot;
      [...bkSlotsContainer.querySelectorAll(".slot-btn")].forEach((b) =>
        b.classList.toggle("is-selected", b === btn)
      );
    });
    bkSlotsContainer.appendChild(btn);
  });
}

bkServiceSelect?.addEventListener("change", () => {
  const service = SERVICE_BY_NAME[bkServiceSelect.value];
  bkServiceInfo.textContent = service ? `${service.duration} minuti · €${service.price}` : "";
  renderSlots();
});
bkDateInput?.addEventListener("change", renderSlots);

// Set a sensible minimum date (today) once services-data is loaded.
if (bkDateInput) {
  bkDateInput.min = new Date().toISOString().slice(0, 10);
}

// ------------------------------------------------------------
// Submit a booking request
// ------------------------------------------------------------
bookingForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = getCurrentUser();
  if (!user) {
    showToast("Devi accedere per prenotare.", "error");
    return;
  }

  const service = bkServiceSelect.value;
  const operator = bkOperatorSelect.value;
  const date = bkDateInput.value;
  const time = bkTimeInput.value;
  const notes = document.getElementById("bkNotes").value.trim();
  const submitBtn = document.getElementById("bookingSubmitBtn");

  setFormMessage("bookingMsg", "");

  if (!time) {
    setFormMessage("bookingMsg", "Scegli un orario tra quelli disponibili.", "error");
    return;
  }

  submitBtn.disabled = true;
  try {
    const payload = {
      uid: user.uid,
      service,
      date,
      time,
      status: "richiesta",
      createdAt: serverTimestamp(),
    };
    if (operator) payload.operator = operator;
    if (notes) payload.notes = notes;

    await addDoc(collection(db, "bookings"), payload);
    bookingForm.reset();
    bkServiceInfo.textContent = "";
    renderSlots();
    setFormMessage("bookingMsg", "Richiesta inviata! Ti contatteremo per confermare.", "success");
    showToast("Prenotazione inviata con successo.", "success");
  } catch (error) {
    setFormMessage("bookingMsg", "Impossibile inviare la richiesta. Riprova.", "error");
  } finally {
    submitBtn.disabled = false;
  }
});

// ------------------------------------------------------------
// Live list of the current user's bookings
// ------------------------------------------------------------
function renderBookings(snapshot) {
  if (!bookingsList) return;
  [...bookingsList.querySelectorAll(".booking-item")].forEach((el) => el.remove());

  if (snapshot.empty) {
    if (bookingsEmpty) {
      bookingsEmpty.textContent = "Non hai ancora prenotazioni. Prenota il tuo primo trattamento!";
      bookingsEmpty.hidden = false;
    }
    return;
  }
  if (bookingsEmpty) bookingsEmpty.hidden = true;

  snapshot.forEach((docSnap) => {
    const b = docSnap.data();
    const li = document.createElement("li");
    li.className = "booking-item";

    const main = document.createElement("div");
    main.className = "booking-item-main";
    const title = document.createElement("strong");
    title.textContent = b.service;
    const meta = document.createElement("span");
    meta.className = "muted small";
    meta.textContent = `${b.date} · ${b.time}${b.operator ? " · " + b.operator : ""}`;
    main.append(title, meta);

    const right = document.createElement("div");
    right.style.display = "flex";
    right.style.alignItems = "center";
    right.style.gap = "10px";

    const status = document.createElement("span");
    status.className = `booking-status status-${b.status}`;
    status.textContent = STATUS_LABEL[b.status] || b.status;
    right.appendChild(status);

    if (b.status === "richiesta") {
      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "cancel-btn";
      cancelBtn.textContent = "Annulla";
      cancelBtn.addEventListener("click", () => cancelBooking(docSnap.id));
      right.appendChild(cancelBtn);
    }

    li.append(main, right);
    bookingsList.appendChild(li);
  });
}

async function cancelBooking(bookingId) {
  try {
    await updateDoc(doc(db, "bookings", bookingId), { status: "annullata" });
    showToast("Prenotazione annullata.");
  } catch (error) {
    showToast("Impossibile annullare la prenotazione.", "error");
  }
}

function subscribeToBookings(user) {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  if (!user || !bookingsList) return;

  const q = query(
    collection(db, "bookings"),
    where("uid", "==", user.uid),
    orderBy("date", "desc")
  );
  unsubscribe = onSnapshot(q, renderBookings, () => {
    showToast("Impossibile caricare le prenotazioni.", "error");
  });
}

document.addEventListener("auth-changed", (e) => subscribeToBookings(e.detail.user));

// Pre-fill and scroll to the booking form when a "Prenota" link is clicked
// from the price menu.
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".menu-row-book, .book-service");
  if (!btn) return;
  const service = btn.dataset.service;
  if (service && bkServiceSelect) {
    bkServiceSelect.value = service;
    bkServiceSelect.dispatchEvent(new Event("change"));
  }
  document.getElementById("prenota")?.scrollIntoView({ behavior: "smooth" });
});
