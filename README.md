# iMag — Magazin online de electronice

iMag este un magazin online simplu, creat pentru a arăta cum funcționează împreună o interfață web, un server și o bază de date. Poți răsfoi produsele fără cont, îți poți crea un cont, poți adăuga produse în coș și poți înregistra o comandă. Comenzile tale rămân în baza de date și le poți vedea după autentificare.

Proiectul demonstrează un flux complet de cumpărare și organizarea clară a codului. Este un **MVP educațional**: nu încasează bani și nu livrează produse. Prețurile sunt exemple în lei.

## Tehnologii folosite

| Parte | Tehnologii |
| --- | --- |
| Interfață | React 19.3, Material UI 9, Vite 8 |
| Date și stare | TanStack React Query 5, Redux Toolkit 2, Axios |
| Formulare și limbi | React Hook Form, Yup, react-intl; română și engleză |
| Server | ASP.NET Core Web API / .NET 10, C#, JWT, PasswordHasher |
| Bază de date | PostgreSQL 18.6 în Docker, Entity Framework Core 10 și Npgsql |
| Verificări | xUnit cu PostgreSQL real, Vitest/Testing Library, Playwright |

Versiunile exacte sunt fixate în fișierele de proiect și în lockfile-uri. Au fost verificate în registrele oficiale npm/NuGet la crearea proiectului. Referințe: [versiuni React](https://react.dev/versions), [.NET 10](https://dotnet.microsoft.com/en-us/download/dotnet/10.0), [versiuni PostgreSQL](https://www.postgresql.org/support/versioning/).

## Ce găsești în proiect

- `Backend/iMag.Api`: Controllers, Services, Repositories, DTOs, Models, Data și Migrations.
- `Backend/iMag.Tests`: teste de integrare.
- `Frontend/src`: pagini, componente, formulare, traduceri și stare.
- `Frontend/e2e`: testul automat al fluxului complet din browser.
- `docker-compose.yml`: pornește PostgreSQL cu un volum persistent.
- `docs/ARCHITECTURE.md`: explicații despre structură și deciziile importante.

La prima pornire, backend-ul aplică migrarea și adaugă trei categorii: **Telefoane**, **Laptopuri**, **Accesorii**. Sunt incluse iPhone 17, Samsung Galaxy S25, MacBook Pro M4, ASUS Zenbook 14, AirPods Pro și Logitech MX Master 3S. Repornirea nu dublează produsele.

## 1. Pregătește PC-ul

Instalează:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) și pornește-l. Pe Windows folosește containere Linux.
- [.NET 10 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/10.0), nu doar Runtime.
- [Node.js 24 LTS](https://nodejs.org/en/download), care include npm.
- Opțional, [Git](https://git-scm.com/downloads).

După instalare, deschide o fereastră nouă de PowerShell. Poți verifica instalarea cu `docker --version`, `dotnet --version` și `node --version`.

## 2. Descarcă proiectul

Varianta simplă: pe [pagina repository-ului](https://github.com/dbodoga/iMag), apasă **Code → Download ZIP**, apoi extrage arhiva. Deschide folderul extras în care vezi `Backend`, `Frontend` și `docker-compose.yml`. Din acel folder deschide PowerShell / Terminal.

Dacă folosești Git:

```powershell
git clone https://github.com/dbodoga/iMag.git
cd iMag
```

Toate comenzile de mai jos pleacă din acest folder principal, dacă nu se precizează altceva.

## 3. Pornește baza de date

Cu Docker Desktop pornit:

```powershell
docker compose up -d --wait
```

Prima pornire descarcă PostgreSQL și poate dura câteva minute. Verifică apoi:

```powershell
docker compose ps
```

Serviciul `db` trebuie să fie **healthy**. Conexiunea locală folosește host `localhost`, port `5433`, baza `imag`, utilizator `imag`, parola de dezvoltare `imag_local_dev`. Configurația implicită funcționează fără copierea fișierului .env.

## 4. Pornește backend-ul

În folderul principal:

```powershell
dotnet run --project Backend/iMag.Api
```

La prima pornire sunt descărcate pachetele, sunt create tabelele și sunt inserate produsele. Când vezi mesajul **Now listening on: http://localhost:5188**, API-ul este pregătit. Lasă terminalul deschis.

- [Swagger](http://localhost:5188/swagger)
- [Starea serverului](http://localhost:5188/health)

Nu trebuie să creezi manual tabele sau utilizatori. În modul Development este generată automat o cheie JWT temporară, care nu este salvată în repository.

## 5. Pornește frontend-ul

Deschide **un al doilea terminal** în folderul principal:

```powershell
cd Frontend
npm ci
npm run dev
```

Deschide [iMag în browser](http://localhost:5189). Lasă și acest terminal deschis. La următoarele porniri este suficient `npm run dev`; `npm ci` este necesar inițial și când se schimbă dependențele.

## 6. Testează magazinul

1. Deschide catalogul fără cont. Filtrează categoriile și caută un produs.
2. Apasă **EN** pentru engleză și **RO** pentru română. Se schimbă și mesajele formularelor, descrierile, datele și afișarea sumelor. Moneda rămâne RON.
3. Adaugă unul sau mai multe produse în coș.
4. Deschide coșul din dreapta sus. Modifică numărul de bucăți cu **+ / −** sau elimină un produs.
5. Apasă **Autentifică-te pentru a comanda**, apoi **Creează cont**.
6. Completează numele, un email și o parolă între 10 și 128 de caractere. După creare ești autentificat automat și revii la coș.
7. Apasă **Plasează comanda**. Vei ajunge la **Comenzile mele**, cu mesaj de confirmare, produse, cantități și total.
8. Apasă **Ieșire**, apoi autentifică-te din nou. Istoricul se păstrează.
9. Poți crea un al doilea cont ca să verifici că nu vede comenzile primului.

Tokenul și coșul sunt păstrate doar în memoria paginii. **La reîncărcare trebuie să te autentifici din nou**, iar coșul se golește. Comenzile înregistrate rămân în PostgreSQL. Sesiunea expiră după o oră; repornirea backend-ului invalidează tokenurile vechi.

## 7. Testează API-ul în Swagger

Accesează [Swagger](http://localhost:5188/swagger). Pentru fiecare operație: deschide rândul, apasă **Try it out**, completează datele dacă sunt cerute și apasă **Execute**. Codul răspunsului apare sub formular.

### Catalog fără cont

- `GET /api/categories` → 200, lista categoriilor.
- `GET /api/products` → 200, lista produselor. Introdu `1` în `categoryId` pentru telefoane.
- `GET /api/orders` fără autentificare → 401.

### Creează un cont și autentifică Swagger

La `POST /api/auth/register`, înlocuiește exemplul generat cu:

```json
{
  "name": "Ana Test",
  "email": "ana@example.test",
  "password": "ParolaMeaDeTest123!"
}
```

Răspunsul 201 conține `token`, `expiresAt` și `user`. Copiază **doar valoarea tokenului**, fără ghilimele.

Apasă **Authorize** în partea de sus. Lipește tokenul în câmpul Bearer și confirmă. **Nu scrie prefixul Bearer**, deoarece Swagger îl adaugă automat.

Dacă ai deja contul, folosește `POST /api/auth/login` cu emailul și parola. Primești un token nou. Un email deja înregistrat răspunde cu 409, iar parola greșită la login cu 401.

### Plasează o comandă

La `POST /api/orders` folosește un ID de cerere nou și produsele din catalog:

```json
{
  "requestId": "fc7bd8eb-bb41-4d0b-a447-1c6be85b5bdd",
  "items": [
    { "productId": 1, "quantity": 1 },
    { "productId": 5, "quantity": 2 }
  ]
}
```

Răspunsul 201 conține comanda și totalul calculat de server. Nu trimiți prețuri sau UserId.

- `GET /api/orders`: istoricul contului curent, cu paginare.
- `GET /api/orders/{id}`: introdu ID-ul comenzii întors de POST.
- O cantitate 0 sau 100 este respinsă cu 400.
- Un produs inexistent respinge întreaga comandă.
- Aceeași cerere cu același `requestId` nu dublează comanda. Pentru **o comandă nouă**, generează alt ID în PowerShell cu `[guid]::NewGuid()`.
- Refolosirea aceluiași `requestId` cu alte produse/cantități este respinsă cu 409.

## 8. Teste automate

Cu PostgreSQL pornit, din folderul principal:

```powershell
dotnet test Backend/iMag.Tests
```

Testele creează o bază separată cu un nume aleatoriu `imag_test_...` și o șterg la final. Nu șterg baza magazinului. Pentru alt server PostgreSQL, setează variabila `IMAG_TEST_DB` cu o conexiune a cărei utilizator poate crea baze.

Testele frontend:

```powershell
cd Frontend
npm test
npm run build
```

Testul complet în Chromium, cu **backend-ul și PostgreSQL deja pornite**:

```powershell
npx playwright install chromium
npm run test:e2e
```

Playwright pornește frontend-ul automat. Testul creează un cont și o comandă de test în baza folosită de backend. Verifică limba, căutarea, contul, coșul, comanda, istoricul și afișarea pe mobil. Capturile locale se găsesc în `Frontend/test-results`.

## Oprire și pornire ulterioară

Oprește frontend-ul și backend-ul cu **Ctrl+C** în terminalele lor. Din folderul principal:

```powershell
docker compose stop
```

Datele rămân în volumul Docker. Pentru a reveni, repetă pașii de pornire. Evită `docker compose down -v` dacă vrei să păstrezi comenzile: acea comandă șterge volumul.

## Dacă apare o problemă

| Situație | Ce verifici |
| --- | --- |
| Docker nu răspunde | Pornește Docker Desktop și așteaptă să fie gata. |
| Backend-ul nu se conectează | Rulează `docker compose ps`; baza trebuie să fie healthy pe portul 5433. |
| „Address already in use” | Portul 5188 sau 5189 este ocupat. Oprește doar aplicația ta care îl folosește sau schimbă portul și configurația corespunzătoare. |
| Catalogul arată eroare de conexiune | Backend-ul trebuie să fie pornit pe 5188; frontend-ul folosește proxy-ul din `vite.config.js`. |
| 401 după repornire / după o oră | Autentifică-te din nou; în Swagger înlocuiește tokenul din Authorize. |
| 429 | Așteaptă un minut; login/register sunt limitate împotriva încercărilor repetate. |
| `npm` este blocat de PowerShell | Folosește `npm.cmd ci` și `npm.cmd run dev`, fără schimbarea politicii sistemului. |
| Ai schimbat parola PostgreSQL | Actualizează și conexiunea backend-ului. Parola containerului este inițializată numai când volumul este creat. |

Pentru modificarea schemei: `dotnet tool restore`, apoi `dotnet ef migrations add NumeMigrare --project Backend/iMag.Api` din folderul principal, cu mediul Development. Vezi [arhitectura](docs/ARCHITECTURE.md) pentru detalii și limitele MVP-ului.
