# ADR-010: Személyes klienstokenek a kliensalkalmazáshoz

- Állapot: elfogadva
- Dátum: 2026-10-12

## Kontextus

A szoftvergyártó programjának azonosítania kell a felhasználót a licencellenőrző végpont felé. A program
az ügyfél gépein, a böngészős munkameneten kívül fut.

## Döntés

Minden felhasználó a *Klienstokenek* oldalon hozhat létre személyes klienstokeneket
(`lm_ct_<prefix>_<secret>`), és ezek egyikét beállítja a programban. A rendszer csak a token SHA-256
hash-ét tárolja; a token csak egyszer jelenik meg, és visszavonható (CHK-2). Az ellenőrzés a tokenből
azonosítja a felhasználót, és a felhasználó összes tagságát kiértékeli.

## Megfontolt alternatívák

- **OAuth eszközengedélyezési folyamat (device authorization flow)**: asztali alkalmazásoknál jobb
  felhasználói élményt ad, nincs szükség másolgatásra, de engedélyezési szervert és tokenfrissítést
  igényel – ez túlmutat a dolgozat keretein.
- **Helyenkénti aktiválókulcsok**: a hozzáférést gépekhez köti személyek helyett; ellentmond a
  szabályalapú, személyközpontú jogosultságkezelésnek.

## Következmények

- Egy kiszivárgott token csak ahhoz ad hozzáférést, amire az adott felhasználó jogosult, és a felhasználó
  maga visszavonhatja.
- Aki elhagy egy céget, megtartja a tokenjét, de az ellenőrzések elutasítást adnak, amint megszűnik a
  tagsága vagy a munkavállalóval való összekapcsolása (BR-18).
