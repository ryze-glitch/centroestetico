# La Crisalide — Centro Estetico

Sito web moderno per il centro estetico "La Crisalide", con backend
**Firebase** (Authentication email/password + Cloud Firestore).

## Struttura del progetto

```
public/               ← cartella pubblicata su Firebase Hosting
  index.html
  css/style.css
  js/
    firebase-config.js  ← credenziali dell'app web (già compilate)
    firebase-init.js
    auth.js              ← login / registrazione / logout
    booking.js            ← prenotazioni (Firestore)
    ui.js                  ← toast + modale di autenticazione
    app.js                  ← nav, menu mobile, animazioni

firebase.json          ← config Hosting + Firestore + Auth
.firebaserc             ← progetto di default: estetica-lacrisalide
firestore.rules         ← regole di sicurezza Firestore
firestore.indexes.json  ← indici composti
```

## ⚠️ Passaggi da completare (richiedono il tuo account Firebase)

Questo ambiente di sviluppo remoto **non ha accesso di rete** a
`auth.firebase.tools` / `console.firebase.google.com` (bloccati dal
proxy di rete), quindi non è stato possibile eseguire da qui il login
interattivo della Firebase CLI né il deploy. Il codice è pronto e già
configurato con l'app web che hai registrato tu (`La Crisalide Web`,
`public/js/firebase-config.js` già compilato). Restano da fare, in
locale (o dalla Console Firebase) con il tuo account:

### 1. Login e selezione progetto

```bash
npx -y firebase-tools@latest login
npx -y firebase-tools@latest use estetica-lacrisalide
```

### 2. Abilita l'autenticazione Email/Password

**Opzione CLI** — il blocco `auth` è già presente in `firebase.json`,
basta effettuare il deploy:

```bash
npx -y firebase-tools@latest deploy --only auth --project estetica-lacrisalide
```

**Oppure dalla Console** — [Authentication → Sign-in
method](https://console.firebase.google.com/project/estetica-lacrisalide/authentication/providers)
→ abilita **Email/Password**.

### 3. Crea il database Firestore (se non esiste già)

```bash
npx -y firebase-tools@latest firestore:databases:list --project estetica-lacrisalide
```

Se non esiste ancora un'istanza `(default)`, creala (scegli una
location vicina ai tuoi utenti, es. `eur3`):

```bash
npx -y firebase-tools@latest firestore:databases:create "(default)" \
  --location=eur3 --project estetica-lacrisalide
```

### 4. Deploy delle regole Firestore e dell'Hosting

```bash
npx -y firebase-tools@latest deploy \
  --only hosting,firestore:rules,firestore:indexes \
  --project estetica-lacrisalide
```

Il sito sarà disponibile su `https://estetica-lacrisalide.web.app`.

## Sviluppo locale

```bash
npx -y firebase-tools@latest emulators:start --only hosting,auth,firestore
```

## Modello dati Firestore

- **`users/{uid}`** — profilo cliente (`displayName`, `email`, `phone?`,
  `createdAt`). Leggibile/scrivibile solo dal proprietario.
- **`bookings/{bookingId}`** — richieste di prenotazione (`uid`,
  `service`, `date`, `time`, `notes?`, `status`, `createdAt`). Ogni
  utente vede e crea solo le proprie prenotazioni; può solo annullarle
  (`richiesta` → `annullata`), non modificarle o cancellarle.

## Sicurezza

`firestore.rules` implementa un modello **deny-by-default**: ogni
collezione è ad accesso esclusivo del proprietario autenticato, con
validazione dei campi, dei tipi e delle dimensioni su create/update.
Sono regole prototipali pensate per essere sicure per l'uso attuale del
sito (nessun ruolo staff/admin è ancora implementato); prima di un
lancio su larga scala, rivedile e — se in futuro aggiungi un pannello
per lo staff (conferma prenotazioni, ecc.) — fammi sapere: andranno
estese con un vero controllo dei ruoli.

## Personalizzazione contenuti

Indirizzo, telefono, email, orari e prezzi dei servizi in
`public/index.html` sono segnaposto: aggiornali con i dati reali del
centro prima di pubblicare il sito.
