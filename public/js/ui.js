// Small shared UI helpers: toasts + the auth modal.

export function showToast(message, type = "default") {
  const host = document.getElementById("toastHost");
  if (!host) return;
  const toast = document.createElement("div");
  toast.className = `toast${type === "error" ? " is-error" : ""}${type === "success" ? " is-success" : ""}`;
  toast.textContent = message;
  host.appendChild(toast);
  setTimeout(() => toast.remove(), 4200);
}

const authModal = () => document.getElementById("authModal");

export function openAuthModal(tab = "login") {
  const modal = authModal();
  if (!modal) return;
  setAuthTab(tab);
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

export function closeAuthModal() {
  const modal = authModal();
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

export function setAuthTab(tab) {
  const tabLogin = document.getElementById("tabLogin");
  const tabRegister = document.getElementById("tabRegister");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  if (!tabLogin || !tabRegister || !loginForm || !registerForm) return;

  const isLogin = tab === "login";
  tabLogin.classList.toggle("is-active", isLogin);
  tabRegister.classList.toggle("is-active", !isLogin);
  loginForm.hidden = !isLogin;
  registerForm.hidden = isLogin;
}

export function setFormMessage(elId, message, type = "default") {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = message || "";
  el.classList.toggle("is-error", type === "error");
  el.classList.toggle("is-success", type === "success");
}

export function authErrorMessage(error) {
  const map = {
    "auth/invalid-email": "Indirizzo email non valido.",
    "auth/missing-password": "Inserisci una password.",
    "auth/user-not-found": "Nessun account trovato con questa email.",
    "auth/wrong-password": "Password errata.",
    "auth/invalid-credential": "Email o password non corrette.",
    "auth/email-already-in-use": "Esiste già un account con questa email.",
    "auth/weak-password": "La password deve avere almeno 6 caratteri.",
    "auth/too-many-requests": "Troppi tentativi. Riprova più tardi.",
    "auth/network-request-failed": "Errore di rete. Controlla la connessione.",
  };
  return map[error?.code] || "Si è verificato un errore. Riprova.";
}
