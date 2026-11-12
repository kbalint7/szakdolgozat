import { cn } from 'cn';
import { ArmchairIcon, ArrowRightIcon, HourglassIcon, InboxIcon, XIcon } from 'lucide-react';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { LinkButton } from '@/components/link-button';
import { SkeletonButton, SkeletonText } from '@/components/page-skeleton';
import { MetaLine } from '@/components/meta-line';
import { SeatMeter } from '@/components/seat-map';
import { StatusBadge } from '@/components/status-badge';
import { WithReason } from '@/components/with-reason';
import { getSession } from '@/lib/auth/session';

const surface = 'rounded-xl bg-card shadow-card ring-1 ring-border';

function EventHead({
  type,
  meta,
  badge,
  muted = false,
}: {
  type: string;
  meta: string[];
  badge?: string;
  muted?: boolean;
}) {
  return (
    <div className="flex gap-3.5">
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full',
          muted ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary',
        )}
      >
        <InboxIcon className="size-4" />
      </span>
      <div className="min-w-0 pt-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="font-medium">HR-esemény: {type}</span>
          {badge && <StatusBadge tone="neutral">{badge}</StatusBadge>}
        </div>
        <MetaLine className="mt-0.5 text-xs leading-4" items={meta} />
      </div>
    </div>
  );
}

const decisionTones = {
  granted: { icon: <ArmchairIcon />, classes: 'text-success' },
  revoked: { icon: <XIcon />, classes: 'text-destructive' },
  queued: { icon: <HourglassIcon />, classes: 'text-warning' },
};

function Decision({
  tone,
  reason,
  children,
}: {
  tone: keyof typeof decisionTones;
  reason?: string;
  children: React.ReactNode;
}) {
  const { icon, classes } = decisionTones[tone];
  return (
    <li className="flex gap-2.5">
      <span className={cn('mt-0.5 flex shrink-0 [&_svg]:size-4', classes)}>{icon}</span>
      <WithReason className="min-w-0" reason={reason}>
        {children}
      </WithReason>
    </li>
  );
}

function Pool({
  name,
  assigned,
  capacity,
  waiting = 0,
  children,
}: {
  name: string;
  assigned: number;
  capacity: number;
  waiting?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 p-5">
      <span className="font-semibold tracking-tight">{name}</span>
      <SeatMeter assigned={assigned} capacity={capacity} waiting={waiting} label={name} />
      <ul className="text-[13px]">{children}</ul>
    </div>
  );
}

function HeroFigure() {
  return (
    <figure className="min-w-0 rounded-2xl bg-muted/60 bg-[radial-gradient(var(--input)_1px,transparent_1px)] bg-size-[18px_18px] p-4 ring-1 ring-border sm:p-6 lg:mt-2">
      <figcaption className="sr-only">
        A HR-rendszer jelzi, hogy Kiss Anna fejlesztőként belépett. A fejlesztőknek jár az IDE Pro, ezért Anna rögtön
        helyet kap. Az Office Suite minden helye foglalt, arra ketten várnak.
      </figcaption>
      <div aria-hidden className="text-sm">
        <div className={cn(surface, 'px-4 py-3.5')}>
          <EventHead type="Belépés" meta={['Kiss Anna', 'developer', 'HR-rendszer', '09:14:02']} />
        </div>
        <div className="ml-8 flex items-center border-l border-dashed border-muted-foreground/40 py-3.5">
          <span className="h-px w-5 border-t border-dashed border-muted-foreground/40" />
          <span className={cn(surface, 'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px]')}>
            <span className="text-muted-foreground">Szabály</span>
            <span className="font-medium">developer</span>
            <ArrowRightIcon className="size-3.5 text-muted-foreground" />
            <span className="font-medium">IDE Pro</span>
          </span>
        </div>
        <div className={cn(surface, 'divide-y divide-border/70')}>
          <Pool name="IDE Pro" assigned={19} capacity={20}>
            <Decision tone="granted" reason="a munkaköréhez jár">
              Kiss Anna helyet kapott
            </Decision>
          </Pool>
          <Pool name="Office Suite" assigned={10} capacity={10} waiting={2}>
            <Decision tone="queued">Ketten várnak. A következő szabad helyet az kapja, aki régebb óta vár.</Decision>
          </Pool>
        </div>
      </div>
    </figure>
  );
}

