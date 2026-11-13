# Tesztjegyzőkönyv

A specifikáció 10.4. pontja szerinti jegyzőkönyv. A rögzített forgatókönyveket (S1–S15) a specifikáció
10.2. pontja írja le, a követelmények és a tesztek megfeleltetése a [traceability.md](traceability.md)
fájlban található. A végén a nyitott hibák és korlátok szerepelnek.

## Futtatási környezet

| | |
|---|---|
| Verzió | v0.9.0 |
| Időpont | 2026. november 13. |
| Operációs rendszer | Windows 11 Pro (x64) |
| Node.js / pnpm | 24.21.0 / 12.8.1 |
| PostgreSQL | 17.11 (`postgres:17-alpine` Docker-konténerben) |
| Docker | Docker Desktop, Engine 29.9.3, Compose 5.7.0 |
| Alkalmazás | Next.js 16.4.3, React 19.3.0, Drizzle ORM 0.45.4, Better Auth 1.7.7 |
| Teszteszközök | Vitest 5.0.5, fast-check 4.10.2, Playwright 1.64.1 (Chromium) |

Parancsok: `pnpm test:unit`, `pnpm test:integration`, `pnpm test:e2e`, `pnpm latency --rounds 30`,
`pnpm load-test --clients 20 --duration 15s`. A Vitest az eredményeket a konzolra írja, a Playwright
HTML-riportot készít a `playwright-report/` mappába (ez nincs verziókezelve, minden futtatáskor újra
létrejön).

## Összesítés

| Szint | Eszköz | Fájlok | Tesztek | Sikeres | Sikertelen |
|---|---|---|---|---|---|
| Egységteszt | Vitest (`tests/unit`) | 7 | 77 | 77 | 0 |
| Integrációs teszt | Vitest + PostgreSQL (`tests/integration`) | 7 | 41 | 41 | 0 |
| Végponttól végpontig (E2E) | Playwright (`e2e`), éles build a 3100-as porton | 4 | 8 | 8 | 0 |
| Forgatókönyvek | HR-szimulátor és demó kliens a futó alkalmazáson | – | S2, S3, S5, S6, S7, S11, S13, S14, S15 | mind | 0 |
| Teljesítmény | `tools/demo-client/latency.ts`, `load.ts` | – | 2 | 2 | 0 |

Tulajdonságalapú tesztek: a `planPool` 6 tulajdonsága egyenként 100 véletlen kerettel, valamint 25 véletlen
eseménysorozat a PostgreSQL-en, amely azt ellenőrzi, hogy a teljes újraszámolás ugyanazt az állapotot adja,
mint a lépésenkénti feldolgozás.

Az integrációs és az E2E tesztek a `licenckezelo_test` adatbázist használják, amelyet a futtatás elején
újraépítenek. Az E2E tesztek egy külön munkapéldányban futottak, hogy a build ne írja felül a fejlesztői
gépen futó alkalmazás buildjét.

## Forgatókönyvek

