# ADR-007: Kapacitáscsökkenéskor a legutóbb kiosztott helyeket vonja vissza a rendszer

- Állapot: elfogadva
- Dátum: 2026-10-12

## Kontextus

Ha egy licenc lejár vagy visszavonják, a kapacitás a kiosztott helyek száma alá csökkenhet. Ilyenkor
helyeket kell visszavonni, és a választásnak ugyanannak kell lennie olvasáskor (a licencellenőrző
végponton) és a tárolt állapotban is.

## Döntés

A rendszer a legutóbb kiosztott helyeket vonja vissza `CAPACITY_REDUCED` okkóddal, a munkavállalók pedig
az eredeti `eligibleSince` értékükkel visszakerülnek a várólistára (BR-07), így ők következnek elsőként,
amikor a kapacitás ismét megnő. A kiosztó algoritmus és a licencellenőrzés ugyanazt az összehasonlító
függvényt használja: a `compareSeniority`-t, amely az assignedAt, az eligibleSince, végül a HR-azonosító
szerint rendez (BR-11 d: egy hely csak akkor számít, ha a rangsorban elfoglalt helyezése belefér a
kapacitásba). Ezért a lejárat után
azonnal érkező ellenőrzés pontosan azokra a helyekre ad elutasítást, amelyeket a worker később visszavon
(S9). A döntés a SPEC §14 („Döntések”) táblázatában is szerepel.

## Megfontolt alternatívák

- **A legrégebben kiosztott helyek visszavonása**: éppen a régóta helyet használó felhasználókat zavarja
  meg, és az eredmény olyan előzményektől függ, amelyeket a felhasználó nem lát.
- **A lejárat felfüggesztése, amíg egy adminisztrátor nem dönt**: a kifizetett időszakon túl is meghagyja
  a hozzáférést.

## Következmények

- A lejáratot már a következő ellenőrzés érvényesíti, még a worker futása előtt (S9: elutasítás
  `NO_VALID_LICENSE` okkal).
- A licenclejáratokat a worker egyszer vezeti át, és rögzíti az auditnaplóban (`license.expired`); hogy
  mely lejáratok vannak már átvezetve, azt a `licenses.expiry_processed_at` oszlop tartja nyilván.
