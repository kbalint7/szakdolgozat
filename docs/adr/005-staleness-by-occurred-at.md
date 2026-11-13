# ADR-005: Elavultság munkavállalónként, az `occurredAt` alapján

- Állapot: elfogadva
- Dátum: 2026-10-12

## Kontextus

Az események késve, kétszer vagy rossz sorrendben is megérkezhetnek (újraküldés, kimaradás vagy
visszajátszás miatt). Egy késve érkező belépési (`employee.hired`) esemény nem aktiválhatja újra azt a
munkavállalót, aki azóta kilépett (S6).

## Döntés

A rendszer minden munkavállalónál tárolja a `state_as_of` értéket, vagyis a legutóbb alkalmazott esemény
`occurredAt` időpontját. Az az esemény, amelyre `occurredAt ≤ state_as_of`, `stale` állapottal tárolódik,
és semmin sem változtat (BR-09). Ismeretlen munkavállalót bármilyen típusú esemény létrehoz (BR-10), így
egy elveszett belépési esemény nem akadályozza a későbbieket.

## Megfontolt alternatívák

- **A HR-rendszer által adott eseménysorszámok**: pontos sorrendet adnak, de minden HR-rendszernek
  munkavállalónként külön sorszámot kellene vezetnie; a valós HR-exportok ezt ritkán kínálják.
- **Érkezési sorrendben az utolsó írás nyer (last-write-wins)**: triviális, de egy késleltetett
  visszajátszás csendben felülírja az újabb állapotot.

## Következmények

- A megoldás addig helyes, amíg a HR-időbélyegek munkavállalónként monoton nőnek; két azonos
  `occurredAt` értékű esemény közül az első marad érvényben (a második elavult) – ez dokumentált korlát.
- Ugyanez a szabály védi a teljes létszám (snapshot) szinkronizálását (EMP-9): egy régebbi snapshot nem
  teheti semmissé az újabb események hatását.
