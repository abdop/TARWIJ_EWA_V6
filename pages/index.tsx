import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { RootState } from '../src/store';

const HashConnectButton = dynamic(
  () => import('../src/components/HashConnectButton'),
  { ssr: false }
);

const ROLE_ROUTES: Record<string, string> = {
  platform_admin: '/platform-admin',
  ent_admin: '/ent-admin',
  decider: '/decider',
  employee: '/employee',
  shop_admin: '/shop-admin',
  cashier: '/cashier',
  collaborator: '/collaborator',
  user: '/user',
};

const ROLE_LABELS: Record<string, string> = {
  platform_admin: 'the TARWIJ EWA platform admin workspace',
  ent_admin: 'the enterprise admin console',
  decider: 'the decision queue',
  employee: 'the employee home',
  shop_admin: 'the shop admin portal',
  cashier: 'the point-of-sale console',
  collaborator: 'the collaborator tools',
  user: 'your dashboard',
};

const storyMilestones = [
  {
    title: 'Payroll, without the wait',
    description:
      'Employees who face unexpected expenses can unlock a portion of their earned wages instantly, without disrupting payroll operations.',
  },
  {
    title: 'Clear approvals for every advance',
    description:
      'Multi-role approvals and automated Hedera smart contracts ensure every wage release is transparent and auditable.',
  },
  {
    title: 'Repayments that fit real lives',
    description:
      'Repayment plans settle automatically on payday, keeping employees on track without paperwork or surprise fees.',
  },
];

const employeeBenefits = [
  {
    label: 'Financial breathing room',
    detail: 'Access earned wage advances 24/7 to handle life’s surprises before they spiral.',
  },
  {
    label: 'No hidden costs',
    detail: 'Predictable fees, transparent schedules, and real-time status updates build trust.',
  },
  {
    label: 'Guided by their employer',
    detail: 'Each advance is backed by HR, Payroll, and enterprise treasury policies stitched into the platform.',
  },
];

const platformPillars = [
  {
    title: 'Hedera-secured foundation',
    description: 'Tokenized wage vaults, settlement contracts, and immutable payroll records on Hedera Hashgraph.',
  },
  {
    title: 'Enterprise controls, built-in',
    description: 'Role-based approvals, customizable limits, and live treasury visibility for finance teams.',
  },
  {
    title: 'Human-centered experience',
    description: 'Story-driven guidance, contextual nudges, and responsive support for every employee request.',
  },
];

