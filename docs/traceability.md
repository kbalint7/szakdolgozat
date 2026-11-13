# Nyomonkövethetőségi mátrix

A [SPEC.md](SPEC.md) minden követelményéhez megadja a kapcsolódó használati esetet, a megvalósítást és az
ellenőrzés módját.

Állapot: ✅ megvalósítva, automatizált teszt fedi · ☑ megvalósítva, kézzel, átnézéssel (review) vagy méréssel
ellenőrizve (lásd [test-report.md](test-report.md)) · ⬜ nincs megvalósítva (opcionális, O prioritású
követelmény).

A tesztek helye: `unit/…` = `tests/unit`, `int/…` = `tests/integration`, `e2e/…` = `e2e`.

## Funkcionális követelmények

| Követelmény | Használati eset | Megvalósítás | Tesztek | Állapot |
|---|---|---|---|---|
| AUTH-1 regisztráció, jelszószabályok | UC-01 | `lib/validation/auth.ts`, `lib/auth/auth.ts` (before hook), `components/auth/register-form.tsx` | e2e/auth.spec.ts | ✅ |
| AUTH-2 be- és kijelentkezés, általános hibaüzenet | UC-01 | `components/auth/login-form.tsx`, `components/auth/auth-card.tsx`, `components/user-menu.tsx` (az oldalsáv alján, `components/shell/sidebar.tsx`) | e2e/auth.spec.ts | ✅ |
| AUTH-3 védett útvonalak | — | `proxy.ts`, `lib/auth/session.ts` (`requireUser`) | e2e/auth.spec.ts | ✅ |
| AUTH-4 profil, fiók törlése | — | `app/dashboard/profile`, `lib/services/companies.ts` (`deleteAccount`) | int/accounts-admin.test.ts | ✅ |
| AUTH-5 e-mail-cím megerősítése | — | — | — | ⬜ opcionális |
| CAT-1 katalógus | — | `app/(public)/products/page.tsx`, `lib/data/catalog.ts`, `lib/services/catalog.ts` | e2e/main-flow, e2e/responsive | ✅ |
| CAT-2 termékoldal, vásárlás | UC-04 | `app/(public)/products/[slug]/page.tsx` | e2e/main-flow.spec.ts | ✅ |
| CAT-3 keresés és szűrés | — | `app/(public)/products/page.tsx`, `components/filter-bar.tsx` | kézi (curl) | ☑ |
| ORD-1 szimulált vásárlás, a kulcs csak egyszer jelenik meg | UC-04 | `lib/services/orders.ts` (`purchasePlan`), `app/dashboard/purchase` | int/orders-invitations, e2e/main-flow | ✅ |
| ORD-2 kulcsaktiválás | UC-05 | `orders.ts` (`activateLicenseKey`), `licenses/activate-key-form.tsx` | int/orders-invitations | ✅ |
| ORD-3 vásárlás és aktiválás egy lépésben | UC-04 | `purchasePlan(…, { activate })` | e2e/main-flow.spec.ts | ✅ |
| ORD-4 rendelések és licencek | — | `companies/[companyId]/licenses/page.tsx`, `listCompanyLicenses` | e2e/main-flow (a keret sora), kézi | ✅ |
| ORD-5 automatikus lejárat | — | `pools.ts` (`expireLicenses`), `worker/index.ts`, BR-11 d a `lib/domain/license-check.ts` fájlban | int/scenarios S9 | ✅ |
| COMP-1 cég létrehozása | UC-02 | `companies.ts` (`createCompany`) | e2e/main-flow | ✅ |
| COMP-2 saját cégek | — | `listMyCompanies`, `app/dashboard/(home)/page.tsx`, `app/dashboard/dashboard-nav.tsx` (cégfa), `components/page-header.tsx` (morzsamenü a felettes oldalakhoz) | e2e/responsive (vezérlőpult) | ✅ |
| COMP-3 cég szerkesztése / törlése | — | `updateCompany`, `deleteCompany` (BR-19), `settings/page.tsx` | int/isolation (BR-19) | ✅ |
| COMP-4 meghívás | UC-03 | `lib/services/invitations.ts`, `members/invitation-forms.tsx` | int/orders-invitations, e2e/invitation | ✅ |
| COMP-5 meghívó elfogadása / elutasítása | UC-03 | `app/(auth)/invitations/[token]` | int/orders-invitations, e2e/invitation | ✅ |
| COMP-6 tag eltávolítása, kilépés a cégből | — | `removeMember`, `leaveCompany` | int/scenarios (BR-18), int/accounts-admin | ✅ |
| COMP-7 szerepkörök, a tulajdonjog átadása | — | `setMemberRole`, `transferOwnership`, `members/member-actions.tsx` | int/accounts-admin | ✅ |
| COMP-8 kézi összekapcsolás / leválasztás | — | `linkMemberToEmployee`, `unlinkEmployee`, `employees/[employeeId]/link-controls.tsx` | int (`linkedUser` fixture) | ✅ |
| EMP-1 HR-esemény API | UC-07 | `app/api/v1/hr/events/route.ts`, `hr-events.ts` (`ingestEvent`) | int/scenarios, tesztjelentés (curl) | ✅ |
| EMP-2 feldolgozás | UC-07–09 | `hr-events.ts` (`processEvent`) | int/scenarios S1–S11 | ✅ |
| EMP-3 beérkezett események (inbox) | UC-12 | `companies/[companyId]/events/page.tsx` (keresés; állapotfülek, amelyek összege kiadja a teljes darabszámot; külön szűrő az ismételt eseményekre; 25 sor és „Továbbiak betöltése”), `listHrEvents`, `countHrEventsByStatus` | kézi | ☑ |
| EMP-4 e-mail-címmel érkező belépés meghívót küld | UC-03 | `invitations.ts` (`onEmployeeHired`) | int/orders-invitations | ✅ |
| EMP-5 munkavállalók listája | — | `employees/page.tsx` (keresés és állapotfülek a `components/filter-bar.tsx` komponensben), `lib/services/employees.ts` (`listEmployees`, `countEmployeesByStatus`) | e2e/main-flow | ✅ |
| EMP-6 idővonal | UC-11 | `employees/[employeeId]/timeline.tsx` (döntésenként színes jelölők), `getEmployeeTimeline` | e2e/main-flow | ✅ |
| EMP-7 újrapróbálás | UC-12 | `lib/domain/hr-events.ts` (`nextAttemptAt`), `processDueEvents`, `retryEvent` | unit/hr-events, int/scenarios S11 | ✅ |
| EMP-8 kézzel rögzített események | — | `employees/manual-event-dialog.tsx`, `employees/actions.ts` | unit/validation-hr, e2e/main-flow | ✅ |
| EMP-9 teljes létszám (snapshot) szinkronizálása | — | `lib/domain/hr-snapshot.ts`, `hr-snapshot.ts`, `api/v1/hr/snapshot/route.ts` | unit/hr-snapshot, int/snapshot | ✅ |
| RULE-1 szabály létrehozása | UC-06 | `lib/services/rules.ts` (`createRule`), `rules/rule-form.tsx` | e2e/main-flow, int (minden forgatókönyv) | ✅ |
| RULE-2 szabály törlése a hatás bemutatásával | — | `deleteRule`, megerősítés a `rules/page.tsx` oldalon | int/scenarios S8 | ✅ |
| RULE-3 szabályok a hatásukkal együtt | — | `listRulesWithImpact` | kézi | ☑ |
| RULE-4 személyre szóló hozzáférés | — | — | — | ⬜ opcionális |
| SEAT-1 helykiosztás | UC-07–09 | `lib/domain/allocation.ts`, `lib/services/pools.ts` | unit/allocation (tulajdonságalapú tesztekkel együtt), int/scenarios | ✅ |
| SEAT-2 a keretek áttekintése | — | `lib/services/pool-queries.ts`, `licenses/page.tsx`, `components/seat-map.tsx` (`SeatMeter`: a keret egyetlen, közös ábrája, a vezérlőpulton és a cég áttekintő oldalán is ez jelenik meg) | e2e/main-flow | ✅ |
| SEAT-3 várólista | — | `licenses/[productId]/page.tsx`, `waitlistPositions` | unit/allocation, kézi | ☑ |
| SEAT-4 egyeztetés (helyek újraszámolása) | UC-12 | `reconcileCompany`, worker, „Helyek újraszámolása” gomb a *Licencek és helyek* oldalon | int/reconcile | ✅ |
| SEAT-5 párhuzamosság | — | a keret sorzára, a cég sorának megosztott zárja (ADR-003) | int/concurrency S4 ×100 | ✅ |
| CHK-1 ellenőrző végpont | UC-10 | `app/api/v1/license/check/route.ts`, `lib/domain/license-check.ts`, `lib/services/license-check.ts` | unit/license-check, int/scenarios | ✅ |
| CHK-2 klienstokenek | UC-13 | `lib/services/client-tokens.ts`, `app/dashboard/tokens` | int (fixture), kézi | ✅ |
| CHK-3 szoftvereim | — | `getMySoftware`, `app/dashboard/software` | kézi | ☑ |
| CHK-4 legutóbbi ellenőrzések | — | `listRecentChecks`, `countChecksByResult`, `companies/[companyId]/checks` (keresés és eredményfülek) | kézi | ☑ |
| KEY-1 API-kulcsok | UC-13 | `lib/services/api-keys.ts`, `api-keys/page.tsx` | int/isolation, e2e/main-flow | ✅ |
| KEY-2 jogosultsági körök (scope-ok) | — | `lib/api/auth.ts` (`requireApiKey`) | int/accounts-admin | ✅ |
| AUD-1 minden változás naplózása | UC-11 | `lib/services/audit.ts`, minden szolgáltatási tranzakció meghívja | int/scenarios S5, S11 (darabszámok) | ✅ |
| AUD-2 a cég auditnaplója | UC-11 | `companies/[companyId]/audit`, `components/audit/audit-filters.tsx` (művelettípus, HR-azonosító, időszak), `components/audit/audit-table.tsx` (a tények közérthetően megfogalmazva, a kódok a „Technikai részletek” mögött), `lib/services/audit-queries.ts`, `lib/audit-page.ts` | kézi | ☑ |
| AUD-3 globális auditnapló | — | `app/admin/audit` | kézi | ☑ |
| ADM-1 termékek | UC-14 | `app/admin/products`, `catalog.ts` | int (fixture-ök), kézi | ✅ |
| ADM-2 csomagok | UC-14 | `plan-dialog.tsx`, `lib/validation/catalog.ts`, adatbázis-szintű CHECK megszorítások | int/orders-invitations (inaktív csomag) | ✅ |
| ADM-3 rendelések listája | — | `app/admin/orders`, `listAllOrders` | kézi | ☑ |
| ADM-4 kézzel kiadott kulcsok | — | `issueManualKey`, `admin/orders/issue-key-form.tsx` | int/accounts-admin | ✅ |
| ADM-5 a cégek áttekintése | — | `app/admin/companies`, `listAllCompanies` | kézi | ☑ |
| ADM-6 értékesítési statisztika | — | `app/admin/stats`, `lib/services/sales.ts` | kézi | ☑ |
| SIM-1 HR-szimulátor | — | `tools/hr-sim` | kézi futtatások (tesztjelentés) | ☑ |
| SIM-2 demókliens | UC-10 | `tools/demo-client/index.ts` | kézi futtatások | ☑ |
| SIM-3 késleltetésmérés | — | `tools/demo-client/latency.ts` | mérés (S12) | ☑ |

