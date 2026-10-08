# Deploy pe Cloudflare

Repository-ul este pregătit pentru un frontend static, API PHP 8.3 într-un Cloudflare Container, comenzi persistente în D1 și notificări prin Cloudflare Email Service.

## Înainte de deploy

- Ai nevoie de un cont Cloudflare și de planul **Workers Paid** pentru Containers. Containers nu rulează pe planul Free.
- Instalează Node.js 22 sau mai nou și autentifică Wrangler în contul tău Cloudflare.
- Instalează și pornește Docker Desktop. Wrangler construiește imaginea PHP prin Docker la deploy; `wrangler dev` folosește Docker și pentru testarea locală a containerului.
- Adaugă domeniul în Cloudflare DNS și schimbă nameserverele la registrar când ești gata. `.ro` nu apare în lista curentă de extensii suportate de Cloudflare Registrar; cumpără domeniul `.ro` de la un registrar care îl oferă și folosește Cloudflare pentru DNS.
- Dacă domeniul primește deja emailuri, păstrează și verifică înregistrările MX/SPF/DKIM/DMARC existente când Cloudflare importă zona DNS.

## Configurare inițială

1. Instalează dependențele din rădăcina repository-ului:

   ```powershell
   npm install
   ```

2. Creează baza de date D1:

   ```powershell
   npx wrangler login
   npm run cf:db:create
   ```

   Copiază `database_id` din răspuns și înlocuiește `REPLACE_WITH_D1_DATABASE_ID` în `wrangler.jsonc`.

3. Creează două secrete. Parola adminului trebuie să aibă minimum 16 caractere, iar cheia de sesiune minimum 32. Nu le adăuga în repository:

   ```powershell
   npx wrangler secret put TIMBER_ADMIN_PASSWORD
   npx wrangler secret put TIMBER_ADMIN_SESSION_KEY
   ```

   Pentru cheia de sesiune poți genera local un șir aleator cu Node:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
   ```

4. În Cloudflare Email Service, fă onboarding pentru domeniul expeditorului și confirmă înregistrările DNS. Configurația permite trimiterea de la `comenzi@timberspecialist.ro` către `contact@timberspecialist.ro`. Dacă vei folosi alt domeniu, actualizează bindingul `send_email` și variabilele `MAIL_FROM`/`MAIL_TO` din `wrangler.jsonc`.

5. Aplică schema D1 și construiește/deployează Worker-ul:

   ```powershell
   npm run cf:db:migrate:remote
   npm run deploy
   ```

6. În Cloudflare, leagă domeniul la Worker din **Workers & Pages → timberspecialist → Settings → Domains & Routes**. Activează o regulă Cloudflare de limitare pentru încercările repetate către `/admin-auth.php` și pentru spam pe `/sendmail.php`.

## Dezvoltare locală

Pentru autentificare locală, copiază `.dev.vars.example` în `.dev.vars` și înlocuiește valorile demonstrative cu secrete generate local. Fișierul `.dev.vars` este ignorat de Git.

```powershell
npm run cf:db:migrate:local
npm run dev
```

`npm run dev` pornește Wrangler și containerul PHP prin Docker. Wrangler folosește o bază D1 locală simulată și bindinguri locale pentru email; comenzile create aici nu apar în D1 de producție. Bindingurile remote pentru email nu sunt activate implicit.

Un server PHP simplu, pornit în afara Wrangler, funcționează în modul local obișnuit: comenzile se stochează în `data/orders.json`, iar notificarea folosește `mail()` din PHP. Un preview static, precum Live Server, servește numai HTML/CSS/JavaScript și nu poate procesa endpoint-urile PHP.

Panoul admin încarcă comenzile la deschidere, apoi interoghează API-ul la fiecare 30 de secunde. În implementarea actuală, salvarea modifică lista completă în D1. Evită editările simultane din mai multe sesiuni admin până când API-ul este schimbat să salveze fiecare comandă separat.

## Ce se întâmplă la deploy

- `npm run build` copiază doar HTML-ul, CSS-ul, JavaScript-ul, imaginile și fișierele publice de indexare în `dist/`. Nu publică sursele PHP, `.git`, fișierele locale sau `data/orders.json`.
- Worker-ul servește fișierele publice și rutează numai `sendmail.php` și `orders_api.php` către container. `admin-auth.php` este gestionat în Worker, cu sesiuni semnate și cookie `HttpOnly`/`SameSite=Strict`.
- PHP-ul folosește un bridge intern către Worker pentru accesul la D1 și Email Service. Containerul nu are acces direct la internet, iar fișierele lui sunt temporare; comenzile nu sunt ținute pe acel disc.
- Baza nouă pornește goală. `data/orders.json` local nu este importat, evitând publicarea comenzilor demonstrative sau a datelor personale existente local.

## Cost și limite practice

Workers Paid este necesar pentru Container; Cloudflare publică un tarif de bază de 5 USD/lună pentru Workers Paid și include cote pentru compute/container, cu taxare suplimentară dacă sunt depășite. Consultă [prețurile curente pentru Containers](https://developers.cloudflare.com/containers/platform/pricing/) înainte de activarea planului.
