# La Crisalide — Centro Estetico

Sito web moderno per il centro estetico "La Crisalide", con backend
**Firebase** (Authentication email/password + Cloud Firestore).

## Struttura del progetto

```
public/               ← cartella pubblicata su Firebase Hosting
  index.html
  css/style.css
  js/
    services-data.js    ← catalogo trattamenti, staff, orari di apertura
    firebase-config.js  ← credenziali dell'app web (già compilate)
    firebase-init.js
    auth.js              ← login / registrazione / logout
    booking.js            ← prenotazioni (Firestore) + fasce orarie
    ui.js                  ← toast + modale di autenticazione
    app.js                  ← nav, menu mobile, animazioni, listino, marquee

firebase.json          ← config Hosting + Firestore + Auth
.firebaserc             ← progetto di default: estetica-lacrisalide
firestore.rules         ← regole di sicurezza Firestore
firestore.indexes.json  ← indici composti
```

## Stato del deploy

Il sito è **già pubblicato**: https://estetica-lacrisalide.web.app
(Hosting, Auth Email/Password e Firestore sono già configurati e
live sul progetto `estetica-lacrisalide`).

Dopo ogni modifica al codice va rifatto il deploy. Da questo ambiente
sandbox **non è possibile farlo direttamente**: la rete blocca
`auth.firebase.tools` e `console.firebase.google.com`, quindi il login
interattivo della Firebase CLI non può completarsi qui.

### Deploy automatico (consigliato — un solo passaggio da fare, una volta sola)

C'è un workflow GitHub Actions già pronto
(`.github/workflows/firebase-deploy.yml`) che pubblica in automatico
Hosting + regole/indici Firestore a ogni push su `main` (o manualmente
dal tab "Actions" del repo su GitHub, pulsante "Run workflow" — funziona
anche da telefono, senza terminale). Gli serve un solo segreto,
`FIREBASE_TOKEN`, da configurare **una volta sola**:

1. Da un terminale qualsiasi (PC, o Google Cloud Shell su
   https://shell.cloud.google.com se non hai un PC a portata di mano),
   genera un token:
   ```bash
   npx -y firebase-tools@latest login:ci --no-localhost
   ```
   Segui il link, autorizza, copia il token stampato alla fine.
2. Vai su GitHub → repo `centroestetico` → **Settings → Secrets and
   variables → Actions → New repository secret**. Nome: `FIREBASE_TOKEN`,
   valore: il token copiato. Salva.

Da quel momento ogni push su `main` pubblica da solo — nessun altro
passaggio manuale, né da terminale né da telefono.

### Deploy manuale (alternativa)

```bash
npx -y firebase-tools@latest login
npx -y firebase-tools@latest deploy \
  --only hosting,firestore:rules,firestore:indexes \
  --project estetica-lacrisalide
```

Oppure genera un token come sopra e incollamelo in chat: lo uso una
tantum per fare il deploy da qui, poi va revocato da
https://myaccount.google.com/permissions (cerca "Firebase CLI").

Se in futuro cambi trattamenti/prezzi in `public/js/services-data.js`,
ricordati che l'elenco `allowed` dentro `isValidService()` in
`firestore.rules` deve restare sincronizzato: le regole rifiutano
qualunque nome di servizio non presente in quella lista.

## Sviluppo locale

```bash
npx -y firebase-tools@latest emulators:start --only hosting,auth,firestore
```

## Modello dati Firestore

- **`users/{uid}`** — profilo cliente (`displayName`, `email`, `phone?`,
  `createdAt`). Leggibile/scrivibile solo dal proprietario.
- **`bookings/{bookingId}`** — richieste di prenotazione (`uid`,
  `service`, `operator?`, `date`, `time`, `notes?`, `status`,
  `createdAt`). Ogni utente vede e crea solo le proprie prenotazioni;
  può solo annullarle (`richiesta` → `annullata`), non modificarle o
  cancellarle.

Le fasce orarie mostrate in prenotazione sono generate lato client da
`OPENING_HOURS`/`LUNCH_BREAK` in `services-data.js` in base alla durata
del trattamento scelto — non controllano se un altro cliente ha già
preso lo stesso orario (le regole attuali non permettono a un utente di
leggere le prenotazioni altrui). È una richiesta, non una prenotazione
già confermata: lo stato resta `richiesta` finché il centro non la
conferma manualmente. Se vuoi bloccare davvero gli orari già occupati
in tempo reale, serve una Cloud Function che tenga un'aggregazione
pubblica di disponibilità — fammelo sapere se ti interessa.

## Sicurezza

`firestore.rules` implementa un modello **deny-by-default**: ogni
collezione è ad accesso esclusivo del proprietario autenticato, con
validazione dei campi, dei tipi e delle dimensioni su create/update.
Sono regole prototipali pensate per essere sicure per l'uso attuale del
sito (nessun ruolo staff/admin è ancora implementato); prima di un
lancio su larga scala, rivedile e — se in futuro aggiungi un pannello
per lo staff (conferma prenotazioni, ecc.) — fammi sapere: andranno
estese con un vero controllo dei ruoli.

## Personalizzazione contenuti — cosa manca ancora

Questi punti sono segnaposto espliciti, da sostituire con i dati reali:

- **Staff**: `public/js/services-data.js` → array `STAFF` (nomi reali
  per la selezione operatrice in prenotazione) e le due card in
  `public/index.html` (sezione `#staff`, foto/nomi/ruoli reali al
  posto di "Titolare"/"Estetista").
- **Prezzi e durate**: `public/js/services-data.js` → `SERVICE_CATEGORIES`
  (bozza attuale, va confermata). Se cambi i *nomi* dei trattamenti,
  aggiorna anche `firestore.rules` (vedi sopra).
- **WhatsApp**: sostituisci `390000000000` nei link `wa.me/...` in
  `public/index.html` (3 punti: form prenotazione, box "non sei
  loggata", sezione contatti) con il numero reale in formato
  internazionale senza `+` né spazi.
- **Recensioni Google**: il link "Vedi le recensioni su Google" nella
  sezione recensioni punta a `#` — sostituiscilo con l'URL della tua
  scheda Google Business Profile. Non ho inserito testimonianze finte:
  quando avrai recensioni vere da mostrare in pagina, mandamele e le
  aggiungo.
- **Indirizzo/telefono/email/orari**: sezione contatti in
  `public/index.html`, più il link "Apri in Google Maps" (`#` al
  momento).
- **Conferma automatica prenotazioni** (email/WhatsApp al cliente e al
  centro): non ancora implementata. Richiede o Cloud Functions (piano
  Firebase Blaze, a consumo) o un servizio terzo (es. EmailJS) — da
  decidere insieme prima di attivarla, per via dei costi/permessi che
  comporta.
