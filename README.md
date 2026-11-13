# Licenckezelő

Vállalati szoftverlicencek kezelése munkakörök alapján. A szoftverforgalmazó helyalapú licenceket értékesít cégeknek,
a cégeken belül pedig a helyeket nem kézzel osztják ki: a rendszer a szabályokból (melyik munkakörnek melyik szoftver
jár) és a munkavállalók adataiból (belépés, munkakörváltás, kilépés) automatikusan kiosztja és visszaveszi őket.

Technológiák: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, PostgreSQL 17, Drizzle ORM, Better Auth.

## Követelmények

- [Docker](https://www.docker.com/) (Docker Desktop, vagy Docker Engine a Compose bővítménnyel)

## Telepítés és indítás

```bash
git clone https://github.com/kbalint7/szakdolgozat.git
cd szakdolgozat
cp .env.example .env
docker compose up -d --build
docker compose exec app pnpm db:mig
docker compose exec app pnpm db:seed
```

Az alkalmazás ezután a <http://localhost:3000> címen érhető el. Az első indítás a build miatt néhány percig tart.

A `.env` alapértékeivel az alkalmazás helyben rögtön működik. Ha nem csak kipróbálásra használod, a
`BETTER_AUTH_SECRET` értékét cseréld le egy véletlen szövegre (például `openssl rand -base64 32`).

Leállítás:

```bash
docker compose down      # az adatok megmaradnak
docker compose down -v   # az adatbázis is törlődik
```

## Demó fiókok

A `db:seed` parancs bemutató adatokat hoz létre: két terméket csomagokkal, két céget, munkavállalókat, szabályokat és
licenceket.

| E-mail | Jelszó | Szerep |
| --- | --- | --- |
| `admin@licenckezelo.test` | `Admin1234` | platformadmin: termékek, csomagok, rendelések, statisztika |
| `tulajdonos@pelda.test` | `Demo1234` | a _Példa Kft._ tulajdonosa |
| `admin@pelda.test` | `Demo1234` | a _Példa Kft._ adminisztrátora |
| `anna.kiss@pelda.test` | `Demo1234` | a _Példa Kft._ tagja és munkavállalója, van IDE Pro helye |
| `tulajdonos@masik.test` | `Demo1234` | a _Másik Zrt._ tulajdonosa |

## Kipróbálás

1. Jelentkezz be a `tulajdonos@pelda.test` fiókkal, és nyisd meg a **Termékek** oldalt.
2. Válassz egy csomagot, és vásárold meg a cégnek (a fizetés szimulált). Vásárláskor a licencet rögtön aktiválhatod,
   vagy a kapott licenckulcsot később a cég **Licencek és helyek** oldalán.
3. A helyeket a rendszer a cég szabályai szerint azonnal kiosztja. Ezt a **Licencek és helyek**, a
   **Munkavállalók** és az **Auditnapló** oldalon követheted.

## API

| Végpont | Hitelesítés | Feladat |
| --- | --- | --- |
| `POST /api/v1/hr/events` | céges API-kulcs (`hr:events:write`) | HR-esemény: belépés, munkakörváltás, kilépés |
| `GET /api/v1/hr/events/{eventId}` | céges API-kulcs (`hr:events:read`) | egy esemény feldolgozási állapota |
| `POST /api/v1/hr/snapshot` | céges API-kulcs (`hr:events:write`) | a teljes aktív létszám; az eltérésekből események lesznek |
| `POST /api/v1/license/check` | személyes kliens token | használhatja-e a felhasználó a terméket |

```bash
curl -X POST http://localhost:3000/api/v1/license/check \
  -H "Authorization: Bearer $LM_CLIENT_TOKEN" -H 'Content-Type: application/json' \
  -d '{"product":"ide-pro"}'
```

API-kulcsot a cég **API-kulcsok** oldalán, kliens tokent a **Klienstokenek** oldalon lehet létrehozni.

## Mintaprogramok

A két mintaprogram (HR-szimulátor és demó kliens) csak a fenti API-n keresztül kommunikál, mint egy valódi HR-rendszer
és egy szoftvergyártói kliens. Futtatásukhoz Node.js és pnpm kell (lásd [Fejlesztés](#fejlesztés)), és egyszer a
`pnpm install`. A szükséges kulcsokat és tokeneket a `db:seed` írja a `tools/.env.local` fájlba (Dockerrel is).

```bash
pnpm demo-client check ide-pro                  # Kiss Anna egyszeri ellenőrzése: ENGEDÉLYEZVE
pnpm demo-client watch ide-pro --interval 1s    # ellenőrzés másodpercenként
pnpm hr-sim terminate E-1001                    # Anna kilép → a következő ellenőrzés ELUTASÍTVA
pnpm hr-sim hire E-1001 --role developer        # újra belép → ismét kap helyet, ha van szabad
pnpm hr-sim scenario list                       # előre megírt forgatókönyvek
pnpm latency --rounds 30                        # a visszavonás késleltetése (p50, p95, max)
pnpm load-test --clients 20 --duration 15s      # az ellenőrző végpont terhelés alatt
```

Az S11 forgatókönyvhöz (hiba feldolgozás közben) a szerveren `HR_FAULT_INJECTION=1` kell.

## Fejlesztés

Helyi fejlesztéshez Node.js 22 vagy újabb és pnpm kell (`corepack enable`). Az adatbázis ilyenkor is Dockerben fut:

```bash
cp .env.example .env
pnpm install
pnpm db:up
pnpm db:mig
pnpm db:seed
pnpm dev      # http://localhost:3000
pnpm worker   # külön terminálban: újrapróbálások, licenclejárat, egyeztetés
```

### Tesztek

```bash
pnpm test:unit          # az üzleti logika egységtesztjei, adatbázis nélkül
pnpm test:integration   # a szolgáltatások a licenckezelo_test adatbázison
pnpm test:e2e           # Playwright: buildeli és a 3100-as porton elindítja az alkalmazást
```

Az integrációs és az end-to-end tesztekhez fut a `db` konténer, és a `.env`-ben szerepel a `TEST_DATABASE_URL`. A
`licenckezelo_test` adatbázist a konténer az első indításkor létrehozza; ha az adatbázis-kötet ennél régebbi, előbb
`docker compose down -v`. Az end-to-end tesztekhez egyszer kell a böngésző is: `pnpm exec playwright install chromium`.

## Projektszerkezet

```
app/                 Next.js útvonalak: (public) katalógus, (auth) bejelentkezés és meghívók, dashboard, admin, /api/v1
components/          felületi komponensek (shadcn/ui: components/ui)
db/                  séma, adatbázis-kapcsolat, migráció, kezdeti adatok (seed)
drizzle/             SQL-migrációk
lib/domain/          tiszta üzleti szabályok: kiosztás, keret, sorrend, jogosultság, ellenőrzés, HR-események
lib/services/        tranzakciós szolgáltatások: keretek, HR-események, rendelések, szabályok, cégek, audit
lib/auth/, lib/api/  munkamenetek és céges jogosultság; API-kulcsok, klienstokenek, hibaformátum
worker/              háttérfolyamat
tools/               HR-szimulátor, demó kliens, késleltetés- és terhelésmérés
tests/unit, tests/integration, e2e/
docs/                specifikáció, telepítés, döntési rekordok, megfeleltetés, tesztjegyzőkönyv, MI-napló
```

## Dokumentáció

- [`docs/SPEC.md`](docs/SPEC.md): követelmények, üzleti szabályok, interfészek, használati esetek
- [`docs/install.md`](docs/install.md): telepítési és üzemeltetési útmutató, hibaelhárítás, mentés
- [`docs/adr/`](docs/adr): architekturális döntési rekordok
- [`docs/traceability.md`](docs/traceability.md): követelmény → megvalósítás → teszt
- [`docs/test-report.md`](docs/test-report.md): tesztfuttatás, forgatókönyvek, mérések, nyitott hibák
- [`docs/ai-log.md`](docs/ai-log.md): a mesterséges intelligenciával végzett munka naplója

## Állapot

A specifikáció kötelező és ajánlott követelményei megvalósultak; a nem megvalósított opcionális részeket és
a nyitott hibákat a [tesztjegyzőkönyv](docs/test-report.md#nyitott-hibák-és-korlátok) sorolja fel. Az utolsó
futtatáson (2026. november 13.) mind a 77 egységteszt, 41 integrációs teszt és 8 E2E teszt sikeres volt.
