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

const bookingForm = document.getElementById("bookingForm");
const bookingsList = document.getElementById("bookingsList");
const bookingsEmpty = document.getElementById("bookingsEmpty");

let unsubscribe = null;

const STATUS_LABEL = {
  richiesta: "In attesa",
  confermata: "Confermata",
  annullata: "Annullata",
};

bookingForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = getCurrentUser();
  if (!user) {
    showToast("Devi accedere per prenotare.", "error");
    return;
  }

  const service = document.getElementById("bkService").value;
  const date = document.getElementById("bkDate").value;
  const time = document.getElementById("bkTime").value;
  const notes = document.getElementById("bkNotes").value.trim();
  const submitBtn = document.getElementById("bookingSubmitBtn");

  setFormMessage("bookingMsg", "");
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
    if (notes) payload.notes = notes;

    await addDoc(collection(db, "bookings"), payload);
    bookingForm.reset();
    setFormMessage("bookingMsg", "Richiesta inviata! Ti contatteremo per confermare.", "success");
    showToast("Prenotazione inviata con successo.", "success");
  } catch (error) {
    setFormMessage("bookingMsg", "Impossibile inviare la richiesta. Riprova.", "error");
  } finally {
    submitBtn.disabled = false;
  }
});

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
    meta.textContent = `${b.date} · ${b.time}`;
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

// Pre-fill and scroll to the booking form when a service card CTA is clicked.
document.querySelectorAll(".book-service").forEach((btn) => {
  btn.addEventListener("click", () => {
    const service = btn.closest(".service-card")?.dataset.service;
    const select = document.getElementById("bkService");
    if (service && select) select.value = service;
    document.getElementById("prenota")?.scrollIntoView({ behavior: "smooth" });
  });
});