## Üzleti szabályok

| Szabály | Megvalósítás | Tesztek |
|---|---|---|
| BR-01 szerepkör ≠ használati jog | `decideCheck` (`NOT_LINKED`) | unit/license-check, int S13 |
| BR-02 jogosultság | `lib/domain/eligibility.ts`, a `recomputePool` lekérdezése | unit/permissions, int S1, S7 |
| BR-03 kapacitás | `lib/domain/capacity.ts` | unit/capacity |
| BR-04 invariáns | a keret zárolása, utólagos ellenőrzés, részleges egyedi index | unit (tulajdonságalapú), int S4, int BR-04 |
| BR-05 FIFO | `compareWaitlist`, a `planPool` 4. lépése | unit/allocation, int S2 |
| BR-06 ugyanabban a tranzakcióban | `processEvent` / `deleteRule` → `recomputePool` | int S3 (ugyanaz a kiváltó esemény), S8 |
| BR-07 a legújabb először | `compareSeniority`, a `planPool` 3. lépése | unit S9, int S9 |
| BR-08 idempotencia | `ingestEvent` (egyedi kulcs + a tartalom hash-e) | int S5, S14 |
| BR-09 elavultság | `isStale`, `applyEvent` | unit/hr-events, int S6, int/snapshot |
| BR-10 létrehozás vagy frissítés (upsert) | `nextEmployeeState`, `applyEvent` | unit/hr-events, int BR-10 |
| BR-11 ellenőrzés | `decideCheck`, SQL-rangsorok a `seatsOfUser` függvényben | unit/license-check, int S1–S3, S9, S13 |
| BR-12 soha nincs gyorsítótárazva | `Cache-Control: no-store`, nincs `use cache` az ellenőrzés útvonalán | kódátnézés, késleltetésmérés |
| BR-13 egyetlen tulajdonos | részleges egyedi index, `leaveCompany`, `transferOwnership`, `deleteAccount` | int/accounts-admin |
| BR-14 a kulcs csak egyszer használható | `redeemKey` (`FOR UPDATE`, állapot) | int/orders-invitations |
| BR-15 bérlők elkülönítése | `getCompanyContext`, `authorizeCompanyAction`, cégre szűkített lekérdezések | int/isolation |
| BR-16 újbóli belépés | új sor `ENQUEUE` esetén | int BR-16 |
| BR-17 szabályváltozások | `createRule` (eligibleSince = a szabály létrehozásának ideje), `deleteRule` (`RULE_REMOVED`) | int S8, e2e/main-flow |
| BR-18 tagság megszüntetése | FK `ON DELETE SET NULL`, az ellenőrzés `NOT_MEMBER`/`NOT_LINKED` választ ad | int BR-18 |
| BR-19 logikai törlés (soft delete) | `deleteCompany` | int/isolation |

