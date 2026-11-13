# ADR-002: A HR-rendszer tényeket jelent, a licenckezelő ezekből vezeti le a helyeket

- Állapot: elfogadva
- Dátum: 2026-10-12

## Kontextus

Kézenfekvő megoldás lenne, hogy a HR-rendszer maga ossza ki a helyeket. Ez azonban a feladat nehéz
részét – hogy a kiosztások összhangban maradjanak a korlátos kerettel, a várólistákkal és a
munkakörváltásokkal – minden egyes HR-integrációra hárítaná, és utólag senki sem tudná megmondani, miért
kapott vagy veszített el valaki hozzáférést.

## Döntés

A HR-rendszer csak **tényeket** jelent a munkavállalókról (`employee.hired`, `employee.role_changed`,
`employee.terminated`). A cég adminisztrátorai **szabályokat** adnak meg (munkakör → termék). A
licenckezelő ezekből **vezeti le** a jogosultságot (BR-02), és a keretből osztja ki a helyeket
(BR-03–BR-07). A licenckezelőben a kezelési szerepkörök függetlenek a használati jogtól (BR-01).

## Megfontolt alternatívák

- **A HR-rendszer közvetlenül osztja ki a helyeket**: egyszerű API, de minden HR-rendszernek meg kellene
  valósítania a kapacitáskezelést, a várólistát és a visszavonást; könnyen ellentmondásos állapot jön
  létre, amelyet utólag nem lehet megmagyarázni.
- **Kézi kiosztás a felületen**: ez az a kiinduló gyakorlat, amelyet a rendszer kivált (összehasonlítási
  alap: SPEC §10.3).

## Következmények

- A helyekről szóló döntések egyetlen modulban születnek (`lib/domain/allocation.ts`), és mindegyik
  okkóddal és kiváltó okkal (esemény vagy szabály) együtt rögzül – a munkavállaló idővonala (EMP-6) így
  minden döntést meg tud magyarázni.
- A HR-integrációk vékonyak maradnak: csak továbbítják, mi történt, idempotens módon (BR-08).
- A szabályok durva szemcsézettségűek (munkakörönként adhatók meg); személyre szóló kivételekhez a RULE-4
  követelmény kellene, amely opcionális, és a rendszer nem valósítja meg.
