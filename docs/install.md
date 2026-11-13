# Telepítési és üzemeltetési útmutató

Ez az útmutató egy tiszta gépről indulva vezet el a futó licenckezelőig (NFR-OPS-1). A célkörnyezet egy
helyi gépen futó Docker Compose-környezet (SPEC §13.4).

## 1. Előfeltételek

| Eszköz | Verzió | Mihez kell |
|---|---|---|
| Docker Engine / Docker Desktop, Compose v2-vel | 24+ (tesztelve: 29.8.1, Compose 5.5.1) | a szolgáltatások futtatása |
| Git | bármelyik | a tároló klónozása |
| Node.js | 22+ (tesztelve: 24.21.0) | csak a helyi fejlesztéshez és a parancssoros eszközökhöz |
| pnpm | 12 (`corepack enable` segítségével) | csak a helyi fejlesztéshez és a parancssoros eszközökhöz |

Szabad portok: `3000` (alkalmazás) és `5432` (PostgreSQL). Mindkettő módosítható a `.env` fájlban
(`APP_PORT`, `POSTGRES_PORT`).

## 2. Konfiguráció

```bash
git clone <repository-url> szakdolgozat
cd szakdolgozat
cp .env.example .env
```

Szerkeszd a `.env` fájlt:

| Változó | Mit kell beállítani |
|---|---|
| `POSTGRES_PASSWORD` | tetszőleges jelszó; ugyanezt az értéket írd a `DATABASE_URL` és a `TEST_DATABASE_URL` értékébe is |
| `BETTER_AUTH_SECRET` | véletlenszerű titok, pl. `openssl rand -base64 32` (kötelező: nélküle a Compose nem indul el) |
| `BETTER_AUTH_URL`, `APP_URL` | az URL, amelyet a felhasználók megnyitnak; alapértelmezés: `http://localhost:3000` |
| `APP_PORT`, `POSTGRES_PORT` | csak akkor, ha a 3000-es vagy az 5432-es port foglalt |

A `.env` fájlt a git figyelmen kívül hagyja. A `.env.example` csak helyőrzőket tartalmaz (NFR-SEC-4).

## 3. A szolgáltatások indítása

```bash
docker compose up -d --build                # db, app, worker
docker compose exec app pnpm db:mig         # a Drizzle-migrációk futtatása
docker compose exec app pnpm db:seed        # bemutató kezdeti adatok (idempotens: nyugodtan újrafuttatható)
docker compose ps                           # az app állapota legyen healthy
```

Nyisd meg a <http://localhost:3000> címet, és jelentkezz be a [README](../README.md) fájlban felsorolt
bemutatófiókok egyikével.

Szolgáltatások:

| Szolgáltatás | Image | Szerep |
|---|---|---|
| `db` | `postgres:17-alpine` | adatok; kötet: `db-data`; első induláskor a `licenckezelo_test` adatbázist is létrehozza |
| `app` | `licenckezelo:latest` (a `Dockerfile` alapján épül) | Next.js éles (production) szerver a 3000-es porton |
| `worker` | ugyanaz az image, `pnpm worker` | HR-események újrapróbálása 5 másodpercenként, licenclejáratok átvezetése és egyeztetés 60 másodpercenként |

## 4. Parancssoros eszközök (nem kötelező)

A kezdeti adatok (seed) betöltése egy HR API-kulcsot és klienstokeneket is kiír a `tools/.env.local`
fájlba (a `tools` mappa fel van csatolva az `app` konténerbe). A gazdagépen:

```bash
corepack enable
pnpm install
pnpm demo-client check ide-pro
pnpm hr-sim scenario list
```

A szervert a `tools/.env.local` fájl `LM_BASE_URL` változója választja ki (alapértelmezés:
`http://localhost:3000`).

## 5. Helyi fejlesztés az `app` konténer nélkül

```bash
pnpm install
pnpm db:up            # csak a PostgreSQL
pnpm db:mig
pnpm db:seed
pnpm dev              # http://localhost:3000
pnpm worker           # egy második terminálban
```

Ha az `app` konténer foglalja a 3000-es portot, előbb állítsd le: `docker compose stop app worker`.

## 6. Tesztek

