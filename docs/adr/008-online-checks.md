# ADR-008: Kizárólag online licencellenőrzés, gyorsítótár nélkül

- Állapot: elfogadva
- Dátum: 2026-10-12

## Kontextus

A rendszer alapvető ígérete, hogy a visszavont hely azonnal használhatatlanná válik (UC-09, NFR-PERF-1).
Bármilyen kliens- vagy szerveroldali gyorsítótár a saját élettartamával késlelteti a visszavonást.

## Döntés

A kliensszoftver minden védett művelet előtt meghívja a `POST /api/v1/license/check` végpontot. A végpont
minden kérésnél az adatbázisból olvas (`Cache-Control: no-store`, `use cache` nélkül), a demókliens pedig
elutasítja a műveletet, ha a szerver nem érhető el (fail closed, UC-10).

## Megfontolt alternatívák

- **Aláírt, korlátozott élettartamú (TTL) offline tokenek** (pl. egy óráig érvényes JWT): hálózat nélkül
  is működnek, de a visszavonás a TTL lejártáig is eltarthat; a SPEC §1.5 lehetséges bővítésként említi.

## Következmények

- A visszavonás már a legközelebbi ellenőrzéstől érvényes (mért érték: p95 35 ms a HR-esemény
  elfogadásától számítva).
- Az ellenőrzésnek gyorsnak kell lennie: p95 88 ms, nagyjából 390 kérés/s terhelés mellett, 20
  párhuzamos klienssel (NFR-PERF-2).
- A szoftver hálózati kapcsolat nélkül – szándékosan – nem használható.
