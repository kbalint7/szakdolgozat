import {
  ArrowRightIcon,
  CheckCircle2Icon,
  FileClockIcon,
  KeyRoundIcon,
  ListChecksIcon,
  MonitorCheckIcon,
  ScaleIcon,
  ShieldCheckIcon,
  UsersIcon,
} from 'lucide-react';

import { LinkButton } from '@/components/link-button';

const steps = [
  {
    icon: <KeyRoundIcon />,
    title: 'Vásárlás és aktiválás',
    text: 'Kiválasztod a csomagot, kapsz egy licenckulcsot, és aktiválod a cégednél. Ennyi hely áll majd rendelkezésre az adott szoftverből.',
  },
  {
    icon: <ListChecksIcon />,
    title: 'Munkakörönként adsz hozzáférést',
    text: 'Nem embereknek, hanem munkaköröknek osztasz szoftvert: például minden fejlesztőnek jár az IDE Pro.',
  },
  {
    icon: <UsersIcon />,
    title: 'Követi a változásokat',
    text: 'A HR-rendszer jelzi, ha valaki belép, munkakört vált vagy kilép. A helyek ennek megfelelően maguktól átrendeződnek.',
  },
  {
    icon: <MonitorCheckIcon />,
    title: 'A szoftver ellenőriz',
    text: 'A szoftver használat közben megnézi, hogy a felhasználónak van-e érvényes helye. Aki elveszíti a helyét, azonnal nem tudja tovább használni.',
  },
];

const guarantees = [
  {
    icon: <ScaleIcon />,
    title: 'Soha nincs túlosztás',
    text: 'Nem osztunk ki több helyet, mint amennyit megvettél. Ha kevés a hely, a jogosultak érkezési sorrendben várólistára kerülnek.',
  },
  {
    icon: <ShieldCheckIcon />,
    title: 'Nem vesznek el és nem keverednek össze az adatok',
    text: 'Ha egy változás kétszer érkezik, nem történik semmi; ha egy régi változás késve jön, nem írja felül az újabbat; ha hiba történik, a rendszer újrapróbálja.',
  },
  {
    icon: <FileClockIcon />,
    title: 'Minden döntés visszakereshető',
    text: 'A munkavállaló idővonalán látod, mikor és miért kapott vagy veszített el egy helyet.',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_80%_-10%,--theme(--color-primary/14%),transparent_70%)]"
        />
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16 sm:py-24">
          <div className="max-w-3xl space-y-6">
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Vállalati szoftverlicencek, kézi kiosztás nélkül
            </h1>
            <p className="max-w-2xl text-lg text-pretty text-muted-foreground">
              Vedd meg a helyeket, mondd meg, melyik munkakörnek milyen szoftver jár, a többit a rendszer intézi:
              kiosztja a helyeket, kezeli a várólistát, és visszaveszi a helyet attól, akinek már nem jár.
            </p>
            <div className="flex flex-wrap gap-3">
              <LinkButton href="/products" size="lg">
                Termékek böngészése{' '}
                <ArrowRightIcon
                  data-icon="inline-end"
                  className="transition-transform group-hover/button:translate-x-0.5"
                />
              </LinkButton>
              <LinkButton href="/register" size="lg" variant="outline">
                Fiók létrehozása
              </LinkButton>
            </div>
          </div>
          <ul className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm text-muted-foreground sm:grid-cols-3">
            {[
              'Nem kell kézzel licencet osztani',
              'Igazságos sorrend, ha kevés a hely',
              'Aki kilép, azonnal elveszíti a hozzáférést',
            ].map(item => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2Icon className="size-4 text-success" aria-hidden /> {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="hogyan-mukodik" className="scroll-mt-20 border-b">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-medium tracking-wide text-primary uppercase">Hogyan működik?</div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Négy lépés a vásárlástól a használatig
            </h2>
            <p className="text-pretty text-muted-foreground">
              A helyeket nem kézzel osztod ki: a szabályaidból és a HR-rendszer adataiból következnek.
            </p>
          </div>
          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="flex flex-col gap-3 rounded-xl bg-card p-5 shadow-card ring-1 ring-foreground/8"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-4">
                    {step.icon}
                  </span>
                  <span className="nums text-xs font-medium text-muted-foreground">{index + 1}. lépés</span>
                </div>
                <h3 className="font-medium">{step.title}</h3>
                <p className="text-sm text-pretty text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b bg-muted/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-medium tracking-wide text-primary uppercase">Megbízhatóság</div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Amire számíthatsz</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {guarantees.map(item => (
              <div key={item.title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-card text-primary shadow-card ring-1 ring-foreground/8 [&_svg]:size-5">
                  {item.icon}
                </span>
                <div className="space-y-1">
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-sm text-pretty text-muted-foreground">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto w-full max-w-6xl px-4 py-16">
          <div className="flex flex-col items-start gap-4 rounded-2xl bg-primary px-6 py-8 text-primary-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight">Próbáld ki</h2>
              <p className="text-sm text-pretty text-primary-foreground/80">
                Hozz létre egy céget, vásárolj egy csomagot, és nézd meg, hogyan kapnak helyet a munkatársaid.
              </p>
            </div>
            <LinkButton href="/register" variant="secondary" size="lg" className="shrink-0">
              Regisztráció <ArrowRightIcon data-icon="inline-end" />
            </LinkButton>
          </div>
        </div>
      </section>
    </div>
  );
}