export default function Home() {
  const router = useRouter();
  const { isConnected, accountId, user, userRole } = useSelector((state: RootState) => state.hashconnect);
  const roleDestination = userRole ? ROLE_LABELS[userRole] ?? 'your workspace' : null;

  useEffect(() => {
    if (isConnected && userRole && ROLE_ROUTES[userRole]) {
      router.push(ROLE_ROUTES[userRole]);
    }
  }, [isConnected, userRole, router]);

  return (
    <div className="bg-background-dark text-gray-200 min-h-screen">
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-background-dark to-background-dark" aria-hidden />
        <header className="relative max-w-5xl mx-auto px-6 pt-24 pb-16 text-center md:pt-28">
          <span className="inline-flex items-center justify-center rounded-full border border-primary/30 bg-primary/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Hedera powered wage advances
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            TARWIJ EWA — dignity-focused wage access for modern workforces
          </h1>
          <p className="mt-6 text-base text-gray-300 sm:text-lg md:text-xl max-w-3xl mx-auto">
            We help enterprises deliver earned wages within minutes, so employees can navigate life with confidence and employers can prove their commitment to financial wellbeing.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-[minmax(0,1fr)]">
            <div className="bg-background-light/10 border border-gray-700/70 rounded-2xl px-6 py-8 shadow-lg shadow-primary/5 backdrop-blur">
              <div className="flex flex-col items-center gap-4">
                <div className="text-sm font-semibold text-primary uppercase tracking-[0.3em]">Connect &amp; explore</div>
                <p className="text-base text-gray-300 max-w-md">
                  Authenticate with HashPack and we’ll send you straight to the workspace that fits your role—employee, enterprise leader, or TARWIJ EWA admin.
                </p>
                <HashConnectButton />
                {isConnected && user ? (
                  <div className="mt-6 grid w-full gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-left text-sm text-gray-200">
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-gray-400">Status</span>
                      <span className="text-primary">Connected</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Account</span>
                      <span className="font-mono text-xs md:text-sm">{accountId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Profile</span>
                      <span>{user.name}</span>
                    </div>
                    {roleDestination && (
                      <p className="col-span-full pt-2 text-xs text-gray-400">
                        We’ll keep you on {roleDestination} so everything you need is ready the moment you sign in.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 w-full rounded-xl border border-dashed border-primary/40 bg-primary/10 p-4 text-xs text-primary/90">
                    Have HashPack installed? Tap connect to authenticate securely with Hedera—after login we guide you to the workspace that matches your role.
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      </div>

      <main className="relative z-10">
        <section className="px-6 py-16 md:py-20">
          <div className="max-w-5xl mx-auto">
            <header className="mb-10 md:mb-12">
              <h2 className="text-3xl font-semibold text-white md:text-4xl">A story written with every pay cycle</h2>
              <p className="mt-3 text-gray-400 md:text-lg">
                TARWIJ EWA combines Hedera’s trust layer with human payroll operations to keep employees ahead of life’s curveballs.
              </p>
            </header>

            <div className="grid gap-6 md:grid-cols-3">
              {storyMilestones.map((milestone) => (
                <article key={milestone.title} className="rounded-2xl border border-gray-700/60 bg-background-light/10 p-6 shadow-lg shadow-black/5">
                  <h3 className="text-xl font-semibold text-white">{milestone.title}</h3>
                  <p className="mt-3 text-sm text-gray-400 leading-relaxed">{milestone.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-background-light/5 border-y border-gray-800/80 px-6 py-16 md:py-20">
          <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div>
              <h2 className="text-3xl font-semibold text-white md:text-4xl">How wage advances feel for employees</h2>
              <p className="mt-4 text-gray-400 md:text-lg">
                Advancing salaries should feel like a relief, not a request. We orchestrate the approvals, disbursement, and repayments so your
                teams can focus on work, not worry.
              </p>
              <div className="mt-8 grid gap-4">
                {employeeBenefits.map((benefit) => (
                  <div key={benefit.label} className="rounded-xl border border-gray-700/60 bg-background-dark/70 p-5">
                    <p className="text-sm font-semibold text-primary uppercase tracking-[0.25em]">{benefit.label}</p>
                    <p className="mt-2 text-sm text-gray-300 leading-relaxed">{benefit.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-700/60 bg-gradient-to-br from-primary/15 via-background-dark to-background-dark p-6">
              <div className="rounded-2xl border border-gray-600/40 bg-background-dark/80 p-6">
                <h3 className="text-lg font-semibold text-white">How it works</h3>
                <ol className="mt-5 space-y-5 text-sm text-gray-300">
                  <li className="flex gap-4">
                    <span className="text-primary font-semibold">01</span>
                    <p>Employee requests an advance using intuitive prompts tailored to enterprise policy.</p>
                  </li>
                  <li className="flex gap-4">
                    <span className="text-primary font-semibold">02</span>
                    <p>Approvers review context-rich details while Hedera escrow smart contracts prepare the transfer.</p>
                  </li>
                  <li className="flex gap-4">
                    <span className="text-primary font-semibold">03</span>
                    <p>Funds are released instantly and repayments settle automatically on payday through token flows.</p>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-background-light/5 border-y border-gray-800/80 px-6 py-16 md:py-20">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-3xl font-semibold text-white md:text-4xl">Why TARWIJ EWA feels different</h2>
            <p className="mt-4 text-gray-400 md:text-lg">
              We translate the complexity of Hedera primitives into a cohesive enterprise journey. Every stakeholder—from treasury to HR to warehouse teams—stays aligned.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {platformPillars.map((pillar) => (
                <article key={pillar.title} className="rounded-2xl border border-gray-700/60 bg-background-dark/70 p-6 shadow-lg shadow-black/5">
                  <h3 className="text-xl font-semibold text-white">{pillar.title}</h3>
                  <p className="mt-3 text-sm text-gray-400 leading-relaxed">{pillar.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:py-20">
          <div className="max-w-4xl mx-auto rounded-3xl border border-primary/40 bg-primary/15 p-10 text-center shadow-xl shadow-primary/20">
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">Ready to champion your team’s wellbeing?</h2>
            <p className="mt-4 text-gray-200">
              Schedule a walkthrough or connect your wallet to see how TARWIJ EWA weaves into payroll and delivers advances that employees celebrate.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <HashConnectButton />
            </div>
            <p className="mt-4 text-xs text-gray-300">
              Connect your HashPack wallet above to unlock the workspace that matches your role.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
