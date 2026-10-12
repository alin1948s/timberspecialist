# TIMBER SPECIALIST

Website de prezentare și comandă pentru lemn de foc paletizat, grinzi și podele din Gorun și Cer, produs în Someș-Odorhei, Sălaj.

## Capturi de pe site

Capturile arată varianta desktop (1440 px) și cea mobilă (390 px). Pentru calculator și formular, cadrul mobil este mai înalt, astfel încât să se vadă complet componentele importante.

### Acasă — prezentare

<p>
  <img src="screenshots/home-desktop.png" alt="Pagina principală pe desktop" width="760">
  <img src="screenshots/home-mobile.png" alt="Pagina principală pe mobil" width="225">
</p>

### Acasă — catalogul de produse

<p>
  <img src="screenshots/catalog-desktop.png" alt="Catalogul de produse pe desktop" width="760">
  <img src="screenshots/catalog-mobile.png" alt="Catalogul de produse pe mobil" width="225">
</p>

### Acasă — calculator de volum și preț

<p>
  <img src="screenshots/calculator-desktop.png" alt="Calculatorul pe desktop" width="760">
  <img src="screenshots/calculator-mobile.png" alt="Calculatorul pe mobil" width="225">
</p>

### Acasă — comandă rapidă

<p>
  <img src="screenshots/order-desktop.png" alt="Datele depozitului și formularul de comandă pe desktop" width="760">
  <img src="screenshots/order-mobile.png" alt="Formularul complet de comandă rapidă pe mobil" width="225">
</p>

### Debitări la comandă

<p>
  <img src="screenshots/services-desktop.png" alt="Pagina de servicii și debitări pe desktop" width="760">
  <img src="screenshots/services-mobile.png" alt="Pagina de servicii și debitări pe mobil" width="225">
</p>

### Stoc & Galerie

<p>
  <img src="screenshots/stock-desktop.png" alt="Stocul și galeria pe desktop" width="760">
  <img src="screenshots/stock-mobile.png" alt="Stocul și galeria pe mobil" width="225">
</p>

### Despre noi & companie

<p>
  <img src="screenshots/about-desktop.png" alt="Prezentarea companiei și datele fiscale pe desktop" width="760">
  <img src="screenshots/about-mobile.png" alt="Prezentarea companiei pe mobil" width="225">
</p>

### Despre noi & SUMAL 2.0

<p>
  <img src="screenshots/sumal-desktop.png" alt="Informațiile despre SUMAL 2.0 pe desktop" width="760">
  <img src="screenshots/sumal-mobile.png" alt="Informațiile despre SUMAL 2.0 pe mobil" width="225">
</p>

### Contact și formular

<p>
  <img src="screenshots/contact-desktop.png" alt="Datele de contact și formularul pe desktop" width="760">
  <img src="screenshots/contact-mobile.png" alt="Datele de contact și formularul pe mobil" width="225">
</p>

### Hartă și locația depozitului

<p>
  <img src="screenshots/map-desktop.png" alt="Harta depozitului cu pinul locației pe desktop" width="760">
  <img src="screenshots/map-mobile.png" alt="Harta depozitului cu pinul locației pe mobil" width="225">
</p>

### Panou administrativ

Capturile admin folosesc exclusiv comenzi demonstrative și date de contact fictive.

<p>
  <img src="screenshots/admin-desktop.png" alt="Panoul administrativ pe desktop, cu date demonstrative" width="760">
  <img src="screenshots/admin-mobile.png" alt="Panoul administrativ pe mobil, cu date demonstrative" width="225">
</p>

### Panou administrativ — carduri de comandă

<p>
  <img src="screenshots/admin-orders-desktop.png" alt="Carduri de comandă demonstrative în admin pe desktop" width="760">
  <img src="screenshots/admin-orders-mobile.png" alt="Card de comandă demonstrativ în admin pe mobil" width="225">
</p>

### Footer și navigare mobilă

<p>
  <img src="screenshots/footer-desktop.png" alt="Footer-ul site-ului pe desktop" width="760">
  <img src="screenshots/footer-mobile.png" alt="Footer-ul și bara fixă de navigare pe mobil" width="225">
</p>

`autorizatii.html` este o adresă veche care redirecționează către secțiunea SUMAL 2.0; capturile ei sunt incluse la „Despre noi & SUMAL 2.0”.

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

## Proveniența capturilor

Imaginile din `screenshots/` au fost regenerate din versiunea locală. În admin au fost folosite trei comenzi fictive printr-un răspuns API simulat; datele reale din fișierul local sau din D1 nu au fost accesate ori modificate.