function TimelineFigure() {
  return (
    <figure className={cn(surface, 'min-w-0 p-5 text-sm sm:p-6')}>
      <figcaption className="sr-only">
        Nagy Bence kilép, ezért felszabadul a helye az Office Suite-ban, és a várólista első embere kapja meg. Ha
        ugyanaz az esemény másodszor is megérkezik, már nem változik semmi.
      </figcaption>
      <ol aria-hidden className="flex flex-col">
        <li className="relative pb-7 before:absolute before:top-9 before:bottom-1 before:left-4 before:w-px before:bg-border">
          <EventHead type="Kilépés" meta={['Nagy Bence', 'accountant', 'HR-rendszer', '08:30:11']} />
          <ul className="mt-3 flex flex-col gap-2 pl-[2.875rem]">
            <Decision tone="revoked" reason="kilépett">
              Office Suite: Nagy Bence elvesztette a helyét
            </Decision>
            <Decision tone="granted" reason="felszabadult egy hely">
              Office Suite: Halász Nóra helyet kapott
            </Decision>
          </ul>
        </li>
        <li>
          <EventHead muted type="Kilépés" badge="Többször érkezett" meta={['Nagy Bence', 'HR-rendszer', '08:30:14']} />
          <p className="mt-3 pl-[2.875rem] text-muted-foreground">
            Ezt az eseményt már feldolgoztuk, ezért nem változott semmi.
          </p>
        </li>
      </ol>
    </figure>
  );
}

const steps = [
  {
    title: 'Megveszed a helyeket',
    text: 'Kiválasztasz egy csomagot, és a kapott licenckulcsot aktiválod a cégednél. A csomag mondja meg, hány ember használhatja a szoftvert.',
  },
  {
    title: 'Munkakörhöz rendeled',
    text: 'Nem egyenként osztod ki a szoftvert, hanem megadod, melyik munkakörnek jár. Például minden fejlesztőnek az IDE Pro.',
  },
  {
    title: 'A HR-rendszer jelez',
    text: 'Ha valaki belép, munkakört vált vagy kilép, a HR-rendszered szól nekünk, és a helyeket ehhez igazítjuk.',
  },
  {
    title: 'A szoftver rákérdez',
    text: 'A szoftver használat közben megnézi, van-e helye annak, aki dolgozik vele. Akinek már nincs, az nem tudja tovább használni.',
  },
];

const stepGroups = [
  { label: 'Egyszer beállítod', from: 0 },
  { label: 'Utána magától megy', from: 2 },
];

const answers = [
  {
    title: 'Ha elfogy a hely',
    text: 'Nem osztunk ki több helyet, mint amennyit megvettél. Akinek nem jut, várólistára kerül, és a felszabaduló helyet mindig az kapja, aki a legrégebb óta vár.',
  },
  {
    title: 'Ha egy esemény kétszer vagy késve érkezik',
    text: 'Amit kétszer kapunk meg, azt csak egyszer vesszük figyelembe. Egy késve érkező, régebbi esemény nem írja felül az újabbat. Ha valamit nem sikerül feldolgozni, újra megpróbáljuk.',
  },
  {
    title: 'Ha tudni akarod, miért',
    text: 'Minden munkavállaló idővonalán látod, mikor és miért kapott vagy veszített el helyet.',
  },
];

async function HeroSecondaryAction() {
  await connection();
  const session = await getSession();
  return session ? null : (
    <LinkButton href="/register" size="lg" variant="outline" className="px-3.5">
      Regisztráció
    </LinkButton>
  );
}

const closing = {
  visitor: {
    title: 'Próbáld ki a saját cégeddel',
    text: 'Hozz létre egy céget, vásárolj egy csomagot, és nézd meg, hogyan kapnak helyet a munkatársaid.',
    href: '/register',
    action: 'Regisztráció',
  },
  member: {
    title: 'Folytasd, ahol abbahagytad',
    text: 'A cégeid, a helyek és a várólisták a vezérlőpulton várnak.',
    href: '/dashboard',
    action: 'Vezérlőpult',
  },
};

