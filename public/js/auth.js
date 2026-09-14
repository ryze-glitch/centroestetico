import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { auth, db } from "./firebase-init.js";
import { showToast, openAuthModal, closeAuthModal, setAuthTab, setFormMessage, authErrorMessage } from "./ui.js";

let currentUser = null;
export function getCurrentUser() {
  return currentUser;
}

const authBtn = document.getElementById("authBtn");
const authModalClose = document.getElementById("authModalClose");
const authModal = document.getElementById("authModal");
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const promptLoginBtn = document.getElementById("promptLoginBtn");

authBtn?.addEventListener("click", () => {
  if (currentUser) {
    signOut(auth).then(() => showToast("Hai effettuato il logout.")).catch(() => {});
  } else {
    openAuthModal("login");
  }
});

promptLoginBtn?.addEventListener("click", () => openAuthModal("login"));
authModalClose?.addEventListener("click", closeAuthModal);
authModal?.addEventListener("click", (e) => {
  if (e.target === authModal) closeAuthModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAuthModal();
});

tabLogin?.addEventListener("click", () => setAuthTab("login"));
tabRegister?.addEventListener("click", () => setAuthTab("register"));

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const submitBtn = loginForm.querySelector("button[type=submit]");
  setFormMessage("loginMsg", "");
  submitBtn.disabled = true;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginForm.reset();
    closeAuthModal();
    showToast("Bentornata! Accesso effettuato.", "success");
  } catch (error) {
    setFormMessage("loginMsg", authErrorMessage(error), "error");
  } finally {
    submitBtn.disabled = false;
  }
});

registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;
  const submitBtn = registerForm.querySelector("button[type=submit]");
  setFormMessage("registerMsg", "");
  submitBtn.disabled = true;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, "users", cred.user.uid), {
      displayName: name,
      email,
      createdAt: serverTimestamp(),
    });
    registerForm.reset();
    closeAuthModal();
    showToast("Account creato! Benvenuta da La Crisalide.", "success");
  } catch (error) {
    setFormMessage("registerMsg", authErrorMessage(error), "error");
  } finally {
    submitBtn.disabled = false;
  }
});

function applyAuthUI(user) {
  currentUser = user;
  const bookingLoggedOut = document.getElementById("bookingLoggedOut");
  const bookingForm = document.getElementById("bookingForm");
  const userEmailLabel = document.getElementById("userEmailLabel");
  const bookingsEmpty = document.getElementById("bookingsEmpty");

  if (user) {
    authBtn.textContent = "Esci";
    if (bookingLoggedOut) bookingLoggedOut.hidden = true;
    if (bookingForm) bookingForm.hidden = false;
    if (userEmailLabel) userEmailLabel.textContent = user.email || "";
  } else {
    authBtn.textContent = "Accedi";
    if (bookingLoggedOut) bookingLoggedOut.hidden = false;
    if (bookingForm) bookingForm.hidden = true;
    if (userEmailLabel) userEmailLabel.textContent = "";
    if (bookingsEmpty) {
      bookingsEmpty.textContent = "Accedi per vedere le tue prenotazioni.";
      bookingsEmpty.hidden = false;
    }
    const list = document.getElementById("bookingsList");
    if (list) {
      [...list.querySelectorAll(".booking-item")].forEach((el) => el.remove());
    }
  }

  document.dispatchEvent(new CustomEvent("auth-changed", { detail: { user } }));
}

onAuthStateChanged(auth, applyAuthUI);

export { openAuthModal };
