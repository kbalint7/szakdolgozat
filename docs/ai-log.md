# MI-használati napló

Visszakövethető napló a mesterséges intelligenciával végzett fontos feladatokról, döntésekről és
ellenőrzésekről (SPEC §15). Minden feladatot a Claude Code eszközzel (Opus és Fable modell) végeztem ágens üzemmódban: az eszköz a
gépemen fájlokat írt, parancsokat és teszteket futtatott, és böngészőben ellenőrizte a felületet. A feladatot és
a kereteket mindig én adtam meg, a követelmények és az üzleti szabályok a saját specifikációmból
(`docs/SPEC.md`) származnak. A „Döntés (szerző)” oszlopban jelölöm, hogy az eredményt elfogadtam, módosítottam vagy elvetettem.

## Feladatok

| Rész | Modell | Az MI feladata | Ellenőrzés | Döntés (szerző) |
|---|---|---|---|---|
| Újrakezdés friss Next.js alkalmazással, Prettier, shadcn/ui, színtéma | Opus | a projektváz és az alapbeállítások elkészítése, magyar nyelvű felülettel | típusellenőrzés, lint, build | Elfogadva. Az újrakezdést én döntöttem el, a korábbi kód csak mintaként szolgált. |
| Adatbázisséma | Opus | a Drizzle-séma és a migráció megírása a specifikáció adatmodellje alapján | a migráció lefuttatva, a táblák és a részleges indexek átnézve | Elfogadva. |
| Bejelentkezés és regisztráció | Opus | Better Auth beállítása, közös jelszószabály a böngészőben és a szerveren, védett útvonalak | böngészős kipróbálás: gyenge jelszó, hibás jelszó, közvetlen API-hívás | Elfogadva. |
| Vezérlőpult, termékek kezelése, katalógus | Opus | a vezérlőpult elrendezése, a platformadminisztrátor termék- és csomagkezelése, a nyilvános katalógus | böngészős kipróbálás: termék létrehozása, csomag validálása, publikálás | Módosítva: a termékűrlapról kivetettem a fölösleges „publikált” jelölőnégyzetet. |
| Cégek, tagságok, profil | Opus | cégek és szerepkörök a jogosultsági mátrix szerint, profiloldal | böngészős kipróbálás, másik cég oldala 404 | Elfogadva. |
| Helykiosztás | Opus | a kiosztómotor (`planPool`) megírása a specifikáció szabályai (BR-02 – BR-07) alapján | egység- és tulajdonságalapú tesztek | Elfogadva. |
| Vásárlás, kulcsaktiválás, rendelések, kézi kulcsok | Opus | szimulált vásárlás, licenckulcsok, aktiválás, rendelések az adminfelületen | böngészős kipróbálás; az adatbázisban ellenőrizve, hogy a kulcsok csak hash-ként tárolódnak | Módosítva: a vásárlási oldal elrendezési hibáit én jeleztem, és javíttattam. |
| Szabályok, meghívók | Opus | szabályok a hatásukkal, meghívók és a tag–munkavállaló összekapcsolás | böngészős kipróbálás, adatbázis-ellenőrzés | Elfogadva. |
| HR-események, munkavállalók, auditnapló, cégek áttekintése | Opus | az eseményfeldolgozás (idempotencia, elavultság, újrapróbálás), munkavállalók és idővonal, beérkező események, auditnapló, áttekintő oldalak | `curl` (401/400/202/200/409/404), a várólista és a kilépés ellenőrzése az adatbázisban | Módosítva: a kézi HR-esemény ablakának hibáját én jeleztem, és javíttattam. |
| Háttérfolyamat (worker) | Opus | esedékes események feldolgozása, licenclejárat, helyek egyeztetése | futtatás lejárt licenccel és függőben lévő eseménnyel | Elfogadva. |
| Szoftvereim, API-kulcsok, klienstokenek | Opus | a felhasználó szoftverei, céges API-kulcsok jogosultságokkal, klienstokenek, az ellenőrzések naplója | böngészős kipróbálás, `curl` | Elfogadva. |
| Kezdeti adatok, Docker | Opus | idempotens seed a bemutató adatokkal, Dockerfile és Compose | kétszeri seed üres adatbázison; a teljes stack elindítva | Elfogadva. |
| Katalóguskeresés, értékesítési statisztika | Opus | két opcionális követelmény megvalósítása | kézi ellenőrzés | Elfogadva. |
| HR-esemény-API, létszám-szinkronizálás, licencellenőrző API | Opus | a nyilvános API-végpontok a specifikáció interfészleírása szerint | `curl`, egység- és integrációs tesztek | Elfogadva. |
| HR-szimulátor, demó kliens, mérőszkriptek | Opus | a két példaprogram, valamint a késleltetés- és terhelésmérés | futtatás a működő alkalmazás ellen | Elfogadva. |
| Egység-, integrációs és E2E tesztek | Opus | a tesztek kódja, köztük az S1–S15 forgatókönyvek az általam megadott elvárt eredményekkel | teljes futtatás; mutációs próba: a keret zárolása nélkül az S4 elbukik | Elfogadva. |
| A felület újratervezése, telefonos elrendezések | Fable | a képernyők megjelenése, elrendezése, betöltési állapotai és felületi szövegei | a design irányát és a követelményeket én adtam meg; képernyőképek alapján jeleztem a hibákat, amíg el nem értük a számomra megfelelő designt; a teljes tesztkészlet | Elfogadva. |
| Dokumentáció | Opus | a kód dokumentációja; a dolgozatban az általam kért táblázatok; az ábrák és a képernyőképek | a számok a tesztfuttatások és a mérések kimenetéből; a dokumentáció összevetése a kóddal | Elfogadva. |