| ID | Előfeltétel és adatok | Lépések | Elvárt eredmény | Tényleges eredmény | Eredmény | Bizonyíték |
|---|---|---|---|---|---|---|
| S1 | 5 helyes licenc, szabály: developer → termék | 3 fejlesztő belép; fiókok összekapcsolása; ellenőrzés | 3 kiosztott, 2 szabad hely; minden ellenőrzés engedélyezett | az elvártnak megfelelő | sikeres | `int/scenarios.test.ts` S1 |
| S2 | 20 hely, 20 fejlesztő kapott helyet | belép a 21.; ellenőrzés a 21. nevében | a 21. várakozik az 1. helyen; `WAITLISTED`, 1 | az elvártnak megfelelő | sikeres | int S2; `pnpm hr-sim scenario s2` |
| S3 | S2 | kilép az 5. fejlesztő | az 5. helye visszavonva `EMPLOYEE_TERMINATED` okkal, a 21. megkapja `SEAT_FREED` okkal, ugyanabban az eseményben; az 5. ellenőrzése elutasított, a 21.-é engedélyezett | az elvártnak megfelelő | sikeres | int S3; `s3` |
| S4 | 20-ból 19 hely foglalt | két belépés eltárolva, párhuzamos feldolgozás; 100 ismétlés | minden futásban 20 kiosztott és 1 várakozó, soha nem több | az elvártnak megfelelő (100/100) | sikeres | `int/concurrency.test.ts`; a keret sorának zárolása nélkül a teszt elbukik |
| S5 | 5 hely | ugyanaz az esemény kétszer | a második `duplicate`; állapot, helyek, auditnapló változatlan | az elvártnak megfelelő | sikeres | int S5; `s5` |
| S6 | – | belépés T1, kilépés T3, késve érkező belépés T2 | a késői esemény `stale`, a munkavállaló kilépett, helye nincs | az elvártnak megfelelő | sikeres | int S6; `s6` (`status: stale`) |
| S7 | szabályok: developer → IDE Pro, accountant → Office Suite; az IDE Pro tele, 1 várakozó | fejlesztőből könyvelő | az IDE Pro hely visszavonva `ROLE_NO_LONGER_ELIGIBLE` okkal és továbbadva a várakozónak; Office Suite hely kiosztva | az elvártnak megfelelő | sikeres | int S7; `s7` |
| S8 | 2 hely, 3 fejlesztő | a szabály törlése | minden hely visszavonva, a várólista megszűnik, `RULE_REMOVED`; ellenőrzés `NOT_ELIGIBLE` | az elvártnak megfelelő | sikeres | int S8 |
| S9 | 2 × 10 helyes licenc, 20 kiosztott hely | az egyik licenc lejár | a 10 legutóbb kiosztott azonnal `NO_VALID_LICENSE`; a worker az eredeti `eligibleSince` értékkel visszateszi őket a várólistára | az elvártnak megfelelő; a worker második futása nem változtat | sikeres | int S9 |
| S10 | A és B cég | A felhasználója és kulcsa B adataival | B oldalai 404 (nincs tagság), az események csak A-ra hatnak, az ellenőrzés elutasít | az elvártnak megfelelő (lásd 1. nyitott hiba) | sikeres | `int/isolation.test.ts` |
| S11 | S3 | hibainjektálás a kiosztás után, majd újrapróbálás | `failed`, az állapot és az auditnapló változatlan; újrapróbálás után az S3 eredménye, 2 próbálkozás | az elvártnak megfelelő | sikeres | int S11; `HR_FAULT_INJECTION=1` + `s11` |
| S12 | kezdeti adatok, Kiss Anna (E-1001) | 30 × kilépés, majd ellenőrzés az első elutasításig | p95 ≤ 2 s | p50 36,4 ms, p95 52,0 ms, max. 53,0 ms | sikeres | [`results/latency-2026-11-13.json`](results/latency-2026-11-13.json) |
| S13 | adminisztrátor, aki nem munkavállaló | IDE Pro ellenőrzése | `NOT_LINKED` | az elvártnak megfelelő | sikeres | int S13; `pnpm demo-client check ide-pro --admin` |
| S14 | – | ugyanaz az eseményazonosító más munkakörrel | `409 EVENT_ID_CONFLICT`, semmi sem változik | az elvártnak megfelelő | sikeres | int S14; `s14` |
| S15 | – | hiányzó `hrId`, rossz `occurredAt`, ismeretlen `type`, 17 kB-os törzs | `400`, semmi sem tárolódik | 4 × 400, a `hr_events` sorainak száma nem változott | sikeres | `unit/hr-events`; `s15` |

## Teljesítmény

| Követelmény | Környezet | Eredmény | Cél | Értékelés |
|---|---|---|---|---|
| NFR-PERF-1 visszavonási késleltetés (S12) | éles build (`next start`), PostgreSQL Dockerben; 30 kör, 10 ms-onkénti lekérdezés; a késleltetés a kilépés `202` válaszától az első elutasított ellenőrzésig tart | p50 36,4 ms, p95 52,0 ms, max. 53,0 ms, átlag 39,5 ms | p95 ≤ 2000 ms | teljesül |
| NFR-PERF-2 ellenőrző végpont terhelés alatt | ugyanaz, 20 párhuzamos kliens, 15 s, termék: `ide-pro` | 5056 kérés, 336,6 kérés/s, 0 hiba; p50 53 ms, p95 102 ms, max. 181 ms | p95 ≤ 200 ms | teljesül |

Nyers adatok: [`results/latency-2026-11-13.json`](results/latency-2026-11-13.json),
[`results/load-2026-11-13.json`](results/load-2026-11-13.json). A kliens, az alkalmazás és az adatbázis
ugyanazon a laptopon futott, ezért a számok valódi hálózati késleltetést nem tartalmaznak.

## Kézi ellenőrzések

