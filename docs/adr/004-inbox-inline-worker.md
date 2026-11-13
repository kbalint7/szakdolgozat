# ADR-004: Inbox tábla, azonnali feldolgozás és újrapróbálás a workerben

- Állapot: elfogadva
- Dátum: 2026-10-12

## Kontextus

A HR-események nem veszhetnek el (EMP-1), ismételt beküldésük nem okozhat többszörös hatást (idempotencia,
BR-08), a feldolgozásuk pedig legyen atomi és helyreállítható (NFR-REL-2). A visszavonásnak emellett
gyorsnak kell maradnia (NFR-PERF-1: p95 ≤ 2 s).

## Döntés

1. A `POST /api/v1/hr/events` validálja az eseményt, eltárolja a `hr_events` táblában (`pending`
   állapottal), és `202`-vel válaszol. A `(company_id, event_id)` pár egyedi: ugyanazzal a tartalommal
   ismételten beküldött eseményre `200 duplicate`, eltérő tartalommal `409` a válasz.
2. Közvetlenül a válasz után (a `next/server` `after()` függvényével) a rendszer **azonnal**, saját
   tranzakcióban feldolgozza az eseményt (`processEvent`).
3. Ha a feldolgozás kivételt dob, a tranzakció teljes egészében visszagörgetődik, és egy második, rövid
   tranzakció rögzíti a `failed` állapotot, az `attempts + 1` értéket, valamint a `last_error` és a
   `next_attempt_at` mezőt.
4. A worker 5 másodpercenként felveszi a `pending` eseményeket és azokat a `failed` eseményeket, amelyeknek
   elérkezett az újrapróbálási ideje; a várakozási idő próbálkozásonként 1 s, 5 s, 30 s, 2 perc, majd
   10 perc (EMP-7). Az adminisztrátorok a *HR-események* oldalon kézzel is újraindíthatják a feldolgozást.

## Megfontolt alternatívák

- **Teljesen szinkron feldolgozás a kérésen belül**: a legegyszerűbb, de egy lassú vagy hibára futó
  kiosztás miatt a HR-rendszer újraküldené az eseményt, és ha a folyamat a commit és a válasz között
  leáll, elvész az eredmény.
- **Külső üzenetsor**: megbízható kézbesítés, de az adatbázissal való összhanghoz outbox kell, és egy
  újabb komponenst kell üzemeltetni (lásd ADR-001).

## Következmények

- Az elfogadott esemény már a feldolgozás előtt tartósan tárolva van; az inbox egyben annak a
  nyilvántartása is, hogy mit küldött a HR-rendszer.
- A Compose-környezetben mért visszavonási késleltetés: p50 33 ms, p95 35 ms (lásd `docs/test-report.md`).
- A `processEvent` `FOR UPDATE SKIP LOCKED` zárolással veszi fel az esemény sorát, így az azonnali
  feldolgozás és a worker soha nem dolgozza fel kétszer ugyanazt az eseményt.
