# ADR-011: A hely a munkavállalóé; használatához összekapcsolt tagság kell

- Állapot: elfogadva
- Dátum: 2026-10-12

## Kontextus

A munkavállalók a HR-rendszerből érkeznek, a felhasználói fiókok regisztrációval jönnek létre. Egy új
belépőnek még nem feltétlenül van fiókja, és nem minden fiók tartozik munkavállalóhoz (pl. egy külső
adminisztrátoré).

## Döntés

A rendszer a helyeket **munkavállalóknak** osztja ki, függetlenül attól, hogy össze vannak-e kapcsolva
felhasználói fiókkal. A licencellenőrzés csak akkor enged, ha a felhasználó tagsága olyan
munkavállalóhoz kapcsolódik, akinek kiosztott helye van (BR-11). Az összekapcsolás létrejöhet a
munkavállalóhoz kötött meghívó elfogadásával (EMP-4), automatikusan, ha a munkavállaló e-mail-címével
már van tag a cégben, vagy egy adminisztrátor kézzel is elvégezheti (COMP-8). A döntés a SPEC §14
(„Döntések”) táblázatában is szerepel.

## Megfontolt alternatívák

- **Csak összekapcsolt fiókkal rendelkező munkavállalók kapnak helyet**: nem lennének „lefoglalt, de nem
  használt” helyek, de egy új belépő csak azért esne ki a várólistáról, mert még nem fogadta el a
  meghívót.

## Következmények

- A foglalkoztatásról továbbra is a HR-rendszer a hiteles forrás; a tagság megszüntetése nem veszi el a
  helyet (BR-18), az ellenőrzés pedig `NOT_MEMBER` / `NOT_LINKED` választ ad, amíg az összekapcsolás
  újra létre nem jön.
- A keret nézete megjelöli azokat a helyeket, amelyeket összekapcsolatlan munkavállalók tartanak, hogy
  az adminisztrátorok utánajárhassanak.
