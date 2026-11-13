# ADR-009: Összevont keret (cég, termék) páronként

- Állapot: elfogadva
- Dátum: 2026-10-12

## Kontextus

Egy cégnek ugyanarra a termékre több licence is lehet (pl. különböző időpontokban, különböző időtartamra
vásárolva).

## Döntés

A helyek nem kötődnek konkrét licenchez. A keret kapacitása az éppen érvényes licencek helyszámának
összege (BR-03), és a rendszer a helyeket a keretből osztja ki.

## Megfontolt alternatívák

- **Licencekhez kötött helyek**: a lejárat licencenként pontos lenne, de a helyeket át kellene
  csoportosítani a licencek között, és a felhasználó hozzáférése attól függne, melyik vásárlásból
  származik a helye.

## Következmények

- További helyek vásárlása egyszerűen egy újabb licenckulcs aktiválását jelenti; a megújítás új vásárlás
  (lásd SPEC §14, „Döntések”).
- Lejáratkor a keret csökken, és a BR-07 dönti el, ki veszíti el a helyét, függetlenül attól, melyik
  licenc járt le.
- Az ellenőrzés az érvényes licencek közül a legkorábbi lejáratot adja vissza `license.validUntil`
  értékként (óvatos becslés).
