# TIMBER SPECIALIST

Website de prezentare și comandă pentru lemn de foc paletizat, grinzi și podele din Gorun și Cer, produs în Someș-Odorhei, Sălaj.

## Capturi de pe site

### Pagina principală

<p>
  <img src="screenshots/home-desktop.png" alt="Pagina principală pe desktop" width="760">
  <img src="screenshots/home-mobile.png" alt="Pagina principală pe mobil" width="225">
</p>

### Calculator de volum și preț

<p>
  <img src="screenshots/calculator-desktop.png" alt="Calculatorul pe desktop" width="760">
  <img src="screenshots/calculator-mobile.png" alt="Calculatorul pe mobil" width="225">
</p>

### Contact și comandă

<p>
  <img src="screenshots/contact-desktop.png" alt="Pagina de contact pe desktop" width="760">
  <img src="screenshots/contact-mobile.png" alt="Pagina de contact pe mobil" width="225">
</p>

### Formularul Comandă Rapidă Online

<p>
  <img src="screenshots/order-desktop.png" alt="Formularul de comandă rapidă pe desktop" width="760">
  <img src="screenshots/order-mobile.png" alt="Formularul și câmpul mărit de livrare pe mobil" width="225">
</p>

### Panou administrativ

Capturile de mai jos folosesc comenzi demonstrative cu date de contact fictive.

<p>
  <img src="screenshots/admin-desktop.png" alt="Panoul de administrare pe desktop, cu comenzi demonstrative" width="760">
  <img src="screenshots/admin-mobile.png" alt="Panoul de administrare pe mobil, cu carduri adaptate ecranului" width="225">
</p>

## Funcționalități

- „Stoc & Galerie” prezintă fotografiile și disponibilitatea depozitului; „Debitări la comandă” explică lucrările gaterului și pașii pentru ofertă.
- Calculatoare separate pentru paleți, grinzi și podele, cu estimări de volum și preț.
- Formulare de comandă, linkuri directe pentru telefon și WhatsApp, hartă și navigare către depozit.
- Panou intern pentru administrarea comenzilor, disponibil după autentificare.
- Interfață responsive pentru desktop și mobil.

## Tehnologii

HTML, CSS și JavaScript fără framework pentru interfață; PHP 8.3 pentru formular și API-ul comenzilor; Cloudflare Workers, Containers, D1 și Email Service pentru infrastructura de producție.

## Cum funcționează comenzile și stocarea

Locul în care sunt salvate comenzile depinde de modul de rulare:

| Mod | Stocare | Ce funcționează |
| --- | --- | --- |
| Preview static, de exemplu Live Server | Nu salvează comenzi | Afișează interfața; formularele și API-ul admin au nevoie de PHP și nu funcționează complet aici. |
| Server PHP local | `data/orders.json` pe calculator | Formularul și panoul admin folosesc endpoint-urile PHP locale. Fișierul este ignorat de Git. Notificarea prin email folosește `mail()` din PHP și depinde de configurarea locală a trimiterii de email. |
| `npm run dev` cu Wrangler și Docker | D1 locală simulată de Wrangler | Rulează Worker-ul și containerul PHP local; baza locală este separată de baza D1 din Cloudflare. |
| Site publicat pe Cloudflare | D1 din contul Cloudflare | Formularul salvează comenzile în D1, iar panoul admin le citește și salvează modificările tot acolo. Emailurile folosesc Cloudflare Email Service. |

Comenzile includ câmpul opțional `address` pentru adresa de livrare. Acesta se salvează în același fișier JSON local sau în obiectul `payload` din D1, se afișează în panoul admin și se include în exportul CSV. Structura D1 existentă nu necesită o migrare; comenzile vechi fără adresă rămân compatibile.

În panoul admin, lista se încarcă la deschiderea paginii și apoi se sincronizează automat la fiecare 30 de secunde. Modificările făcute în panou se salvează pe server. În implementarea actuală, salvarea trimite lista completă de comenzi; dacă două sesiuni admin modifică simultan lista, una poate suprascrie schimbările celeilalte. Până la trecerea la salvare per comandă, folosește o singură sesiune admin pentru modificări.

Datele din `data/orders.json` și baza locală Wrangler nu se copiază automat în D1 de producție. La prima publicare, baza D1 pornește goală.

## Rulare locală

### Preview static

Un server static poate afișa paginile pentru verificări vizuale, dar nu execută PHP. Pentru formulare și admin folosește unul dintre modurile PHP de mai jos.

### PHP local cu fișier JSON

Pornește serverul PHP din rădăcina repository-ului. Configurează o parolă locală de minimum 16 caractere înainte să deschizi panoul admin:

```powershell
$env:TIMBER_ADMIN_PASSWORD = "seteaza-o-parola-locala-de-minimum-16-caractere"
php -S 127.0.0.1:8039 -t .
```

Comenzile sunt stocate în `data/orders.json`, fișier exclus din Git. Trimiterea de email depinde de un mail transport configurat pentru PHP pe calculator.

### Wrangler local cu D1 simulată

Necesită Node.js 22+, Wrangler și Docker Desktop pornit. Copiază `.dev.vars.example` în `.dev.vars` și înlocuiește parolele demonstrative cu valori locale. Apoi rulează:

```powershell
npm install
npm run cf:db:migrate:local
npm run dev
```

Wrangler rulează site-ul, Worker-ul și containerul PHP; comenzile ajung în baza D1 locală simulată. Aceasta nu este baza din Cloudflare.

## Deploy Cloudflare

Configurația inițială, secretele necesare, baza D1, emailul, domeniul și comenzile de deploy sunt descrise în [ghidul Cloudflare](cloudflare/README.md).

## Capturile

Imaginile din `screenshots/` au fost capturate din versiunea locală a site-ului, la viewport-uri de desktop și mobil.
