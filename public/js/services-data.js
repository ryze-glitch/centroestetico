// ============================================================
// Catalogo trattamenti — unica fonte di verità per il menu servizi
// e per il form di prenotazione. Prezzi e durate sono una BOZZA:
// vanno sostituiti con i dati reali del centro.
//
// Se aggiungi/rinomini un trattamento qui, aggiorna anche l'elenco
// "allowed" dentro isValidService() in firestore.rules — le regole
// rifiutano qualunque nome di servizio non presente in quella lista.
// ============================================================

export const STAFF = [
  { id: "any", name: "Nessuna preferenza" },
  // Sostituisci con i nomi reali dello staff, es:
  // { id: "titolare", name: "Titolare" },
  // { id: "estetista-1", name: "Nome Estetista" },
];

export const SERVICE_CATEGORIES = [
  {
    category: "Viso",
    items: [
      { name: "Pulizia del viso profonda", duration: 60, price: 45 },
      { name: "Trattamento idratante", duration: 50, price: 40 },
      { name: "Trattamento anti-age", duration: 75, price: 65 },
    ],
  },
  {
    category: "Corpo",
    items: [
      { name: "Trattamento drenante", duration: 50, price: 55 },
      { name: "Trattamento rimodellante", duration: 60, price: 60 },
      { name: "Scrub corpo e nutrimento", duration: 45, price: 50 },
    ],
  },
  {
    category: "Massaggi",
    items: [
      { name: "Massaggio rilassante", duration: 50, price: 50 },
      { name: "Massaggio decontratturante", duration: 50, price: 55 },
      { name: "Massaggio californiano", duration: 60, price: 60 },
    ],
  },
  {
    category: "Epilazione",
    items: [
      { name: "Epilazione gambe complete", duration: 30, price: 25 },
      { name: "Epilazione inguine", duration: 20, price: 15 },
      { name: "Epilazione baffetti", duration: 10, price: 8 },
    ],
  },
  {
    category: "Mani e Piedi",
    items: [
      { name: "Manicure", duration: 40, price: 20 },
      { name: "Pedicure", duration: 45, price: 25 },
      { name: "Semipermanente mani", duration: 50, price: 30 },
    ],
  },
  {
    category: "Make-up",
    items: [
      { name: "Make-up giorno", duration: 45, price: 35 },
      { name: "Make-up sera", duration: 60, price: 45 },
      { name: "Make-up sposa (con prova)", duration: 90, price: 90 },
    ],
  },
];

// Flat lookup: "Manicure" -> { name, duration, price, category }
export const SERVICE_BY_NAME = Object.fromEntries(
  SERVICE_CATEGORIES.flatMap((cat) =>
    cat.items.map((item) => [item.name, { ...item, category: cat.category }])
  )
);

// Orari di apertura per la generazione delle fasce orarie prenotabili.
// 0 = Domenica ... 6 = Sabato. Omesso = chiuso.
export const OPENING_HOURS = {
  1: { open: "09:00", close: "19:00" },
  2: { open: "09:00", close: "19:00" },
  3: { open: "09:00", close: "19:00" },
  4: { open: "09:00", close: "19:00" },
  5: { open: "09:00", close: "19:00" },
  6: { open: "09:00", close: "18:00" },
};

export const LUNCH_BREAK = { start: "13:00", end: "14:00" };
export const SLOT_STEP_MINUTES = 30;
