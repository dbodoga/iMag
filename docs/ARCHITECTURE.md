# Arhitectura iMag

iMag este un monolit modular: un proces ASP.NET Core servește un API, iar o aplicație React separată consumă acel API. Structura urmează ghidul furnizat: separarea responsabilităților, dependency injection, ORM și migrații, DTO-uri, componente funcționale, validări, client HTTP centralizat și testare.

## Traseul unei cereri

Browser → Axios → Controller → Service → Repository → Entity Framework → PostgreSQL.

- **Controllers**: rute HTTP, validarea contractelor, autorizare și coduri de răspuns.
- **Services**: autentificare, mapare în DTO-uri și regulile comenzilor.
- **Repositories**: acces asincron la date. Citirile folosesc `AsNoTracking`.
- **DTOs**: contracte API explicite. Entitățile și hash-urile parolelor nu sunt returnate de controllere.
- **Data / Migrations**: relații, indecși, constrângeri, migrarea inițială și seed determinist.

## Date și relații

User 1 → N Order 1 → N OrderItem N → 1 Product N → 1 Category.

Câmpurile cerute folosesc nume englezești în cod: Name = Nume, PasswordHash = Parolă hashed, Price = Preț, OrderedAt = DataComenzii, Quantity = Cantitate.

Extensii mici pentru corectitudine:
- Category.NameEn și Product.DescriptionEn pentru catalog bilingv;
- OrderItem.UnitPrice și ProductName păstrează valorile din momentul comenzii;
- Order.RequestId împiedică dublarea aceleiași cereri în cazul retrimiterii;
- email unic normalizat, preț decimal(12,2), cantitate între 1 și 99, maximum 50 de produse distincte per comandă.

Comanda și toate liniile sunt salvate într-un singur `SaveChangesAsync`, într-o tranzacție EF Core. Prețul este citit exclusiv din baza de date. UserId vine exclusiv din JWT. Un utilizator nu poate consulta comenzile altuia; un ID de comandă străină răspunde cu 404.

## Autentificare

Parolele sunt procesate cu ASP.NET Core PasswordHasher (PBKDF2 cu salt individual). JWT are expirare, issuer, audience, semnătură HMAC SHA-256 și sub validat. Login/register au o limită de 20 cereri/minut per IP.

Tokenul și identitatea sunt păstrate în Redux Toolkit, doar în memorie. Reîncărcarea paginii necesită o nouă autentificare; deconectarea și expirarea șterg coșul și cache-ul comenzilor. Limba este singura preferință salvată în localStorage.

În Development se generează o cheie JWT aleatorie la pornire; repornirea API-ului invalidează tokenurile emise anterior. Nu există cont administrator implicit sau parolă comună pentru utilizatori.

## Frontend

- React funcțional cu rute separate și încărcare la cerere pentru autentificare, coș și istoric.
- Material UI pentru componente, stiluri responsive și stări de încărcare/eroare.
- TanStack Query pentru cereri, cache și invalidare după o comandă.
- Redux Toolkit pentru autentificare și coș.
- React Hook Form + Yup pentru formulare.
- react-intl pentru interfață, erori, date și monedă; toate sumele rămân în RON.
- Axios cu URL centralizat, timeout și interceptor de autentificare.
- Ilustrațiile produselor sunt desenate în CSS; nu sunt fotografii oficiale.

## Limitele MVP-ului

Fără procesare de plăți, livrare, stoc, roluri de administrator sau administrarea catalogului. Prețurile sunt exemple educaționale, nu oferte comerciale actuale. Catalogul mic este încărcat integral; istoricul este paginat.

Pentru publicare reală sunt necesare HTTPS, secrete gestionate extern, cheie JWT persistentă, configurație CORS/AllowedHosts corespunzătoare, migrații ca pas de deployment și o strategie completă de sesiuni/refresh. Parola PostgreSQL din configurația Development este exclusiv pentru utilizare locală, iar portul bazei de date este legat de 127.0.0.1.
