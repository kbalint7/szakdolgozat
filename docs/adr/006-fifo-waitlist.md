# ADR-006: FIFO várólista az `eligibleSince` alapján

- Állapot: elfogadva
- Dátum: 2026-10-12

## Kontextus

Ha a keret megtelt, a jogosult munkavállalók várnak. A sorrendnek determinisztikusnak, megmagyarázhatónak
és méltányosnak kell lennie.

## Döntés

A szabad helyeket a várakozó sorok `eligible_since` szerint növekvő sorrendben kapják meg; egyezés esetén
a HR-azonosítók bájtsorrendje dönt (BR-05; `compareWaitlist` a `lib/domain/seniority.ts` fájlban, SQL-ben
`collate "C"`). Az `eligibleSince` annak az eseménynek az `occurredAt` időpontja, illetve annak a
szabálynak a létrehozási ideje, amely a munkavállalót jogosulttá tette. Újbóli belépéskor új bejegyzés
indul, új `eligibleSince` értékkel (BR-16).

## Megfontolt alternatívák

- **Munkakör szerinti prioritás** (pl. a szenior munkatársak előnyt kapnak): prioritási modellt igényel,
  és nehezebb megmagyarázni.
- **Minden kiosztás kézi jóváhagyása**: éppen az a kézi folyamat, amelyet a rendszer kivált.

## Következmények

- Az adminisztrátorok (SEAT-3) és a felhasználók (CHK-3, `WAITLISTED` válasz a sorszámmal) ugyanazt a
  várólistás sorszámot látják, amely a kiosztó algoritmus sorrendjéből adódik.
- A kiosztás a FIFO elv kedvéért sem vesz vissza már kiosztott helyet: ha két belépés párhuzamosan
  pályázik az utolsó szabad helyre, az egyik munkavállaló helyet kap, a másik várólistára kerül –
  aszerint, hogy melyik eseményt dolgozta fel előbb a rendszer (S4).