```bash
pnpm test:unit                 # nem kell hozzá adatbázis
pnpm test:integration          # kell hozzá a db konténer; a TEST_DATABASE_URL-t használja, és újra létrehozza a sémáját
pnpm test:e2e                  # buildeli az alkalmazást, és a :3100-as porton, a tesztadatbázissal indítja el
pnpm exec playwright install chromium   # egyszer, az első E2E-futtatás előtt
```

Az integrációs és az E2E-tesztkészlet is alaphelyzetbe állítja a **tesztadatbázist**; a
`TEST_DATABASE_URL` soha ne mutasson valódi adatokra (az előkészítő lépés meg is tagadja a futást, ha
megegyezik a `DATABASE_URL` értékével).

## 7. Naplók

Minden komponens JSON-sorokat naplóz (NFR-OPS-3), ahol van értelme, `eventId` / `companyId` mezővel:

```bash
docker compose logs -f app       # kérések, hr_event.*, license.check, pool.recomputed
docker compose logs -f worker    # worker.events, worker.licenses_expired, worker.reconcile_drift
```

Részletesebb naplózáshoz állítsd be a `.env` fájlban a `LOG_LEVEL=debug` értéket (majd futtasd a
`docker compose up -d` parancsot).

## 8. Mentés és visszaállítás

```bash
# mentés (a pg_dump custom formátumában)
docker compose exec -T db pg_dump -U licenckezelo -d licenckezelo -Fc > backup.dump

# visszaállítás üres adatbázisba
docker compose exec -T db dropdb -U licenckezelo --if-exists licenckezelo
docker compose exec -T db createdb -U licenckezelo licenckezelo
docker compose exec -T db pg_restore -U licenckezelo -d licenckezelo --no-owner < backup.dump
docker compose restart app worker
```

Ha módosítottad a `POSTGRES_USER` / `POSTGRES_DB` értékét, a parancsokban a saját értékeidet használd.

## 9. Frissítés

```bash
git pull
docker compose up -d --build
docker compose exec app pnpm db:mig
```

A séma csak Drizzle-migrációkkal változik (NFR-OPS-2); a `db:mig` az új migrációkat futtatja le.

## 10. Hibaelhárítás

| Tünet | Ok és megoldás |
|---|---|
| `Set BETTER_AUTH_SECRET in .env` a Compose indításakor | a `.env` fájl hiányzik, vagy nincs benne `BETTER_AUTH_SECRET` (2. lépés) |
| az `app` `starting`/`unhealthy` állapotban marad | `docker compose logs app`; többnyire a `.env` fájlban megadott adatbázisjelszó eltér attól, amellyel a kötet létrejött – javítsd a `.env` fájlt, vagy állítsd alaphelyzetbe a kötetet a `docker compose down -v` paranccsal (ez minden adatot töröl) |
| `password authentication failed` a gazdagépen futtatott `pnpm db:*` parancsoknál | a `.env` fájlban a `DATABASE_URL` nem egyezik a `POSTGRES_PASSWORD` értékével |
| `port is already allocated` | módosítsd az `APP_PORT` vagy a `POSTGRES_PORT` értékét a `.env` fájlban, vagy állítsd le a portot foglaló másik szolgáltatást |
| a bejelentkezés „Túl sok próbálkozás” üzenetet ad | a Better Auth kéréskorlátozása (IP-címenként percenként 10 bejelentkezés); várj egy percet |
| a HR-események `pending` állapotban maradnak | nem fut a worker: `docker compose ps worker` |
| kilépés után is sikeres a licencellenőrzés | nézd meg az eseményt a *HR-események* oldalon; a `failed` eseményeknél látszik a hiba, és a feldolgozás újraindítható |
| `TEST_DATABASE_URL is not set` a teszteknél | add hozzá a `.env` fájlhoz (lásd `.env.example`); az adatbázist a `docker/postgres/10-create-test-db.sql` csak egy új kötet **első** indulásakor hozza létre – régebbi kötetnél hozd létre kézzel: `docker compose exec db createdb -U licenckezelo licenckezelo_test` |

## 11. Teljes eltávolítás

```bash
docker compose down -v      # leállítja a szolgáltatásokat, és törli az adatbázis kötetét
docker image rm licenckezelo:latest
```
