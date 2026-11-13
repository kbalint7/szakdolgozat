# ADR-001: Monolitikus Next.js-alkalmazás külön worker folyamattal

- Állapot: elfogadva
- Dátum: 2026-10-12

## Kontextus

A rendszernek van felhasználói felülete (katalógus, cégek kezelése, platformadminisztráció), két nyilvános
HTTP API-ja (HR-események, licencellenőrzés), és vannak időszakosan futó feladatai (a sikertelen
HR-események újrapróbálása, a lejárt licencek átvezetése, a keretek egyeztetése). Egyetlen fejlesztő
készíti és üzemelteti, helyi Docker Compose-környezetben.

## Döntés

Egyetlen Next.js 16-alkalmazás szolgálja ki a felhasználói felületet (szerverkomponensek, server actionök)
és a `/api/v1` útvonalak route handlereit. Az időszakos feladatok külön Node.js-folyamatban futnak
(`worker/index.ts`, indítása: `pnpm worker`). Mindkettő ugyanazt a szolgáltatásréteget (`lib/services`)
és ugyanazt a PostgreSQL-adatbázist használja; a Docker-image közös, a Compose-szolgáltatások csak az
indítóparancsukban különböznek.

## Megfontolt alternatívák

- **Külön API-szolgáltatás** (pl. önálló HTTP-szerver a `/api/v1` útvonalakhoz): tisztább telepítési
  határ, de megduplázza a hitelesítést, a konfigurációt és a buildet, ekkora méretben csekély haszonért.
- **Üzenetközvetítő (RabbitMQ) az API és a feldolgozók között**: szétválasztja az események fogadását és
  feldolgozását, de újabb infrastruktúra-komponenst hoz be, amelynek kézbesítési garanciáit ráadásul
  össze kellene hangolni az adatbázis-tranzakcióval (outbox). Az inbox tábla (ADR-004) ugyanezt a
  tartósságot egyetlen adattárral biztosítja.
- **Cron a webes folyamaton belül**: egyszerűbb, de az időszakos feladatok minden webes példányban
  lefutnának, és versenyeznének a kérések kiszolgálásával.

## Következmények

- Egy kódbázis, egy telepítési egység, egy tranzakciós határ (PostgreSQL).
- A workernek nincs HTTP-felülete; a JSON-naplóin és az auditnaplón keresztül követhető a működése.
- A worker horizontálisan skálázható, mert az eseményfeldolgozás `FOR UPDATE SKIP LOCKED` zárolást
  használ, a kereteket pedig sorzár védi; a rendszer méretéhez azonban erre nincs szükség.
