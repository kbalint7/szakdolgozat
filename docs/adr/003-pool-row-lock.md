# ADR-003: A keret sorzára védi a kapacitásinvariánst

- Állapot: elfogadva
- Dátum: 2026-10-12

## Kontextus

A BR-04 előírja, hogy egy keretben (cég × termék) a kiosztott helyek száma soha ne haladja meg a keret
kapacitását, akkor sem, ha egyszerre több HR-esemény, szabályváltozás vagy licencaktiválás érinti
ugyanazt a keretet (S4). A kapacitás a licencekből adódik (BR-03), ezért nem írható le egyszerű
oszlopszintű megszorítással.

## Döntés

- Minden keretnek van egy sora a `seat_pools (company_id, product_id)` táblában. A keret minden
  módosítása először `INSERT … ON CONFLICT DO NOTHING`, majd `SELECT … FOR UPDATE` utasítást hajt végre
  erre a sorra, és csak ezután olvassa be a licenceket, a szabályokat, a munkavállalókat és a nyitott
  helysorokat, majd alkalmazza a `planPool()` által készített tervet (`lib/services/pools.ts`).
- Ha egy tranzakciónak több keretre van szüksége (egy munkavállaló több termékre is jogosult), a
  kereteket növekvő `product_id` sorrendben zárolja, így a tranzakciók nem kerülhetnek holtpontba a
  keretsorokon.
- A jogosultság a szabálykészlettől függ, ezért a szabályváltozások `FOR UPDATE`, a HR-események
  feldolgozása pedig `FOR SHARE` módban zárolja a cég sorát: az események így egymással továbbra is
  párhuzamosan futhatnak, de sosem egy éppen változó szabálykészlettel szemben.
- Biztonsági hálók: egy részleges egyedi index (cég, termék, munkavállaló) hármasonként csak egy nyitott
  (várakozó vagy kiosztott) sort enged, és minden alkalmazott terv után a tranzakció újraszámolja a
  kiosztott helyeket, és megszakad, ha számuk meghaladja a kapacitást.

## Megfontolt alternatívák

- **SERIALIZABLE izolációs szint újrapróbálással**: explicit zárak nélkül is helyes, de minden ütközésből
  sorosítási hiba lesz, amelyet újra kell próbálni; nehezebb átlátni és a dolgozatban elmagyarázni.
- **Számlálóoszlop CHECK megszorítással**: rögzített kapacitásnál működik, de a kapacitás idővel
  változik (licenclejárat), és egy kiosztás több állapotot hordoz, mint amennyit egy számláló kifejez.
- **Advisory zárak** (`pg_advisory_xact_lock(hash(company, product))`): ugyanígy viselkednek, de a
  sémában nem látszanak, és valódi sor helyett egy hash a kulcsuk.

## Következmények

- Az S4 forgatókönyv mind a 100 ismétlésben teljesül (`tests/integration/concurrency.test.ts`).
  Zár nélkül ugyanez a teszt elbukik: az utólagos ellenőrzés megszakítja a két tranzakció egyikét – a
  biztonsági háló tehát működik, de az, hogy mindkét tranzakció sikeresen lefusson, a zárnak köszönhető.
- Egy kereten belül a módosítások sorban, egymás után futnak; különböző keretek és cégek között
  párhuzamosan.