| Terület | Mit ellenőriztem | Eredmény |
|---|---|---|
| HTTP API (SPEC 7.1–7.3) | `curl` és HR-szimulátor: 401 kulcs nélkül, 400 hibás JSON-ra, 202 elfogadva, 200 ismétlés, 409 ütközés, 400 sémahibák angol üzenettel, 400 16 kB fölött, 7.2 állapot 200/404, ellenőrzés 401/404/200 | sikeres: minden kérés a felsorolt állapotkódot kapta, a sémahibák angol üzenettel érkeztek |
| Katalógus kezelése (ADM-1/2) | termék létrehozása, publikálás, csomag hozzáadása (0 helyszámot a böngésző és a zod is elutasítja), inaktiválás | sikeres: a termék és a csomag létrejött és publikálható volt, a 0 helyszámot a böngésző és a zod is elutasította, az inaktiválás működött |
| Vásárlás (ORD-1/2) | a kulcs egyszer látszik; ismeretlen és már felhasznált kulcsra külön üzenet; kisbetűs, szóközös bevitel elfogadva | sikeres: a kulcs csak egyszer látszott, az ismeretlen és a felhasznált kulcsra külön üzenet jelent meg, a kisbetűs, szóközös kulcsot elfogadta |
| Vásárlási oldal 1280 px-en | az összegző kártya ára nem lóg ki; a megjegyzés oszlop legalább 16 rem széles az összes érintett oldalon (1280, 1366, 1440, 1536 és 1920 px) | sikeres: mind az öt szélességen a kártyán belül maradt az ár, a megjegyzés oszlop legalább 16 rem széles volt |
| Szabályok (RULE-1/3) | licenc nélküli szoftverre létrehozott szabály figyelmeztet, a jogosultak várólistára kerülnek, a kulcs aktiválása után helyet kapnak | sikeres: a felület figyelmeztetett, a jogosultak várólistára kerültek, az aktiválás után helyet kaptak (a dolgozat 5.5. és 5.4. ábrája) |
| Worker | a függőben lévő esemény 5 s-on belül feldolgozódik; lejárt licenc után minden hely visszakerül a várólistára, egy `license.expired` bejegyzéssel | sikeres: az esemény 5 s-on belül feldolgozódott, a lejárat után minden hely visszakerült a várólistára, `license.expired` bejegyzéssel |
| Kezdeti adatok (seed) | második futtatásra semmit nem hoz létre, a tokenek megmaradnak | sikeres: a második futtatás nem hozott létre új rekordot, a tokenek megmaradtak |
| Oldalak | minden vezérlőpult-, céges és adminoldal betölt munkamenettel (HTTP 200, elvárt tartalom); képernyőképek a dolgozat 5. fejezetében | sikeres: minden oldal HTTP 200-zal és az elvárt tartalommal töltött be |
| Docker | `docker compose up -d --build`, `db:mig` és `db:seed` a konténerben; az alkalmazás egészséges, a worker fut | a fejlesztői gépen sikeres |

## Nyitott hibák és korlátok

| # | Leírás | Hatás | Lehetséges megoldás |
|---|---|---|---|
| 1 | Más cég oldalain a 404-es oldal jelenik meg, de a HTTP-állapotkód 200: streamelt válasznál (Cache Components) az állapotkód a `notFound()` előtt elmegy. Az API-végpontok valódi 404-et adnak. | Adat nem szivárog ki, csak az állapotkód tér el a BR-15 szövegétől. | a tagság ellenőrzése a `proxy.ts`-ben |
| 2 | A meghívókat a rendszer nem küldi el e-mailben (COMP-4 „A”), a linket a meghívó látja. | Kézi lépés az adminisztrátornak. | levelezés (pl. Mailpit) |
| 3 | Az e-mail-címek nincsenek megerősítve (AUTH-5); a meghívót csak a meghívott címmel regisztrált fiók fogadhatja el. | Aki más címével regisztrál és megszerzi a linket, elfogadhatja a meghívót. | AUTH-5 |
| 4 | Ugyanannak a munkavállalónak két eseménye azonos `occurredAt` értékkel: a második elavult lesz. | A HR-rendszernek munkavállalónként szigorúan növekvő időpontokat kell küldenie. | dokumentálva (ADR-005) |
| 5 | Az érvénytelen tokennel (401) érkező ellenőrzések nem kerülnek a `license_checks` táblába. | A statisztika csak a hitelesített ellenőrzéseket számolja. | – |
| 6 | A Better Auth kéréskorlátja és a katalógus gyorsítótára a folyamat memóriájában van. | Egy példánynál nem gond. | közös tároló több példány esetén |
| 7 | `next dev` alatt néhány ellenőrzés kb. 1,3 s; az éles buildben ez nem jelentkezik. | Csak fejlesztés közben. | – |