## Nem funkcionális követelmények

| Követelmény | Megvalósítás | Ellenőrzés | Állapot |
|---|---|---|---|
| NFR-SEC-1 elkülönítés, jogosultság-ellenőrzés az adatbázisból olvasva | `lib/auth/company.ts`, kikapcsolt cookie-gyorsítótár a `lib/auth/auth.ts` fájlban | int/isolation | ✅ |
| NFR-SEC-2 hash-elt titkok, konstans idejű összehasonlítás | `lib/crypto.ts` (`sha256`, `hashesEqual`) | int/orders-invitations, kódátnézés | ✅ |
| NFR-SEC-3 zod-validálás minden rendszerhatáron | `lib/validation/*`, `lib/domain/hr-events.ts`, API-útvonalak | unit/hr-events (az S15 sémaesetei) | ✅ |
| NFR-SEC-4 nincs titok a tárolóban | `.env.example`, a git által figyelmen kívül hagyott `.env*` és `tools/.env.local` | kódátnézés (`git grep`) | ☑ |
| NFR-SEC-5 jelszóhash-elés és kéréskorlátozás a Better Authtal | `lib/auth/auth.ts` (`rateLimit`) | a konfiguráció átnézése | ☑ |
| NFR-REL-1 nincs túlosztás, ×100 | ADR-003 | int/concurrency | ✅ |
| NFR-REL-2 atomi feldolgozás | egyetlen tranzakció + külön tranzakció a hiba rögzítésére | int S11 | ✅ |
| NFR-REL-3 az egyeztetés idempotens, és ugyanazt adja, mint a növekményes feldolgozás | `reconcileCompany` | int/reconcile (tulajdonságalapú) | ✅ |
| NFR-PERF-1 visszavonás p95 ≤ 2 s | ADR-004, ADR-008 | `pnpm latency` (tesztjelentés) | ☑ |
| NFR-PERF-2 ellenőrzés p95 ≤ 200 ms 20 kliens mellett | indexelt lekérdezések, gyorsítótár nélkül | `pnpm load-test` (tesztjelentés) | ☑ |
| NFR-UX-1 magyar felület, angol API | `lib/i18n/*`, `z.config(hu)`, `englishErrors` az API-khoz; a felület szövegei fogalmanként egyetlen szót és egységes hangnemet használnak (MI-napló: a felület újratervezése) | a felület összes szövegének átnézése (MI-napló: a felület újratervezése); e2e (magyar szövegek) | ✅ |
| NFR-UX-2 betöltési, üres, sikeres és hibaállapotok, megerősítések | minden oldal mellett egy `loading.tsx` (az az oldal, amely alatt további útvonalak vannak, route groupban áll, így a betöltési állapota sosem jelenik meg egy másik oldal helyett), valamint a nyilvános oldalak beágyazott `Suspense`-tartalékai, mindegyik az oldal saját elrendezési komponenseiből és a `components/page-skeleton.tsx` blokkjaiból felépítve; a szerepkörtől függő oldal a szerepkör alapján választja ki a vázát (cég áttekintő oldala: az oldalon belül, a cím alatt; cégbeállítások: az oldalsáv által jelzett szerepkör alapján, `components/shell/viewer-role.tsx`); `components/empty-state.tsx` és `EmptyRow` a `components/table-card.tsx` fájlban; `error.tsx` (`components/error-state.tsx`) és a zsákutca-képernyők a `components/message-screen.tsx` fájlban; az `ActionButton` / `RowAction` megerősítést kér; állapotszínek a `components/status-badge.tsx` fájlban | átnézés; minden betöltési állapot blokkonkénti összevetése a betöltött oldallal 1440 és 390 px szélességen; e2e (megerősítő párbeszédablakok); képernyőképek a dolgozat 5. fejezetében | ☑ |
| NFR-UX-3 375 px | `components/shell/app-shell.tsx` (oldalsáv `md` mérettől, fejlécsáv nélkül), `components/shell/mobile-nav.tsx` (kihúzható panel, alján a fiókkal), `components/site-menu.tsx` (nyilvános menü); keskeny képernyőn a táblázatok megtartják a megnevező cellájukat egy második sorral kiegészítve (`components/meta-line.tsx`), a másodlagos oszlopokat pedig elrejtik; `md`/`lg` mérettől felfelé rögzített az elrendezésük, így egyetlen oszlop sem mozdul el, amikor a sorok változnak, és csak végső esetben görgethetők a `data-slot=table-container` elemen belül | e2e/responsive.spec.ts | ✅ |
| NFR-OPS-1 a klónozástól a futó alkalmazásig | `docs/install.md`, `Dockerfile`, `docker-compose.yml` | Compose-futtatás a fejlesztői gépen; tiszta gépes próbatelepítés: még nem készült el | ☑ |
| NFR-OPS-2 migrációk, idempotens kezdeti adatok (seed) | `drizzle/`, `db/migrate.ts`, `db/seed.ts` | a seed újrafuttatása, az E2E-tesztek előkészítése | ✅ |
| NFR-OPS-3 JSON-naplók | `lib/logger.ts` | kódátnézés | ☑ |
