# Céges licenckezelő – szoftverspecifikáció

| | |
|---|---|
| **Dátum** | 2026-11-13 |
| **Szerző** | Konc Bálint |
| **Témavezető** | Dr. Bilicki Vilmos |
| **Állapot** | A megvalósított rendszer leírása |

---

## 1. Cél és hatókör

### 1.1 A probléma

A kis szoftverfejlesztő cégek nem engedhetik meg maguknak, hogy saját licenckezelő rendszert építsenek, a szoftvert vásárló cégek pedig nehezen látják át, melyik munkavállalójuk melyik licencet használja. A helyek kézi kiosztása lassú és hibalehetőségekkel teli: belépéskor, munkakörváltáskor és kilépéskor valakinek mindig gondolnia kell a hozzáférés megadására vagy visszavonására, így a helyek kihasználatlanul maradnak, vagy több hely kerül kiosztásra, mint amennyit a cég megvásárolt.

### 1.2 A megoldás röviden

A rendszer egy webalkalmazás, amelyben egy szoftvergyártó (a platformadminisztrátor) szoftvercsomagokat értékesít cégeknek. A cég megvásárol egy csomagot (a fizetés szimulált), kap egy licenckulcsot, és aktiválja, amivel az adott termékre egy helykeretet kap. A cég adminisztrátorai **nem** kézzel osztják ki a helyeket, hanem **szabályokat** adnak meg (például „*Developer* munkakör → *IDE Pro* termék”). A cég HR-rendszere **tényeket** közöl a munkavállalókról (belépett, munkakört váltott, kilépett). Ezekből a tényekből és a szabályokból a licenckezelő **levezeti**, ki jogosult az egyes termékekre, kiosztja a helyeket a korlátos keretből, FIFO-várólistát vezet, ha a keret megtelt, és visszavonja azokat a helyeket, amelyek már nem indokoltak. A gyártó szoftvere minden védett művelet előtt online ellenőrzi, hogy az aktuális felhasználó használhatja-e. Visszavont hely esetén a következő ellenőrzés már elutasító választ ad.

### 1.3 A szakmai mag

A fejlesztési munka és a dolgozat súlypontja a következő négy terület:

1. **Szabályokból levezetett jogosultságok:** a jogosultságot a rendszer a munkavállaló állapotából és a cég szabályaiból számítja ki, a kezelési szerepköröktől elkülönítve.
2. **Kiosztás szigorú kapacitáskorlát mellett:** túlfoglalás párhuzamos kérések esetén sem fordulhat elő, a várólista pedig determinisztikus.
3. **Az életciklus-változások biztonságos feldolgozása:** idempotens események; elavult események, amelyek nem írhatják felül az újabb állapotot; észlelhető és helyreállítható hibák; magyarázható auditnyomvonal.
4. **Érvényesítés egy külső alkalmazásban:** online licencellenőrzés, amely figyelembe veszi a tagságot, a helyet és a licenc érvényességét, mért visszavonási késleltetéssel.

### 1.4 A rendszer része

- Egyetlen Next.js + PostgreSQL alkalmazás (`szakdolgozat` repository)
- Termékkatalógus, csomagok, szimulált vásárlás, licenckulcsok, kulcsaktiválás
- Cégek, kezelési szerepkörök, meghívók
- HR-eseményekből táplált munkavállalói adatok, szabályok, automatikus helykiosztás, FIFO-várólista
- Céges API-kulcsok (HR-integráció) és személyes klienstokenek (licencellenőrzés)
- Auditnapló (döntésnapló) és a munkavállalók idővonala
- Két kis példaprogram: **HR-szimulátor** és **demó kliens**
- Helyi telepítés Docker Compose-zal, kezdeti adatok (seed), automatizált tesztek, tesztjelentés, UAT

### 1.5 Nem része a rendszernek

