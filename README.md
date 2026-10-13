# Licenckezelő

Vállalati szoftverlicencek kezelése munkakörök alapján. A szoftverforgalmazó helyalapú licenceket értékesít cégeknek,
a cégeken belül pedig a helyeket nem kézzel osztják ki: a rendszer a szabályokból (melyik munkakörnek melyik szoftver
jár) és a munkavállalók adataiból (belépés, munkakörváltás, kilépés) automatikusan kiosztja és visszaveszi őket.

Technológiák: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, PostgreSQL 17, Drizzle ORM, Better Auth.

## Követelmények

- [Docker](https://www.docker.com/) (Docker Desktop, vagy Docker Engine a Compose bővítménnyel)

## Telepítés és indítás

```bash
git clone https://github.com/kbalint7/szakdolgozat.git
cd szakdolgozat
cp .env.example .env
docker compose up -d --build
docker compose exec app pnpm db:mig
docker compose exec app pnpm db:seed
```

Az alkalmazás ezután a <http://localhost:3000> címen érhető el. Az első indítás a build miatt néhány percig tart.

A `.env` alapértékeivel az alkalmazás helyben rögtön működik. Ha nem csak kipróbálásra használod, a
`BETTER_AUTH_SECRET` értékét cseréld le egy véletlen szövegre (például `openssl rand -base64 32`).

Leállítás:

```bash
docker compose down      # az adatok megmaradnak
docker compose down -v   # az adatbázis is törlődik
```

## Demó fiókok

A `db:seed` parancs bemutató adatokat hoz létre: két terméket csomagokkal, két céget, munkavállalókat, szabályokat és
licenceket.

| E-mail | Jelszó | Szerep |
| --- | --- | --- |
| `admin@licenckezelo.test` | `Admin1234` | platformadmin: termékek, csomagok, rendelések, statisztika |
| `tulajdonos@pelda.test` | `Demo1234` | a _Példa Kft._ tulajdonosa |
| `admin@pelda.test` | `Demo1234` | a _Példa Kft._ adminisztrátora |
| `anna.kiss@pelda.test` | `Demo1234` | a _Példa Kft._ tagja és munkavállalója, van IDE Pro helye |
| `tulajdonos@masik.test` | `Demo1234` | a _Másik Zrt._ tulajdonosa |

## Kipróbálás

1. Jelentkezz be a `tulajdonos@pelda.test` fiókkal, és nyisd meg a **Termékek** oldalt.
2. Válassz egy csomagot, és vásárold meg a cégnek (a fizetés szimulált). Vásárláskor a licencet rögtön aktiválhatod,
   vagy a kapott licenckulcsot később a cég **Licencek és helyek** oldalán.
3. A helyeket a rendszer a cég szabályai szerint azonnal kiosztja. Ezt a **Licencek és helyek**, a
   **Munkavállalók** és az **Audit napló** oldalon követheted.

## Fejlesztés

Helyi fejlesztéshez Node.js 22 vagy újabb és pnpm kell (`corepack enable`). Az adatbázis ilyenkor is Dockerben fut:

```bash
cp .env.example .env
pnpm install
pnpm db:up
pnpm db:mig
pnpm db:seed
pnpm dev      # http://localhost:3000
pnpm worker   # külön terminálban: újrapróbálások, licenclejárat, egyeztetés
```