async function Closing() {
  await connection();
  const { title, text, href, action } = closing[(await getSession()) ? 'member' : 'visitor'];
  return (
    <>
      <div className="max-w-2xl space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h2>
        <p className="text-pretty text-muted-foreground">{text}</p>
      </div>
      <LinkButton href={href} size="lg" className="px-3.5">
        {action}{' '}
        <ArrowRightIcon data-icon="inline-end" className="transition-transform group-hover/button:translate-x-0.5" />
      </LinkButton>
    </>
  );
}

function ClosingSkeleton() {
  const { title, text, action } = closing.visitor;
  return (
    <>
      <div className="max-w-2xl space-y-2">
        <div className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          <SkeletonText>{title}</SkeletonText>
        </div>
        <p className="text-pretty">
          <SkeletonText>{text}</SkeletonText>
        </p>
      </div>
      <SkeletonButton size="lg" className="gap-1.5 px-3.5 pr-2">
        {action} <span className="size-4" />
      </SkeletonButton>
    </>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section>
        <div className="mx-auto grid w-full max-w-6xl items-start gap-x-16 gap-y-12 px-4 py-14 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,35rem)]">
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl sm:leading-[1.08]">
              Vállalati szoftverlicencek, kézi kiosztás nélkül
            </h1>
            <p className="max-w-xl text-lg text-pretty text-muted-foreground">
              Megmondod, melyik munkakörnek milyen szoftver jár, a többit elvégezzük helyetted. Aki belép, helyet kap.
              Aki kilép, annak felszabadul a helye. Ha elfogy a hely, várólistát vezetünk.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <LinkButton href="/products" size="lg" className="px-3.5">
                Termékek böngészése{' '}
                <ArrowRightIcon
                  data-icon="inline-end"
                  className="transition-transform group-hover/button:translate-x-0.5"
                />
              </LinkButton>
              <Suspense
                fallback={
                  <SkeletonButton size="lg" className="px-3.5">
                    Regisztráció
                  </SkeletonButton>
                }
              >
                <HeroSecondaryAction />
              </Suspense>
            </div>
          </div>
          <HeroFigure />
        </div>
      </section>

      <section id="hogyan-mukodik" className="scroll-mt-14 border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 sm:py-20">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Hogyan működik?</h2>
            <p className="text-pretty text-muted-foreground">
              Négy lépés a vásárlástól a használatig, és csak az első kettő a te dolgod.
            </p>
          </div>
          <div className="grid gap-x-12 gap-y-10 lg:grid-cols-2">
            {stepGroups.map(group => (
              <div key={group.label} className="flex flex-col gap-5">
                <div className="border-b pb-2.5 text-sm font-medium text-muted-foreground">{group.label}</div>
                <ol start={group.from + 1} className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                  {steps.slice(group.from, group.from + 2).map((step, index) => (
                    <li key={step.title} className="space-y-1.5">
                      <div className="nums text-sm font-medium text-primary">{group.from + index + 1}.</div>
                      <h3 className="font-semibold tracking-tight">{step.title}</h3>
                      <p className="text-sm/relaxed text-pretty text-muted-foreground">{step.text}</p>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/40">
        <div className="mx-auto grid w-full max-w-6xl items-start gap-x-16 gap-y-10 px-4 py-16 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,33rem)]">
          <div className="flex flex-col gap-8">
            <h2 className="max-w-md text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              A kényes helyzetekre is felkészültünk
            </h2>
            <dl className="flex flex-col gap-6">
              {answers.map(answer => (
                <div key={answer.title} className="space-y-1.5">
                  <dt className="font-semibold tracking-tight">{answer.title}</dt>
                  <dd className="max-w-xl text-sm/relaxed text-pretty text-muted-foreground">{answer.text}</dd>
                </div>
              ))}
            </dl>
          </div>
          <TimelineFigure />
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:py-20">
          <Suspense fallback={<ClosingSkeleton />}>
            <Closing />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