| Elem | Indoklás |
|---|---|
| Electron asztali felület, felhőalapú fájltárolás, futtatható állományok fel- és letöltése | A licenckezelés működéséhez nem szükséges: a rendszer a használati jogot kezeli, magát a szoftvert nem terjeszti. |
| Valódi fizetés, számlázás, ÁFA | A vásárlás szimulált; a fizetés nem része a licenckezelésnek. |
| Ismétlődő előfizetés, automatikus megújítás, csomagváltás, időarányos elszámolás | A csomag határozott vagy határozatlan idejű helykeretet ad; a megújítás új vásárlást jelent ([Q1](#14-döntések)). |
| Magánszemélyek vásárlásai | A rendszer céges licencelésre készült. |
| Offline licencellenőrzés, eszközhöz kötött vagy lebegő (floating) licencek | Offline használat mellett az azonnali visszavonás nem valósítható meg; a rendszer kizárólag online ellenőriz (BR-12). |
| Több szoftvergyártó | A platformon egyetlen gyártó, maga az üzemeltető értékesít. |
| Egyszeri bejelentkezés (SSO), valódi HR-rendszer-csatlakozók (SAP, BambooHR, …) | Bármely HR-rendszer a HR-esemény API-n (§7.1) keresztül csatlakoztatható; a bemutatáshoz a HR-szimulátor küldi az eseményeket. |
| Részletes értékesítési elemzések (BI-irányítópult) | A licenckezelés működéséhez nem szükséges; az alapvető értékesítési statisztikát az ADM-6 fedi le. |

---

## 2. Szereplők és szerepkörök

### 2.1 Szereplők

| Szereplő | Leírás | Hitelesítés |
|---|---|---|
| **Látogató** | Nincs bejelentkezve; a katalógust böngészi. | — |
| **Felhasználó** | Regisztrált fiókkal rendelkezik. | Munkamenet (e-mail-cím + jelszó) |
| **Cégtulajdonos / adminisztrátor / tag** | Olyan felhasználó, akinek egy cégben *kezelési szerepköre* van. | Munkamenet |
| **Munkavállaló** | A cég HR-rendszerében nyilvántartott személy. Felhasználói fiókhoz kapcsolódhat, de ez nem kötelező. | — (csak adat) |
| **Platformadminisztrátor** | A platformot üzemeltető szoftvergyártó. | Munkamenet + `users.is_platform_admin` |
| **HR-rendszer** | A cég külső HR-rendszere (itt: a HR-szimulátor). | Céges API-kulcs |
| **Kliensalkalmazás** | A gyártó szoftvere, amely az ügyfélnél fut (itt: a demó kliens). | A felhasználó személyes klienstokenje |

### 2.2 Kezelési szerepkör és használati jog

A két fogalom **független** egymástól:

- **Kezelési szerepkör** (`owner`, `admin`, `member`): mit tehet a felhasználó *a licenckezelő felületén*.
- **Használati jog** (egy kiosztott hely): használhat-e egy *munkavállaló* egy *terméket*. Kizárólag a szabályokból és a kiosztásból származik.

A licenceket kezelő tulajdonos vagy adminisztrátor **nem** kap helyet, hacsak nem egyben olyan munkavállaló is, akinek a munkakörére vonatkozik szabály (BR-01).

### 2.3 Engedélymátrix (cégszintű műveletek)

| Művelet | Tulajdonos | Adminisztrátor | Tag |
|---|:-:|:-:|:-:|
| A cég áttekintésének és a saját helyeknek a megtekintése | ✓ | ✓ | ✓ |
| A cég elhagyása | — (BR-13) | ✓ | ✓ |
| A cég nevének és leírásának szerkesztése, a cég törlése | ✓ | | |
| Adminisztrátorok kinevezése és visszaminősítése, a tulajdonjog átruházása | ✓ | | |
| Tagok meghívása és eltávolítása, meghívók kezelése | ✓ | ✓ | |
| Csomagok vásárlása, licenckulcsok aktiválása | ✓ | ✓ | |
| Szabályok létrehozása és törlése | ✓ | ✓ | |
| Munkavállalók, helyek és várólista megtekintése | ✓ | ✓ | |
| API-kulcsok kezelése | ✓ | ✓ | |
| A HR-események listájának megtekintése, események újrafeldolgozása, egyeztetés indítása | ✓ | ✓ | |
| A cég auditnaplójának megtekintése | ✓ | ✓ | |

Adminisztrátor nem távolíthatja el a tulajdonost és más adminisztrátorokat. Adminisztrátori jogot csak a tulajdonos adhat és vonhat vissza.

A platformadminisztrátor a teljes platformon kezeli a termékeket és a csomagokat, látja a rendeléseket, kézzel is kiadhat licenckulcsot, valamint csak olvasásra látja az összes céget és a globális auditnaplót.

---

## 3. Szakterületi modell

### 3.1 Fogalmak

```
Product ──< Plan ──< Order ──1 LicenseKey ──1 License >── Company
                                                │
                     SeatPool (Company × Product) ── kapacitás = Σ érvényes License.seatCount
                                                │
Company ──< EntitlementRule (jobRole → Product)  │
Company ──< Employee ──< SeatAssignment >────────┘   (állapot: waiting | assigned | revoked | cancelled)
Company ──< Membership >── User ──< ClientToken
Employee 0..1 ── 1 Membership   (a kapcsolat a meghívó elfogadásakor jön létre)
Company ──< HrEvent   Company ──< ApiKey   AuditLog
```

- **Termék** (`Product`): a gyártó által értékesített szoftver, például *IDE Pro*.
- **Csomag** (`Plan`): egy termék megvásárolható kiszerelése, például *IDE Pro – 20 hely – 12 hónap*. Van helyszáma és időtartama (`null` = határozatlan idejű).
- **Rendelés** (`Order`): egy csomag szimulált megvásárlása egy cég által. Mindig sikeres, fizetési szolgáltató nincs.
- **Licenckulcs** (`LicenseKey`): egyszer használható titkos kulcs, amely egy rendelésből keletkezik, vagy a platformadminisztrátor adja ki kézzel. Aktiválásakor létrejön egy licenc.
- **Licenc** (`License`): egy cég joga egy termék `seatCount` darab helyére `validFrom` és `validUntil` között.
- **Keret** (`SeatPool`): egy cég egy termékre vonatkozó összes *érvényes* licencének helyei összesítve, vagyis a cég adott szoftverre vonatkozó helykerete. A kapacitás a licencek helyszámainak összege.
- **Munkavállaló** (`Employee`): HR-nyilvántartási rekord: cégen belül egyedi HR-azonosító, e-mail-cím, név, munkakör és állapot (`active` | `terminated`).
- **Szabály** (`EntitlementRule`): (cég, munkakör, termék) hármas. Az adott munkakörű összes aktív munkavállaló jogosult a termékre.
- **Helykiosztás** (`SeatAssignment`): (munkavállaló, termék) igényenként egy sor. Egyetlen életciklusban tartalmazza a várólista-bejegyzést és a kiosztott helyet.

### 3.2 A helykiosztás állapotgépe

```
                 jogosulttá válik
  (nincs) ───────────────────────────► waiting ──── már nem jogosult ───► cancelled
                                          │
                      ha van szabad hely  │
                    és FIFO szerint első  ▼
                                       assigned ─── már nem jogosult ───► revoked
                                          │
                       kapacitás csökken  │  (a sor → revoked; új waiting sor jön létre
                                          └─  az eredeti eligibleSince értékkel; BR-07)
```

- (cég, termék, munkavállaló) hármasonként legfeljebb egy `waiting` vagy `assigned` sor létezhet; ezt egy részleges egyedi index (partial unique index) biztosítja.
- A `revoked` és a `cancelled` végállapot. Egy újabb jogosultság új sort hoz létre.
- Minden átmenet eltárolja az `endReason` és a `causeEventId` értékét, illetve azt a felhasználót vagy szabályt, amely kiváltotta.

### 3.3 A munkavállaló állapota

```
            hired (újabb)              terminated (újabb)
 (nincs) ──────────────► active ─────────────────────────► terminated
                          │  ▲                                  │
     role_changed (újabb) └──┘  hired (újabb) = újbóli belépés  │
                             ▲──────────────────────────────────┘
```

Egy esemény csak akkor módosítja a munkavállaló állapotát, ha az `occurredAt` értéke későbbi, mint a munkavállaló `stateAsOf` értéke (BR-09).

---

## 4. Üzleti szabályok

| Azonosító | Szabály |
|---|---|
| **BR-01** | A kezelési szerepkör nem ad használati jogot. A használathoz kiosztott hely kell. |
| **BR-02** | Egy munkavállaló akkor és csak akkor **jogosult** a C cégben a P termékre, ha `active` állapotú, és C-nek van olyan szabálya, amelyben a munkakör megegyezik a munkavállalóéval, a termék pedig P. A jogosultság nem függ a szabad kapacitástól. |
| **BR-03** | A (C, P) keret kapacitása = C-nek a P termékre szóló azon licenceinek `seatCount` összege, amelyek `active` állapotúak és jelenleg érvényesek (`validFrom ≤ now < validUntil`, vagy a `validUntil` értéke null). |
| **BR-04** | **Invariáns:** egy keretben az `assigned` sorok száma soha nem haladja meg a kapacitást, semmilyen időpontban és párhuzamos feldolgozás mellett sem. |
| **BR-05** | **FIFO-kiosztás:** a szabad helyeket a `waiting` sorok kapják, `eligibleSince` szerint növekvő sorrendben; egyezés esetén a HR-azonosító dönt. Az `eligibleSince` annak a HR-eseménynek az `occurredAt` értéke, illetve annak a szabálynak a létrehozási ideje, amely a munkavállalót jogosulttá tette. |
| **BR-06** | Amikor egy munkavállaló elveszíti a jogosultságát (kilépés, munkakörváltás, szabály törlése), a rendszer az `assigned` sorát visszavonja (`revoked`), a `waiting` sorát pedig érvényteleníti (`cancelled`), **ugyanabban a tranzakcióban**, amelyben a kiváltó változás történik. A felszabadult helyeket ugyanebben a tranzakcióban a várólistán következők kapják meg. |
| **BR-07** | Ha a kapacitás a kiosztott helyek száma alá csökken (egy licenc lejárt vagy visszavonták), a rendszer a **legutoljára kiosztott** helyeket vonja vissza `CAPACITY_REDUCED` okkal. Ezek a munkavállalók eredeti `eligibleSince` értékükkel kerülnek vissza a várólistára, így a kapacitás visszatérésekor elsőként kapnak helyet. |
| **BR-08** | **Idempotencia:** egy HR-eseményt a (cég, `eventId`) pár azonosít. Az azonos tartalommal (payload) megismételt esemény nem változtat semmin, és `duplicate` választ kap. Ha ugyanaz az `eventId` eltérő tartalommal érkezik, a rendszer `409 Conflict` válasszal elutasítja. |
| **BR-09** | **Elavultság:** az az esemény, amelynek `occurredAt` értéke ≤ a munkavállaló `stateAsOf` értéke, `stale` állapottal tárolódik, és nem módosítja az állapotot. Így egy késve érkező „hired” esemény nem aktiválhatja újra a már kilépett munkavállalót. |
| **BR-10** | Az események HR-azonosítóval hivatkoznak a munkavállalókra. Ha ismeretlen munkavállalóra nem belépési esemény érkezik, a rendszer upsertként alkalmazza: a `role_changed` aktív, a `terminated` kilépett munkavállalót hoz létre. Így egy elveszett belépési esemény nem akasztja meg a feldolgozást. |
| **BR-11** | **Használat ellenőrzése:** az U felhasználó P termékre vonatkozó ellenőrzése akkor és csak akkor **engedélyezett**, ha (a) U klienstokenje érvényes és nincs visszavonva, (b) U tagja egy C cégnek, és a tagsága egy munkavállalóhoz kapcsolódik, (c) ennek a munkavállalónak van `assigned` helye P-re C-ben, és (d) a hely belefér a keret **aktuális** kapacitásába. A kiosztott helyek `assignedAt` szerint, a legrégebbitől kezdve kapnak sorszámot, és a hely sorszáma nem lehet nagyobb a BR-03 szerinti kapacitásnál. A (d) feltétel olvasáskor alkalmazza a BR-07-et, így a lejárt licencet a rendszer már a következő ellenőrzésnél érvényesíti, még mielőtt a worker (háttérfolyamat) visszavonná a fölösleges helyeket. Minden más esetben az ellenőrzés elutasító választ ad, egy okkóddal (§7.3). |
| **BR-12** | A licencellenőrzés mindig online történik, az eredményét a rendszer nem gyorsítótárazza. A visszavonás a következő ellenőrzéstől érvényes. |
| **BR-13** | Egy cégnek pontosan egy tulajdonosa van. A tulajdonos nem hagyhatja el a céget: előbb át kell ruháznia a tulajdonjogot, vagy törölnie kell a céget. |
| **BR-14** | Egy licenckulcsot csak egyszer, egyetlen cég aktiválhat. Az aktiváláshoz tulajdonosi vagy adminisztrátori szerepkör kell az adott cégben. |
| **BR-15** | **Bérlők elkülönítése:** minden cégszintű olvasás és írás arra a cégre szűr, amelynek a szereplő tagja (illetve amelyhez az API-kulcs tartozik). Más cég erőforrásaira a rendszer `404 Not Found` választ ad. |
| **BR-16** | Újbóli belépéskor (`terminated` után egy újabb `hired`) új várólista-bejegyzés jön létre, új `eligibleSince` értékkel. A korábban szerzett sorrendi előny nem áll helyre. |
| **BR-17** | Szabály törlésekor a rendszer azonnal újraszámolja a keretet (BR-06, `RULE_REMOVED` ok). Szabály létrehozásakor az egyező munkakörű aktív munkavállalók jogosulttá válnak, `eligibleSince` = a szabály létrehozási ideje. |
| **BR-18** | Egy felhasználó tagságának megszűnésekor a tagság és a munkavállaló közötti kapcsolat is megszűnik. A hely a munkavállalónál marad (a foglalkoztatásról a HR a hiteles forrás), de az ellenőrzések elutasító választ kapnak (`NOT_MEMBER` vagy `NOT_LINKED`), amíg a munkavállalóhoz újra nem kapcsolódik tagság. |
| **BR-19** | A cég törlése logikai (soft) törlés: a rendszer minden helyet, API-kulcsot és meghívót visszavon, az auditnaplót pedig megőrzi. |

---

## 5. Funkcionális követelmények

A követelmények prioritása: **K** = kötelező, **A** = ajánlott, **O** = opcionális.

### 5.1 Hitelesítés (AUTH)

| Azonosító | Követelmény | Prio. | Elfogadási feltétel |
|---|---|:-:|---|
| AUTH-1 | Regisztráció vezetéknévvel, keresztnévvel, e-mail-címmel és jelszóval | K | Már regisztrált e-mail-címmel nem lehet újra regisztrálni. A jelszó 8–128 karakter hosszú, és legalább egy kisbetűt, egy nagybetűt és egy számjegyet tartalmaz; a kliens és a szerver ugyanezt a szabályt ellenőrzi. |
| AUTH-2 | Bejelentkezés és kijelentkezés | K | Hibás e-mail-cím vagy jelszó esetén egyetlen, általános hibaüzenet jelenik meg. Sikeres bejelentkezés után a rendszer a vezérlőpultra irányít. |
| AUTH-3 | A védett oldalak a bejelentkezésre irányítanak | K | Bejelentkezés nélkül bármely `/dashboard/**` útvonal kérése a `/login` oldalra irányít át. |
| AUTH-4 | Profil szerkesztése és a fiók törlése | A | Amíg a felhasználó egy cég tulajdonosa, a fiókja nem törölhető (BR-13). Egyébként a tagságai megszűnnek (BR-18). |
| AUTH-5 | Az e-mail-cím megerősítése | O | Megerősítetlen e-mail-címmel nem lehet meghívót elfogadni. **Nincs megvalósítva.** |

### 5.2 Katalógus (CAT)

| Azonosító | Követelmény | Prio. | Elfogadási feltétel |
|---|---|:-:|---|
| CAT-1 | A közzétett termékek nyilvános listája | K | A látogatók látják a termék nevét, rövid leírását és a legolcsóbb csomag árát. |
| CAT-2 | Termékoldal a csomagokkal | K | Minden aktív csomagnál megjelenik a helyszám, az időtartam és az ár. A „Vásárlás” gombhoz bejelentkezés és valamelyik cégben tulajdonosi vagy adminisztrátori szerepkör szükséges. |
| CAT-3 | Szűrés és keresés a katalógusban | O | Szűrés név és ár szerint. |

### 5.3 Vásárlás és licenckulcsok (ORD)

| Azonosító | Követelmény | Prio. | Elfogadási feltétel |
|---|---|:-:|---|
| ORD-1 | Csomag szimulált megvásárlása egy cég számára | K | A tulajdonos vagy az adminisztrátor kiválaszt egy céget, és megerősíti a vásárlást. Létrejön egy rendelés (`paid` állapotban, a vásárláskori árral) és egy még be nem váltott licenckulcs. A kulcs teljes egészében **csak egyszer** jelenik meg; a rendszer csak a hash-ét és az utolsó 4 karakterét tárolja. |
| ORD-2 | Licenckulcs aktiválása egy cégben | K | Érvényes kulcs esetén létrejön egy licenc (a helyszám a csomagból származik, `validFrom` = most, `validUntil` = most + időtartam), a kulcs beváltott állapotba kerül, a rendszer pedig újraszámolja a keretet, így a várakozó munkavállalók helyet kapnak. Ismeretlen, már felhasznált vagy visszavont kulcs esetén a rendszer konkrét hibaüzenettel utasítja el az aktiválást. |
| ORD-3 | „Vásárlás és azonnali aktiválás” egy lépésben | A | Egyetlen megerősítéssel lefut az ORD-1 és az ORD-2 ugyanarra a cégre. |
| ORD-4 | A cég rendeléseinek és licenceinek listája | K | Minden licencnél látszik a termék, a helyszám, az érvényesség, az állapot és a forrásrendelés. |
| ORD-5 | A lejárat automatikus kezelése | K | A `validUntil` időpont után a licenc már nem számít bele a kapacitásba (BR-03). Az ellenőrző végpont ezt azonnal érvényesíti (BR-11 d), a worker pedig 60 s-on belül alkalmazza a BR-07-et a tárolt helyekre. |

### 5.4 Cégek és tagság (COMP)

| Azonosító | Követelmény | Prio. | Elfogadási feltétel |
|---|---|:-:|---|
| COMP-1 | Cég létrehozása | K | A létrehozó lesz a tulajdonos (BR-13). |
| COMP-2 | A saját cégeim listája a szerepkörömmel | K | Mindenki csak azokat a cégeket látja, amelyeknek tagja. |
| COMP-3 | Cég szerkesztése vagy törlése (tulajdonos) | K | A törlés a BR-19 szerint történik, és a cég nevének begépelésével kell megerősíteni. |
| COMP-4 | Felhasználó meghívása e-mail-címmel és szerepkörrel (`admin` vagy `member`) | K | Egyszer használható meghívótoken jön létre, amely 7 nap után lejár. A meghívó linkje megjelenik a meghívást küldőnek, aki továbbítja a meghívottnak; a rendszer e-mailt nem küld. |
| COMP-5 | Meghívó elfogadása vagy elutasítása | K | Bejelentkezett felhasználó és érvényes token szükséges. Elfogadáskor létrejön a tagság. Ha a meghívó egy munkavállalóhoz tartozik (EMP-4), a tagság ehhez a munkavállalóhoz kapcsolódik. |
| COMP-6 | Tag eltávolítása, a cég elhagyása | K | Az engedélymátrix (§2.3), a BR-13 és a BR-18 szerint. |
| COMP-7 | Adminisztrátorok kinevezése és visszaminősítése, a tulajdonjog átruházása | A | Csak a tulajdonos végezheti. |
| COMP-8 | Meglévő tag kézi összekapcsolása egy munkavállalóval, illetve a kapcsolat bontása | A | Adminisztrátori művelet, az auditnaplóba kerül. Egy munkavállalóhoz legfeljebb egy tagság tartozik, és fordítva. |

### 5.5 Munkavállalók és HR-események (EMP)

| Azonosító | Követelmény | Prio. | Elfogadási feltétel |
|---|---|:-:|---|
| EMP-1 | HR-események fogadása API-n keresztül (§7.1) | K | Az elfogadott eseményeket a rendszer a feldolgozás előtt eltárolja. A BR-08 és a BR-10 érvényes. |
| EMP-2 | Az események alkalmazása a munkavállalók állapotára | K | A BR-09 érvényes. Minden feldolgozott esemény ugyanabban a tranzakcióban, minden termékre újraszámolja a munkavállaló helyeit (§6). |
| EMP-3 | A HR-események listája a felületen | K | A lista megmutatja az események állapotát (`pending`, `processed`, `stale`, `failed`), a próbálkozások számát és az utolsó hibát. Állapot szerint szűrhető; a többször beérkezett (ismételt) eseményeket külön szűrő mutatja. |
| EMP-4 | Az e-mail-címet tartalmazó belépési esemény meghívót hoz létre | A | Ha az e-mail-címhez nem tartozik tagság a cégben, a rendszer meghívót hoz létre (`member` szerepkörrel), és a munkavállalóhoz köti. Ha már van ilyen e-mail-című, a munkavállalóhoz kapcsolt tag, nem történik semmi. |
| EMP-5 | A munkavállalók listája | K | Megjelenik a HR-azonosító, a név, a munkakör, az állapot, a kapcsolt fiók, valamint termékenként a helyek és a várólista-pozíciók. |
| EMP-6 | A munkavállaló idővonala | K | Időrendben felsorolja a munkavállalóra alkalmazott eseményeket és a helyére vonatkozó összes döntést, az okkal és a kiváltóval együtt, például: „Az IDE Pro helye visszavonva – a munkavállaló kilépett (esemény: `evt-123`, időpont: 2026-11-03 09:00)”. |
| EMP-7 | Sikertelen események újrapróbálása | K | A worker automatikusan, egyre hosszabb várakozással próbálja újra a feldolgozást (1 s, 5 s, 30 s, 2 perc, 10 perc). 5 sikertelen próbálkozás után az állapot `failed`. Az adminisztrátor kézzel is újraindíthatja a feldolgozást. |
| EMP-8 | A munkavállalók kézi módosítása a felületről | O | Az adminisztrátor űrlapon küldhet belépési, munkakörváltási és kilépési eseményt. Ezek ugyanazon a feldolgozási láncon haladnak végig, `source = ui` értékkel. Ez azoknak a cégeknek hasznos, amelyeknek nincs HR-rendszerük. |
| EMP-9 | Szinkronizáló végpont a teljes HR-létszám (snapshot) alapján | O | A HR-rendszer a teljes munkavállalói listát küldi el. A rendszer az eltéréseket szintetikus eseményekként alkalmazza, így elveszett események után is helyreáll a helyes állapot. |

### 5.6 Szabályok (RULE)

| Azonosító | Követelmény | Prio. | Elfogadási feltétel |
|---|---|:-:|---|
| RULE-1 | Szabály létrehozása (munkakör → termék) | K | (cég, munkakör, termék) hármasonként egyedi. A felület a meglévő munkavállalók munkaköreit ajánlja fel, de tetszőleges munkakör is begépelhető. A rendszer újraszámolja a keretet (BR-17). |
| RULE-2 | Szabály törlése | K | Megerősítés előtt a felület megmutatja, hány hely visszavonásával jár a törlés. A rendszer újraszámolja a keretet (BR-17). |
| RULE-3 | A szabályok listája a hatásukkal | K | Minden szabálynál megjelenik a jogosult munkavállalók, a kiosztott helyek és a várakozó munkavállalók száma. |
| RULE-4 | Egyéni jogosultság (munkavállaló → termék) | O | Olyan szabály, amely munkakör helyett egyetlen munkavállalóra vonatkozik. Ugyanazok a kiosztási szabályok érvényesek rá. **Nincs megvalósítva.** |

### 5.7 Helykiosztás (SEAT)

| Azonosító | Követelmény | Prio. | Elfogadási feltétel |
|---|---|:-:|---|
| SEAT-1 | Automatikus kiosztás a BR-02–BR-07 szerint | K | Az S1–S9 forgatókönyvek igazolják (§10.2). |
| SEAT-2 | A keret áttekintése termékenként | K | Megjelenik a kapacitás, a kiosztott és a szabad helyek száma, a várakozók száma és a legkorábbi licenclejárat. |
| SEAT-3 | Rendezett várólista termékenként | K | Minden bejegyzésnél látszik a pozíció, a munkavállaló, az `eligibleSince` és az ok. |
| SEAT-4 | Egy cég helyeinek egyeztetése | K | Egy gomb, valamint a worker (60 másodpercenként) a cég összes keretét nulláról újraszámolja. Konzisztens állapoton futtatva semmit nem változtat. Mesterségesen előidézett eltérés után visszaállítja a helyes állapotot. |
| SEAT-5 | Biztonság párhuzamos feldolgozás mellett | K | A BR-04 párhuzamos feldolgozás mellett is teljesül (S4). |

### 5.8 Licencellenőrzés (CHK)

| Azonosító | Követelmény | Prio. | Elfogadási feltétel |
|---|---|:-:|---|
| CHK-1 | Ellenőrző végpont (§7.3) | K | Megvalósítja a BR-11-et és a BR-12-t. Minden ellenőrzés bekerül a `license_checks` táblába. |
| CHK-2 | Személyes klienstokenek | K | A felhasználó tokeneket hozhat létre, nevezhet el, listázhat és vonhat vissza. A token csak egyszer jelenik meg, a rendszer csak a hash-ét tárolja. |
| CHK-3 | „Szoftvereim” oldal | K | Termékenként felsorolja, melyik cégen keresztül van hozzáférése a felhasználónak, mi a hely állapota (kiosztva, vagy várakozik, a pozícióval együtt), és meddig érvényes a licenc. |
| CHK-4 | A cég legutóbbi ellenőrzései | A | Az adminisztrátorok látják a cég termékeire vonatkozó legutóbbi ellenőrzések eredményét. |

### 5.9 API-kulcsok (KEY)

| Azonosító | Követelmény | Prio. | Elfogadási feltétel |
|---|---|:-:|---|
| KEY-1 | Céges API-kulcsok létrehozása és visszavonása | K | A kulcsnak neve van, és csak egyszer jelenik meg, `lm_live_<prefix>_<secret>` formátumban. A rendszer csak a hash-ét tárolja. A listában látszik az előtag, a létrehozó, a létrehozás dátuma, az utolsó használat és az állapot. A visszavont kulcsot a rendszer a következő használatkor 401-es válasszal elutasítja. |
| KEY-2 | A kulcsok hatóköre (scope) | A | `hr:events:write` és `hr:events:read`. A kulcs hatókörén kívüli hívások 403-as választ kapnak. |

### 5.10 Naplózás (AUD)

| Azonosító | Követelmény | Prio. | Elfogadási feltétel |
|---|---|:-:|---|
| AUD-1 | Minden állapotváltoztató művelet naplózása | K | Minden bejegyzés rögzíti a szereplőt (felhasználó, API-kulcs vagy a rendszer), a műveletet, a célobjektumot, az okkódot, a kiváltó eseményt és az időpontot. A naplóba kerülnek a helyekre vonatkozó döntések, a szabály- és tagságváltozások, a vásárlások, az aktiválások és a kulcsváltozások is. |
| AUD-2 | A cég auditnaplójának nézete | K | Szűrés művelettípus, munkavállaló és időszak szerint. |
| AUD-3 | Globális auditnapló (platformadminisztrátor) | A | Az összes cég bejegyzései. |

### 5.11 Platformadminisztráció (ADM)

| Azonosító | Követelmény | Prio. | Elfogadási feltétel |
|---|---|:-:|---|
| ADM-1 | Termékek létrehozása, szerkesztése, közzététele és visszavonása a katalógusból | K | A nem közzétett termék nem jelenik meg a katalógusban. A meglévő licencek tovább működnek. |
| ADM-2 | Csomagok létrehozása, szerkesztése és inaktiválása | K | Helyszám > 0, időtartam (nap) > 0 vagy null, ár ≥ 0. Inaktivált csomagot nem lehet megvásárolni. |
| ADM-3 | A rendelések listája | K | Az összes rendelés a céggel, a csomaggal, az árral és a dátummal. |
| ADM-4 | Licenckulcs kézi kiadása egy csomaghoz | A | A platformon kívül lebonyolított értékesítéshez. A kulcs a rendelések listájában `manual` forrással jelenik meg. |
| ADM-5 | A cégek áttekintése (csak olvasás) | A | |
| ADM-6 | Értékesítési statisztikák | O | |

### 5.12 Példaprogramok (SIM)

| Azonosító | Követelmény | Prio. | Elfogadási feltétel |
|---|---|:-:|---|
| SIM-1 | **HR-szimulátor** parancssori program (`tools/hr-sim`) | K | Parancsai: `hire`, `change-role`, `terminate`, `replay <eventId>`, `send --occurred-at <time>` (késve érkező eseményekhez) és `scenario <name>`. Kitalált tesztadatokkal (fixture) és a `.env` fájlban megadott céges API-kulccsal dolgozik. Kiírja a választ és a feldolgozás állapotát. |
| SIM-2 | **Demó kliens** parancssori program (`tools/demo-client`) | K | A `check <product>` egyetlen ellenőrzést végez. A `watch <product> --interval 1s` minden szimulált „védett művelet” előtt ellenőriz, és időbélyeggel kiírja, hogy a művelet *engedélyezett* vagy *elutasított*, elutasításkor az okkal együtt. Klienstokent használ. |
| SIM-3 | A visszavonási késleltetés mérése | K | Egy szkript a HR-szimulátorral kilépteti a munkavállalót, majd addig hívja az ellenőrző végpontot, amíg az elutasító választ nem ad. Ezt N-szer megismétli, és megadja a késleltetés p50, p95 és maximális értékét (S12). |

---

## 6. Feldolgozási modell

### 6.1 A HR-események feldolgozási lánca

```
HR-szimulátor ── POST /api/v1/hr/events ─► [1] hitelesítés + validálás
                                           [2] INSERT hr_events (status=pending)
                                               ON CONFLICT (company_id, event_id) → duplicate / 409
                                           [3] válasz: 202 {status}
                                           [4] azonnali feldolgozás (külön tranzakcióban, a commit után)
Worker (5 másodpercenként) ──────────────► [4] a pending és az újrapróbálható failed események feldolgozása
                                           [5] 60 másodpercenként: lejárt licencek + az érintett keretek egyeztetése
```

**Egy esemény feldolgozása (4. lépés) egyetlen adatbázis-tranzakcióban fut:**

1. Az esemény sorának zárolása (`SELECT … FOR UPDATE SKIP LOCKED`), hogy egyszerre csak egy feldolgozó foglalkozzon vele.
2. A munkavállaló sorának zárolása (`FOR UPDATE`), illetve létrehozása, ha még nem létezik.
3. Ha `occurredAt ≤ employee.stateAsOf`, az esemény `stale` állapotot kap, és a tranzakció véglegesítődik (BR-09).
4. Az új állapot alkalmazása, valamint a `stateAsOf = occurredAt` és a `lastEventId` beállítása.
5. Minden olyan termékre, amelyre a munkavállaló jogosult volt vagy most jogosult, a `seat_pools (company_id, product_id)` keretsor zárolása `FOR UPDATE`-tel – a holtpontok elkerülése érdekében növekvő `product_id` sorrendben –, majd a kiosztási lépés futtatása (§6.2).
6. Az auditbejegyzések megírása, az esemény `processed` állapotba állítása és a tranzakció véglegesítése (commit).

Ha bármelyik lépés kivételt dob, a teljes tranzakció visszagörgetődik, így **részleges állapot nem jöhet létre**. Ezután egy második, rövid tranzakció rögzíti a `status = failed`, az `attempts + 1` és a `lastError` értéket. A worker az EMP-7 szerint újrapróbálja a feldolgozást, az adminisztrátor pedig a HR-események listájában (EMP-3) látja a sikertelen eseményeket.

A szabályváltozások, a licencek aktiválása és lejárata, valamint az egyeztetés ugyanazt a kiosztási lépést használja, ugyanazzal a keretzárolással.

### 6.2 A kiosztási lépés (tiszta függvény + perzisztencia)

A döntési logika egy **tiszta függvény** a `lib/domain/allocation.ts` fájlban. Nincs I/O-művelete, így egységtesztekkel kimerítően tesztelhető:

```ts
planPool(input: {
  capacity: number;
  eligible: { employeeId: string; eligibleSince: Date; hrId: string }[];
  current:  { employeeId: string; status: 'waiting' | 'assigned'; assignedAt?: Date; eligibleSince: Date }[];
  reasonFor(employeeId): EndReason;     // miért szűnt meg valakinek a jogosultsága
}): Action[]   // REVOKE | CANCEL | ENQUEUE | ASSIGN | REQUEUE (kapacitáscsökkenés)
```

Az algoritmus:

1. Minden `assigned` sor, amelynek munkavállalója nem jogosult → `REVOKE(reason)`. Minden ilyen `waiting` sor → `CANCEL(reason)`.
2. Minden jogosult munkavállaló, akinek még nincs sora → `ENQUEUE(eligibleSince)`.
3. Ha a megmaradt kiosztott helyek száma > kapacitás → `REQUEUE` a legutoljára kiosztott sorokra, amíg a számuk le nem csökken a kapacitásra (BR-07).
4. Szabad helyek = kapacitás − kiosztott helyek → `ASSIGN` az első várakozó sorokra, FIFO-sorrendben (BR-05).

A szolgáltatási réteg ezeket a műveleteket a keretet zároló tranzakción belül hajtja végre.

**Biztonsági hálók:** részleges egyedi index a `seat_assignments (company_id, product_id, employee_id) WHERE status IN ('waiting','assigned')` oszlopokon, valamint invariáns-ellenőrzés (`assigned ≤ capacity`) minden végrehajtott kiosztási terv után. Ha az invariáns sérül, a tranzakció megszakad.

### 6.3 Egyeztetés (a helyek újraszámolása)

A `reconcileCompany(companyId)` a cég összes keretét újraszámolja a jelenlegi munkavállalók, szabályok és licencek alapján, ugyanazzal a `planPool` függvénnyel. A művelet **idempotens**. Lefut:

- igény szerint (a SEAT-4 gombjával),
- a workerben 60 másodpercenként azokra a keretekre, amelyekhez az előző futás óta lejárt licenc tartozik,
- tesztekben, annak igazolására, hogy az újraszámolt állapot megegyezik a lépésenként karbantartott állapottal.

---

## 7. Külső interfészek

Minden végpont az `/api/v1` útvonal alatt található. A kérések és válaszok törzse JSON, az időpontok ISO 8601 formátumú UTC-időpontok, a hibák pedig a következő szerkezetűek:

```json
{ "error": { "code": "VALIDATION_FAILED", "message": "…", "details": [ … ] } }
```

### 7.1 HR-események – `POST /api/v1/hr/events`

**Hitelesítés:** `Authorization: Bearer <céges API-kulcs>`, hatókör: `hr:events:write`. A céget a rendszer a kulcsból állapítja meg, sosem a kérés törzséből.

```json
{
  "eventId": "evt-2026-11-03-0001",
  "type": "employee.hired",
  "occurredAt": "2026-11-03T09:00:00Z",
  "employee": {
    "hrId": "E-1042",
    "email": "kiss.anna@example.com",
    "name": "Kiss Anna",
    "jobRole": "developer"
  }
}
```

| `type` | Kötelező munkavállalói mezők | Eredő állapot |
|---|---|---|
| `employee.hired` | `hrId`, `jobRole` (az e-mail-cím és a név megadása ajánlott) | `active`, a megadott `jobRole` értékkel |
| `employee.role_changed` | `hrId`, `jobRole` | `active`, az új `jobRole` értékkel |
| `employee.terminated` | `hrId` | `terminated` |

| Válasz | Eset |
|---|---|
| `202 {"status":"accepted","eventId":…}` | Új esemény, a rendszer eltárolta |
| `200 {"status":"duplicate","eventId":…}` | Ugyanaz az `eventId`, azonos tartalom (BR-08) |
| `400 VALIDATION_FAILED` | Sémasértés. Semmi nem tárolódik. |
| `401 UNAUTHORIZED` | Hiányzó, ismeretlen vagy visszavont kulcs |
| `403 FORBIDDEN` | A kulcs hatóköre nem terjed ki a műveletre |
| `409 EVENT_ID_CONFLICT` | Ugyanaz az `eventId`, eltérő tartalom |

Korlátok: `eventId` ≤ 128 karakter, `jobRole` ≤ 64 karakter, `[a-z0-9_-]+` mintával, a kérés törzse ≤ 16 KB.

### 7.2 Esemény állapota – `GET /api/v1/hr/events/{eventId}`

Hatókör: `hr:events:read`. A válasz `{ eventId, status, attempts, lastError?, receivedAt, processedAt? }`, vagy `404`.

### 7.3 Licencellenőrzés – `POST /api/v1/license/check`

**Hitelesítés:** `Authorization: Bearer <klienstoken>`.

```json
{ "product": "ide-pro" }
```

**Engedélyezett:**
```json
{
  "allowed": true,
  "product": "ide-pro",
  "company": { "id": "…", "name": "Példa Kft." },
  "seat": { "assignedAt": "2026-11-03T09:00:01Z" },
  "license": { "validUntil": "2027-11-03T00:00:00Z" },
  "checkedAt": "2026-11-04T08:12:00Z"
}
```

**Elutasított** (`200`, mert az elutasítás üzleti eredmény, nem hiba):
```json
{ "allowed": false, "product": "ide-pro", "reason": "WAITLISTED", "waitlistPosition": 2, "checkedAt": "…" }
```

| `reason` | Jelentés |
|---|---|
| `NOT_MEMBER` | A felhasználó egyetlen cégnek sem tagja. |
| `NOT_LINKED` | A felhasználó tag, de a tagsága nem kapcsolódik munkavállalóhoz (például olyan adminisztrátor, aki nem szerepel a HR-adatokban, BR-01). |
| `NOT_ELIGIBLE` | A tagság munkavállalóhoz kapcsolódik, de egyetlen szabály sem vonatkozik rá, vagy a munkavállaló kilépett. |
| `WAITLISTED` | Jogosult, de helyre vár (a válasz tartalmazza a `waitlistPosition` értéket). |
| `NO_VALID_LICENSE` | Van kiosztott helye, de a hely kívül esik az aktuális kapacitáson, mert egy licenc lejárt vagy visszavonták (BR-11 d). |

Ha a felhasználónak több cégben is van helye, egyetlen engedélyezett hely is elég, és a válasz megnevezi az adott céget. Ha minden cég elutasítja, a válasz a legspecifikusabb okot adja meg, ebben a sorrendben: `WAITLISTED` > `NO_VALID_LICENSE` > `NOT_ELIGIBLE` > `NOT_LINKED` > `NOT_MEMBER`.

További válaszok: `401` (érvénytelen vagy visszavont token), `404 PRODUCT_NOT_FOUND`, `400`.

### 7.4 Belső felhasználói felület

A felhasználói felület Next.js server actionöket és server componenteket használ, ezért nyilvános REST API-t nem tesz elérhetővé. Minden server action zoddal validálja a bemenetét, és a szerveren ellenőrzi a szereplő tagságát és szerepkörét (§8).

---

## 8. Nem funkcionális követelmények

| Azonosító | Követelmény | Ellenőrzés módja |
|---|---|---|
| NFR-SEC-1 | Bérlők elkülönítése (BR-15) minden lekérdezésben és server actionben. Az engedélyek ellenőrzése minden kérésnél az adatbázisból olvassa ki a tagságot, sosem a munkamenet-süti gyorsítótárából. | S10, valamint server actionönkénti integrációs tesztek |
| NFR-SEC-2 | Az API-kulcsokat, a klienstokeneket, a licenckulcsokat és a meghívótokeneket a rendszer SHA-256 hash-ként tárolja, konstans idejű összehasonlítással ellenőrzi, és csak egyszer jeleníti meg. | Egységteszt + az adatbázis átvizsgálása |
| NFR-SEC-3 | Minden külső bemenetet a rendszer határán zod validál; érvénytelen bemenet semmit nem változtat meg. | S15, a sémák egységtesztjei |
| NFR-SEC-4 | A repositoryban nincsenek valódi titkok. A `.env.example` csak mintaértékeket tartalmaz, a kezdeti adatok (seed) felhasználói dokumentált demójelszavakat használnak. | Átnézés, `git grep` |
| NFR-SEC-5 | A jelszavakat a Better Auth hash-eli, a hitelesítési végpontokat kérésszám-korlátozás védi (a Better Auth beépített funkciója). | A konfiguráció átnézése |
| NFR-REL-1 | Nincs túlfoglalás: a BR-04 az S4 100 ismétlése során is teljesül. | S4 |
| NFR-REL-2 | Az eseményfeldolgozás atomi: egy injektált hiba nem hagy maga után részleges állapotot, az újrapróbálás pedig ugyanahhoz a végállapothoz vezet, mint a megszakítás nélküli futás. | S11 |
| NFR-REL-3 | Az egyeztetés idempotens, és az eredménye megegyezik a lépésenként karbantartott állapottal. | Integrációs teszt |
| NFR-PERF-1 | **Visszavonási késleltetés** (a kilépési esemény elfogadásától az első elutasított ellenőrzésig): p95 ≤ 2 s a helyi Docker Compose környezetben. | S12 / SIM-3; a mért értékeket a dolgozat közli |
| NFR-PERF-2 | Az ellenőrző végpont válaszideje p95 ≤ 200 ms 20 párhuzamos klienssel, helyi környezetben. | Terhelésmérő szkript |
| NFR-UX-1 | A felhasználói felület magyar, az API és a kód angol nyelvű. | Átnézés |
| NFR-UX-2 | Minden adatokat megjelenítő képernyőnek van betöltési, üres, sikeres és hibaállapota. A destruktív műveletekhez megerősítés kell. | Képernyőképek, E2E tesztek |
| NFR-UX-3 | Az elrendezés 375 px szélességtől felfelé használható. | Kézi ellenőrzés |
| NFR-OPS-1 | Egy tiszta gépen pusztán a README alapján (Docker Compose-zal) el lehet jutni a klónozástól a futó alkalmazásig. | Dokumentált próbatelepítés tiszta környezetben |
| NFR-OPS-2 | Sémamódosítás csak Drizzle-migrációval történik; a kezdeti adatokat (seed) idempotens szkript tölti be. | CI / kézi |
| NFR-OPS-3 | Strukturált (JSON) szervernaplók az eseményfeldolgozásról és az ellenőrzésekről, az esemény- és a cégazonosítóval. | Átnézés |

---

## 9. Adatmodell (PostgreSQL, Drizzle)

A felhasználókat és a munkameneteket a Better Auth `users`, `sessions`, `accounts` és `verifications` táblái tárolják. A `users` tábla egy további oszloppal bővül (`is_platform_admin boolean default false`), amelyet a seed szkript állít be.

| Tábla | Fő oszlopok | Megszorítások és megjegyzések |
|---|---|---|
| `products` | id, slug, name, description, is_published, created_at | `slug` egyedi |
| `plans` | id, product_id → products, name, seat_count, duration_days (null = határozatlan idejű), price_huf, is_active | `seat_count > 0`, `duration_days IS NULL OR > 0`, `price_huf ≥ 0` |
| `companies` | id, name, description, created_at, deleted_at | logikai (soft) törlés |
| `memberships` | id, company_id, user_id, role (`owner`/`admin`/`member`), created_at | egyedi (company_id, user_id); részlegesen egyedi (company_id), ha role = owner |
| `invitations` | id, company_id, email, role, token_hash, employee_id?, invited_by, expires_at, accepted_at, revoked_at | `token_hash` egyedi |
| `orders` | id, company_id, plan_id, placed_by, price_huf (a vásárláskori ár), source (`purchase`/`manual`), created_at | |
| `license_keys` | id, order_id?, plan_id, key_hash, key_last4, status (`unredeemed`/`redeemed`/`revoked`), redeemed_company_id?, redeemed_at | `key_hash` egyedi |
| `licenses` | id, company_id, product_id, plan_id, license_key_id, seat_count, valid_from, valid_until?, status (`active`/`revoked`) | `license_key_id` egyedi |
| `seat_pools` | (company_id, product_id) PK, last_reconciled_at | a kiosztáshoz zárolt sor |
| `employees` | id, company_id, hr_id, email?, name?, job_role, status (`active`/`terminated`), state_as_of, last_event_id, membership_id? | egyedi (company_id, hr_id); a `membership_id` egyedi |
| `entitlement_rules` | id, company_id, product_id, job_role, created_by, created_at | egyedi (company_id, product_id, job_role) |
| `seat_assignments` | id, company_id, product_id, employee_id, status (`waiting`/`assigned`/`revoked`/`cancelled`), eligible_since, assigned_at?, ended_at?, end_reason?, cause_event_id?, cause_rule_id? | részlegesen egyedi (company_id, product_id, employee_id), ha a status értéke waiting vagy assigned; index: (company_id, product_id, status, eligible_since) |
| `hr_events` | id, company_id, event_id, type, hr_id, payload jsonb, payload_hash, occurred_at, received_at, source (`api`/`ui`), status (`pending`/`processed`/`stale`/`failed`), attempts, last_error, next_attempt_at, processed_at | egyedi (company_id, event_id); index: (status, next_attempt_at) |
| `api_keys` | id, company_id, name, prefix, key_hash, scopes text[], created_by, created_at, last_used_at, revoked_at | `key_hash` egyedi |
| `client_tokens` | id, user_id, name, prefix, token_hash, created_at, last_used_at, revoked_at | `token_hash` egyedi |
| `audit_log` | id, company_id?, actor_type (`user`/`api_key`/`system`), actor_id, action, target_type, target_id, reason, cause_event_id?, data jsonb, created_at | index: (company_id, created_at) |
| `license_checks` | id, user_id?, product_id?, company_id?, allowed, reason, created_at | mérésekhez, a CHK-4-hez és az S12-höz |

**Okkódok** (`end_reason`, `audit_log.reason`): `EMPLOYEE_TERMINATED`, `ROLE_NO_LONGER_ELIGIBLE`, `RULE_REMOVED`, `CAPACITY_REDUCED`, `LICENSE_EXPIRED`, `COMPANY_DELETED`. Hely kiosztásakor: `RULE_MATCHED`, `SEAT_FREED`, `CAPACITY_ADDED`.

**Kezdeti adatok (seed)** (`pnpm db:seed`, idempotens):
- egy platformadminisztrátor;
- 2 termék, termékenként 2–3 csomaggal;
- a *Példa Kft.* egy tulajdonossal, egy adminisztrátorral és 25 kitalált munkavállalóval, `developer`, `designer` és `accountant` munkakörben;
- a `developer → ide-pro` szabály és egy 20 helyes licenc;
- egy második cég az elkülönítési tesztekhez;
- egy API-kulcs és egy klienstoken, amelyeket a szkript a `tools/.env.local` fájlba ír (ez a fájl nem kerül verziókezelés alá).

---

## 10. Verifikáció

### 10.1 Tesztszintek

| Szint | Eszköz | Lefedett terület |
|---|---|---|
| Egységteszt | Vitest | `planPool` (minden ág; tulajdonságalapú teszt: assigned ≤ capacity, FIFO-sorrend), jogosultság, események elavultsága, zod sémák |
| Integrációs teszt | Vitest + valódi PostgreSQL (a Docker Compose tesztadatbázisa) | Eseményfeldolgozási lánc, keretzárolás, idempotencia, bérlők elkülönítése, a server actionök engedélyellenőrzése, API-végpontok |
| Végponttól végpontig tartó (E2E) teszt | Playwright | A fő felhasználói folyamatok: regisztráció → cég létrehozása → vásárlás → aktiválás → szabály létrehozása → a helyek megtekintése; meghívás; API-kulcs létrehozása |
| Forgatókönyv-alapú teszt | HR-szimulátor + demó kliens + az elvárt állapotot ellenőrző szkript | Az alábbi S1–S15 forgatókönyvek, a futó Compose stacken |
| Teljesítményteszt | Kis Node-szkript | NFR-PERF-1 és NFR-PERF-2 |

### 10.2 Rögzített forgatókönyvek és várt eredményeik

Minden forgatókönyv ismert kezdeti adatokból (seed) indul, és megadja a várt végállapotot. Ugyanezek a forgatókönyvek integrációs tesztként is futnak, és a parancssori eszközökkel be is mutathatók.

| Azonosító | Helyzet | Várt eredmény |
|---|---|---|
| S1 | 5 helyes licenc, `developer → ide-pro` szabály, 3 fejlesztő belép | 3 kiosztott, 2 szabad hely. Mindhárom fejlesztő ellenőrzése engedélyezett. |
| S2 | 20 hely, mind a 20 kiosztva fejlesztőknek. Belép a 21. fejlesztő. | A 21. `waiting` állapotú, az 1. pozícióban. Az ellenőrzése elutasított: `WAITLISTED`, pozíció: 1. |
| S3 | S2 + az 5. fejlesztő kilép | Az 5. helye visszavonva (`EMPLOYEE_TERMINATED`), a 21. helyet kap (`SEAT_FREED`), ugyanabban a tranzakcióban. Ellenőrzés: az 5. elutasított, a 21. engedélyezett. |
| S4 | 20 helyből 19 kiosztva. Két különböző fejlesztő belépési eseménye **párhuzamosan** érkezik. 100× megismételve. | Minden futásban pontosan 1 kiosztott és 1 várakozó. Soha nincs 20-nál több kiosztott hely. |
| S5 | Ugyanaz az esemény kétszer érkezik | A második válasz `duplicate`. A munkavállaló állapota, a helyek és az auditbejegyzések nem változnak. |
| S6 | Belépés T1-kor, kilépés T3-kor, majd megérkezik egy késői belépési esemény T2 időponttal (T1 < T2 < T3) | A késői esemény `stale`. A munkavállaló kilépett állapotban marad, hely nélkül. |
| S7 | Egy fejlesztő könyvelő lesz. Létezik `accountant → office-suite` szabály. | Az IDE Pro helye visszavonva (`ROLE_NO_LONGER_ELIGIBLE`), a felszabadult helyet a következő várakozó fejlesztő kapja. Az Office Suite-ra helyet kap, vagy várólistára kerül. |
| S8 | A `developer → ide-pro` szabály törlése | Az összes IDE Pro hely visszavonva (`RULE_REMOVED`), a várólista érvénytelenítve. Az ellenőrzések elutasítottak: `NOT_ELIGIBLE`. |
| S9 | Két licenc (10 + 10), 20 kiosztott hely. Az egyik licenc lejár. | A 10 legutoljára kiosztott hely visszavonva (`CAPACITY_REDUCED`); ezek a munkavállalók eredeti `eligibleSince` értékükkel visszakerülnek a várólistára. Az ellenőrzéseik azonnal, még a worker futása előtt elutasítottak. |
| S10 | Az A cég egyik felhasználója megnyitja B munkavállalóinak, szabályainak vagy auditnaplójának URL-jeit. A API-kulcsával B azonosítóit küldik. A egyik felhasználója olyan termékre kér ellenőrzést, amelyre csak B-nek van licence. | B oldalaira `404`. Az események csak A-ra hatnak. Az ellenőrzés elutasított. |
| S11 | Hibainjektálás a feldolgozás közben, a hely visszavonása után, de a commit előtt | Az esemény `failed`, az állapot változatlan. Az újrapróbálás után az állapot megegyezik az S3 eredményével. |
| S12 | Visszavonási késleltetés, N = 30 | A p50, p95 és maximális értékek a jelentésben. p95 ≤ 2 s. |
| S13 | Egy céges adminisztrátor, akinek nincs munkavállalói rekordja, ellenőrzést kér az IDE Pro-ra | Elutasított: `NOT_LINKED` (BR-01). |
| S14 | Ugyanaz az `eventId`, eltérő `jobRole` értékkel | `409 EVENT_ID_CONFLICT`, semmi nem változik. |
| S15 | Hibás formátumú események (hiányzó `hrId`, rossz `occurredAt`, ismeretlen `type`, túl nagy törzs) | `400`, semmi nem tárolódik. |

### 10.3 Összehasonlítás a kézi helykiosztással

Az S3 és az S7 esetében a dolgozat összeszámolja, hány kézi lépést igényelne egy adminisztrátortól a tisztán kézi helykiosztás: észrevenni a változást, megkeresni a helyet, visszavonni, kiválasztani a következő személyt, kiosztani neki a helyet. Ezután bemutatja, hogy ezek közül mely lépéseket végzi el a rendszer, és helyesen végzi-e el őket, valamint azt is, hogy mihez kell továbbra is ember: a szabályok megadásához és a kapacitás megvásárlásához.

### 10.4 Tesztjelentés

A jelentés a `docs/test-report.md` fájlban található, a Vitest és a Playwright által generált jelentésekkel együtt. Minden futásról rögzíti:

- a commit hash-ét, a dátumot és a környezetet (operációs rendszer, Node, PostgreSQL és Docker verziója);
- minden tesztesetnél: az előfeltételeket és az adatokat, a lépéseket, a várt és a tényleges eredményt, a sikerességet, valamint hivatkozást a naplóra, a jelentésre vagy a képernyőképre.

A nyitott hibákat a jelentés külön felsorolja.

### 10.5 Felhasználói elfogadási teszt (UAT)

| | |
|---|---|
| **Résztvevők** | 3–5 fő. Közülük legalább egy a valóságban is céges adminisztrációval vagy HR-rel foglalkozik (céges adminisztrátor szerepben), és legalább egy fejlesztő (a szoftvergyártó és az integrátor szerepében). A résztvevők valódi hátterét a dokumentáció rögzíti. A csak fejlesztők részvételével végzett teszt nem számít UAT-nak. |
| **Forgatókönyvek** | (A) Csomag vásárlása, aktiválása és szabályok beállítása egy csapat számára. (B) Egy belépés, egy munkakörváltás és egy kilépés kezelése, majd az idővonal alapján annak megmagyarázása, miért veszítette el valaki a hozzáférését. (C) Egy termék felvétele, majd a demó kliens futtatása, amelyen látszik a hozzáférés megadása és visszavonása. |
| **Gyűjtött adatok** | A feladat teljesítése (igen/nem), az időtartam, a hibák és az elakadási pontok, valamint egy rövid kérdőív. |
| **Eredmény** | `docs/uat.md` a megállapításokkal, az elvégzett javításokkal és az újratesztelés eredményeivel. |

### 10.6 A követelmények nyomonkövethetősége

A `docs/traceability.md` minden követelményazonosítóhoz megadja a kapcsolódó használati eseteket, a megvalósítást (fájl vagy modul), a teszteket (tesztazonosító vagy forgatókönyv) és az állapotot. Egy példasor:

| Követelmény | Használati eset | Megvalósítás | Tesztek | Állapot |
|---|---|---|---|---|
| SEAT-1 / BR-05 | UC-07, UC-09 | `lib/domain/allocation.ts`, `lib/services/pool.ts` | `allocation.test.ts`, S2, S3, S4 | ☐ |

---

## 11. Használati esetek

A leírások formája: szereplő · előfeltételek · fő folyamat · alternatívák és hibák · eredmény.

**UC-01 Regisztráció és bejelentkezés.** Látogató → Felhasználó. Fő folyamat: az űrlap kitöltése és elküldése, majd átirányítás a vezérlőpultra. Alternatívák: már regisztrált e-mail-cím; gyenge jelszó; mezőnként megjelenő validációs hibák. → AUTH-1, AUTH-2.

**UC-02 Cég létrehozása.** Felhasználó. Fő folyamat: a név és a leírás megadása, a felhasználó a cég tulajdonosa lesz. Alternatíva: üres név. → COMP-1.

**UC-03 Meghívás és elfogadás.** Tulajdonos vagy adminisztrátor → felhasználó. Előfeltétel: a meghívást küldő tulajdonos vagy adminisztrátor. Fő folyamat: az e-mail-cím és a szerepkör megadása, létrejön a meghívólink, a meghívott bejelentkezik és elfogadja a meghívót, létrejön a tagság (ha a meghívó munkavállalóhoz kötött, akkor ehhez a munkavállalóhoz kapcsolva). Alternatívák: lejárt, visszavont vagy már felhasznált token; a meghívott már tag; a meghívott elutasítja a meghívót. → COMP-4, COMP-5, EMP-4.

**UC-04 Csomag vásárlása (szimulált).** Tulajdonos vagy adminisztrátor. Fő folyamat: a csomag és a cég kiválasztása, megerősítés. Létrejön egy rendelés és egy kulcs; a kulcs egyszer jelenik meg, és igény szerint azonnal aktiválható. Alternatívák: a csomagot időközben inaktiválták; a felhasználó egyetlen cégben sem tulajdonos vagy adminisztrátor. → ORD-1, ORD-3.

**UC-05 Licenckulcs aktiválása.** Tulajdonos vagy adminisztrátor. Fő folyamat: a kulcs megadása. Létrejön egy licenc, a rendszer újraszámolja a keretet, a várakozó munkavállalók helyet kapnak. Alternatívák: ismeretlen, már felhasznált vagy visszavont kulcs. → ORD-2.

**UC-06 Szabály megadása.** Tulajdonos vagy adminisztrátor. Fő folyamat: a munkakör és a termék kiválasztása, mentés. A rendszer meghatározza a jogosult munkavállalókat, kiosztja nekik a helyeket vagy várólistára teszi őket, és megjeleníti az eredményt. Alternatívák: már létező szabály; licenc nélküli termék (megengedett: ilyenkor mindenki várólistára kerül, és a felület figyelmeztetést jelenít meg). → RULE-1.

**UC-07 Belépés feldolgozása.** HR-rendszer. Előfeltétel: érvényes API-kulcs. Fő folyamat: az esemény elküldése, `202` válasz, a munkavállaló létrejön vagy frissül, és helyet kap vagy várólistára kerül. Alternatívák: ismételt esemény (`200`), ütközés (`409`), elavult esemény (eltárolva, hatás nélkül), érvénytelen esemény (`400`), feldolgozási hiba (`failed`, újrapróbálás). → EMP-1, EMP-2, SEAT-1.

**UC-08 Munkakörváltás feldolgozása.** HR-rendszer. Az UC-07-hez hasonlóan, azzal a különbséggel, hogy a rendszer visszavonja a már nem indokolt helyeket, a felszabadult helyeket a várólistán következők kapják, az új jogosultságok pedig sorba állnak. → S7.

**UC-09 Kilépés feldolgozása.** HR-rendszer. Az UC-07-hez hasonlóan, azzal a különbséggel, hogy a rendszer minden helyet visszavon, a felszabadult helyeket FIFO szerint újraosztja, és az érintett személy következő ellenőrzése elutasító választ kap. → S3, S12.

**UC-10 Licencellenőrzés a kliensben.** Kliensalkalmazás. Előfeltétel: a felhasználó beállította a klienstokenjét. Fő folyamat: védett művelet előtt a kliens meghívja az ellenőrzést; ha engedélyezett, a művelet folytatódik, ha elutasított, a kliens kiírja az okot, és letiltja a műveletet. Alternatívák: visszavont token (`401`); hálózati hiba (a demó kliens ilyenkor a biztonságos irányba dönt, és letiltja a műveletet). → CHK-1.

**UC-11 Egy hozzáférési döntés kivizsgálása.** Tulajdonos vagy adminisztrátor. Fő folyamat: a munkavállaló, majd az idővonalának megnyitása; az idővonal minden kiosztásnál és visszavonásnál megmutatja az eseményt, a szabályt és az okot. → EMP-6, AUD-2.

**UC-12 Helyreállás sikertelen feldolgozás után.** Tulajdonos vagy adminisztrátor, illetve a worker. Fő folyamat: a HR-események listája megjeleníti a sikertelen eseményeket a hibákkal együtt; újrapróbálás; az állapot `processed` lesz; szükség esetén egyeztetés. → EMP-3, EMP-7, SEAT-4, S11.

**UC-13 API-kulcsok és klienstokenek kezelése.** Tulajdonos vagy adminisztrátor, illetve felhasználó. Fő folyamat: létrehozás (a kulcs vagy token egyszer jelenik meg), listázás, visszavonás. Alternatíva: a visszavont kulcs következő használatát a rendszer elutasítja. → KEY-1, CHK-2.

**UC-14 A katalógus kezelése.** Platformadminisztrátor. Fő folyamat: termék és csomagok létrehozása, közzététel. Alternatívák: érvénytelen helyszám, időtartam vagy ár. → ADM-1, ADM-2.

---

## 12. Felhasználói felület (képernyők)

A felhasználói felület magyar nyelvű. Minden képernyőnek van betöltési, üres, sikeres és hibaállapota (NFR-UX-2).

| Terület | Képernyők |
|---|---|
| Nyilvános | Katalógus · Termékoldal a csomagokkal · Bejelentkezés · Regisztráció |
| Felhasználó | Vezérlőpult (cégek, saját hozzáférések összesítése) · Szoftvereim (CHK-3) · Klienstokenek · Profil · Meghívó elfogadása |
| Cég | Áttekintés · Tagok és meghívók · Munkavállalók (lista + idővonal) · Szabályok (hatással) · Licencek és helyek (kapacitás, kiosztott, várakozó, lejárat) · Várólista termékenként · Vásárlás / kulcs aktiválása · API-kulcsok · HR-események · Ellenőrzések · Auditnapló · Beállítások (tulajdonos) |
| Platformadminisztrátor | Termékek és csomagok · Rendelések · Kulcs kiadása · Statisztika · Cégek · Globális auditnapló |

---

## 13. Architektúra és telepítés

### 13.1 Komponensek

```
┌────────────────┐  HTTPS/JSON ┌───────────────────────────────────────────┐
│ HR-szimulátor  │────────────►│ Next.js 16 alkalmazás                     │
│ (tools/)       │  API-kulcs  │  ├ UI (server components, server actions) │
└────────────────┘             │  ├ /api/v1/hr/*      /api/v1/license/*    │
┌────────────────┐ klienstoken │  ├ lib/domain  (tiszta logika: kiosztás)  │
│ Demó kliens    │────────────►│  ├ lib/services (tranzakciók, zárolás)    │
│ (tools/)       │             │  └ Better Auth (munkamenetek)             │
└────────────────┘             └───────────────┬───────────────────────────┘
                                               │ Drizzle ORM / pg
┌────────────────┐              ┌──────────────▼──────┐
│ Worker (tsx)   │─────────────►│ PostgreSQL 17       │
│ újrapróbálás,  │              └─────────────────────┘
│ lejárat,       │
│ egyeztetés     │
└────────────────┘
```

### 13.2 A repository szerkezete

```
app/                 Next.js útvonalak (felület + /api/v1)
components/          felületi komponensek (shadcn/ui)
db/                  schema.ts, drizzle.ts, seed.ts
drizzle/             migrációk
lib/domain/          tiszta üzleti logika (I/O nélkül)
lib/services/        tranzakciós szolgáltatások (események, keretek, vásárlások)
lib/api/             API-hitelesítés (API-kulcsok, klienstokenek), hibák leképezése
worker/              a háttérfolyamat (worker) belépési pontja
tools/hr-sim/        HR-szimulátor (parancssori program)
tools/demo-client/   demó kliens (parancssori program) + késleltetésmérő szkript
tests/unit, tests/integration, e2e/
docs/                SPEC.md, adr/, test-report.md, uat.md, traceability.md, ai-log.md, install.md
docker-compose.yml, Dockerfile, .env.example
```

### 13.3 Architektúra-döntések (ADR-ek, `docs/adr/`)

| ADR | Döntés | Mérlegelt alternatívák |
|---|---|---|
| 001 | Monolitikus Next.js alkalmazás, külön worker folyamattal | Különálló API-szolgáltatás; üzenetközvetítő (RabbitMQ) |
| 002 | A HR tényeket jelent, a licenckezelő ezekből vezeti le a helyeket | A HR közvetlenül osztja ki a helyeket |
| 003 | A keret sorának zárolása (`SELECT … FOR UPDATE`) a kapacitásinvariáns biztosítására | Serializable izolációs szint újrapróbálással; adatbázisbeli számláló + CHECK megszorítás; advisory lockok |
| 004 | A beérkező események táblája (`hr_events`) + azonnali feldolgozás + újrapróbálás a workerben | Teljesen szinkron feldolgozás a kérésen belül; külső üzenetsor |
| 005 | Az elavultság megállapítása munkavállalónként, az `occurredAt` alapján | A HR által adott, eseményenkénti sorszámok; a beérkezési sorrend szerinti felülírás (last-write-wins) |
| 006 | FIFO-várólista az `eligibleSince` alapján | Munkakör szerinti prioritás; kézi jóváhagyás |
| 007 | Kapacitáscsökkenéskor a legutoljára kiosztott helyek visszavonása | A legrégebben kiosztott helyek visszavonása; a lejárat felfüggesztése az adminisztrátor döntéséig |
| 008 | Kizárólag online ellenőrzés, gyorsítótár nélkül | Aláírt, lejárati idővel (TTL) rendelkező offline tokenek |
| 009 | (cég, termék) páronként összesített keret | Adott licenchez kötött helyek |
| 010 | Személyes klienstokenek a kliensalkalmazáshoz | OAuth device flow; helyenkénti aktiválókulcsok |
| 011 | A hely a munkavállalóé; a használatához összekapcsolt tagság kell | Kiosztás csak összekapcsolt fiókkal rendelkező munkavállalóknak |

### 13.4 Telepítés

A rendszer helyi Docker Compose stackben fut ([Q3](#14-döntések)). Szolgáltatásai: `db` (PostgreSQL 17), `app` (a Next.js production buildje), és `worker`.

```bash
cp .env.example .env
docker compose up -d --build
docker compose exec app pnpm db:mig
docker compose exec app pnpm db:seed
```

A README a `docs/install.md` útmutatóra hivatkozik, amely leírja az előfeltételeket (Docker; helyi fejlesztéshez Node 22 és pnpm), a konfigurációt, a naplókat, a hibaelhárítást, valamint az adatbázis mentését és visszaállítását (`pg_dump`/`pg_restore`). Az útmutató helyességét tiszta gépen elvégzett, dokumentált telepítés igazolja.

---

## 14. Döntések

Az alábbi táblázat a rendszer kialakítását meghatározó kérdéseket és a rájuk adott döntéseket foglalja össze.

| Kérdés | Döntés | Hivatkozás |
|---|---|---|
| **Q1** – Tartozhat-e egy termékhez több csomag? | Igen. Egy termékhez több csomag is tartozhat, mindegyiknek saját helyszáma és időtartama van (vagy határozatlan idejű). Ismétlődő számlázás nincs: a megújítás új csomag vásárlását jelenti. | §1.5, §3.1, ADM-2 |
| **Q2** – Hol helyezkedik el a HR-szimulátor és a demó kliens? | Ugyanabban a repositoryban, kis parancssori programként, a `tools/` könyvtárban (`tools/hr-sim`, `tools/demo-client`). | SIM-1, SIM-2, §13.2 |
| **Q3** – Milyen környezetben fut a telepített rendszer? | Helyi Docker Compose stackben; külön tesztszerverre nincs szükség. | §13.4, NFR-OPS-1 |
| **Q4** – Kaphat-e helyet olyan munkavállaló, akihez még nem kapcsolódik felhasználói fiók? | Igen. A hely a munkavállalóé, a rendszer fenntartja számára, de használni csak akkor lehet, ha a munkavállalóhoz tagság kapcsolódik; addig az ellenőrzések elutasító választ adnak. | [ADR-011](adr/011-seat-belongs-to-employee.md), BR-11, BR-18 |
| **Q5** – Kapacitáscsökkenéskor melyik helyeket vonja vissza a rendszer? | A legutoljára kiosztottakat, mert ez zavarja legkevésbé a régóta használó munkavállalókat. Az érintettek eredeti `eligibleSince` értékükkel kerülnek vissza a várólistára. | [ADR-007](adr/007-capacity-reduction-newest-first.md), BR-07, S9 |

---

## 15. Dokumentáció (a dolgozathoz)

A dolgozat önmagában is érthető, a részletek miatt a következő fájlokra hivatkozik:

- `docs/SPEC.md`: ez a dokumentum (követelmények, üzleti szabályok, interfészek)
- `docs/adr/*.md`: a §13.3 döntései
- `docs/install.md`: kipróbált telepítési és üzemeltetési útmutató
- `docs/test-report.md`, `docs/uat.md`, `docs/traceability.md`
- `docs/ai-log.md`: rövid, visszakövethető napló a mesterséges intelligencia segítségével végzett feladatokról (eszköz, feladat, az eredmény elfogadva, módosítva vagy elutasítva, az ellenőrzés módja)
- Valódi képernyőképek a fő folyamatokról, szerepkörökről és állapotokról (betöltés, üres, sikeres, hiba), a dolgozatban számozott képaláírással. A fő képek a fejezetekben, a többi a mellékletben szerepel. A képek nem tartalmaznak személyes adatot.
