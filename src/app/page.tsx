import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  BadgeCheck,
  Check,
  Clock3,
  Headphones,
  LifeBuoy,
  LockKeyhole,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  Store,
  TicketCheck,
  UsersRound,
} from "lucide-react";
import { ShopifyLogoMark } from "@/components/shared/ShopifyLogoMark";

const highlights = [
  {
    icon: TicketCheck,
    number: "01",
    title: "Every request has a home",
    description: "Keep tickets, service requests, and conversations connected to the store they belong to.",
    accent: "text-[#b9ed75]",
  },
  {
    icon: UsersRound,
    number: "02",
    title: "The right expert, from the start",
    description: "Connect merchants with a dedicated specialist, including through agent-specific onboarding links.",
    accent: "text-[#f6a28c]",
  },
  {
    icon: PackageCheck,
    number: "03",
    title: "Progress stays visible",
    description: "See updates, next steps, and replies without losing the context of the original request.",
    accent: "text-[#9dd8dd]",
  },
];

export default function HomePage() {
  return (
    <div className="home-page min-h-screen overflow-hidden bg-[#f7f7f2] text-[#17211d]">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-[#f7f7f2]/95 px-5 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Shopify Support home">
            <ShopifyLogoMark size={30} className="h-[30px] w-[30px] object-contain" />
            <span className="text-[15px] font-bold tracking-[-0.02em] text-[#101713]">Shopify Support</span>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-7" aria-label="Main navigation">
            <Link href="/start/agent" className="hidden text-sm font-medium text-[#4f5b54] transition hover:text-[#087454] sm:inline">
              Agent workspace
            </Link>
            <Link href="/start/customer" className="text-xs font-semibold text-[#4f5b54] transition hover:text-[#087454] sm:text-sm">
              Sign in
            </Link>
            <Link href="/start/customer" className="inline-flex items-center gap-2 rounded-full bg-[#111916] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#087454] sm:px-5 sm:text-sm">
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden px-5 sm:px-8">
          <div className="home-grid pointer-events-none absolute inset-0 -z-10" />
          <div className="mx-auto grid max-w-7xl items-center gap-12 pb-16 pt-14 sm:pb-20 sm:pt-20 lg:min-h-[590px] lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:py-16">
            <div className="home-rise max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d8e1d4] bg-white/75 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#326b4f]">
                <ShieldCheck className="h-3.5 w-3.5" /> Merchant support, made clearer
              </div>
              <h1 className="max-w-[620px] font-serif text-[42px] leading-[1.04] tracking-[-0.035em] text-[#111916] sm:text-[56px] lg:text-[64px]">
                Better support starts <span className="text-[#16845f]">in one place.</span>
              </h1>
              <p className="mt-6 max-w-lg text-[15px] leading-7 text-[#5b655e] sm:text-base">
                A shared space for Shopify merchants and their support teams to solve store issues, manage requests, and keep every conversation moving.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/start/customer" className="inline-flex items-center gap-2 rounded-full bg-[#16845f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0c6347]">
                  Open merchant portal <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="#how-it-works" className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[#28372f] transition hover:bg-white/80">
                  See how it works <ArrowDownRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#dfe3dc] pt-5 text-xs font-medium text-[#5b655e]">
                <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#16845f]" /> Dedicated agent assignment</span>
                <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#16845f]" /> Ticket-linked conversations</span>
              </div>
            </div>

            <div className="home-rise home-delay-1 relative mx-auto w-full max-w-[650px] lg:ml-auto">
              <div className="absolute -right-5 top-8 -z-10 h-36 w-44 rotate-3 rounded-[18px] border border-[#d6ded4] sm:-right-8 sm:h-48 sm:w-56" />
              <div className="absolute -bottom-5 left-4 -z-10 h-24 w-28 -rotate-3 rounded-lg bg-[#efc4ad]/70 sm:left-10 sm:h-32 sm:w-36" />
              <div className="overflow-hidden rounded-[18px] border border-[#dce1da] bg-white shadow-[0_24px_70px_-35px_rgba(19,43,31,0.42)]">
                <div className="flex h-11 items-center justify-between border-b border-[#edf0eb] px-4 sm:px-5">
                  <div className="flex items-center gap-1.5" aria-hidden="true">
                    <span className="h-2 w-2 rounded-full bg-[#ed8c78]" />
                    <span className="h-2 w-2 rounded-full bg-[#e8c16e]" />
                    <span className="h-2 w-2 rounded-full bg-[#90b797]" />
                  </div>
                  <span className="text-[10px] font-medium text-[#87918a]">Merchant support workspace</span>
                  <div className="h-5 w-5 rounded-full bg-[#e4efe1] text-center text-[10px] font-bold leading-5 text-[#326b4f]">A</div>
                </div>
                <div className="grid min-h-[350px] grid-cols-[118px_1fr] sm:grid-cols-[166px_1fr]">
                  <aside className="border-r border-[#edf0eb] bg-[#fbfcfa] p-3 sm:p-4">
                    <div className="mb-5 flex items-center gap-2 text-[10px] font-bold text-[#29372f] sm:text-xs">
                      <span className="grid h-6 w-6 place-items-center rounded-md bg-[#e3f0df] text-[#16845f]"><LifeBuoy className="h-3.5 w-3.5" /></span>
                      Inbox
                    </div>
                    <div className="space-y-1 text-[10px] font-medium sm:text-xs">
                      <div className="flex items-center justify-between rounded-md bg-[#e8f2e6] px-2 py-2 text-[#235b42]"><span>My tickets</span><span>4</span></div>
                      <div className="rounded-md px-2 py-2 text-[#68736b]">Conversations</div>
                      <div className="rounded-md px-2 py-2 text-[#68736b]">Service requests</div>
                      <div className="rounded-md px-2 py-2 text-[#68736b]">Store files</div>
                    </div>
                    <div className="mt-8 border-t border-[#e7ebe5] pt-4">
                      <div className="mb-3 text-[9px] font-bold uppercase tracking-[0.1em] text-[#98a199]">Your support team</div>
                      <div className="flex items-center gap-2">
                        <div className="grid h-7 w-7 place-items-center rounded-full bg-[#f3d2c2] text-[9px] font-bold text-[#684739]">JM</div>
                        <div className="min-w-0">
                          <div className="truncate text-[9px] font-semibold text-[#334138] sm:text-[10px]">Jordan M.</div>
                          <div className="text-[8px] text-[#87918a] sm:text-[9px]">Store specialist</div>
                        </div>
                      </div>
                    </div>
                  </aside>

                  <div className="min-w-0 p-4 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#edf0eb] pb-4">
                      <div>
                        <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#89938c]">Open ticket · TKT-10428</div>
                        <h2 className="mt-1 text-sm font-bold text-[#1d2a22] sm:text-base">Checkout shipping rates not updating</h2>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff1df] px-2.5 py-1 text-[9px] font-semibold text-[#95602c]"><Clock3 className="h-3 w-3" /> In progress</span>
                    </div>
                    <div className="mt-5 flex gap-2.5">
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#e4efe1] text-[#16845f]"><Store className="h-3.5 w-3.5" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2"><span className="text-[10px] font-bold text-[#334138]">You</span><span className="text-[9px] text-[#9aa39c]">10:42 AM</span></div>
                        <div className="max-w-[370px] rounded-r-lg rounded-bl-lg bg-[#f2f5f0] p-3 text-[10px] leading-5 text-[#57625a] sm:text-xs">We changed our shipping zones yesterday, and checkout is still showing the old rates.</div>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2.5">
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f3d2c2] text-[9px] font-bold text-[#684739]">JM</div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2"><span className="text-[10px] font-bold text-[#334138]">Jordan · Your specialist</span><span className="text-[9px] text-[#9aa39c]">10:51 AM</span></div>
                        <div className="max-w-[370px] rounded-r-lg rounded-bl-lg bg-[#eaf4e8] p-3 text-[10px] leading-5 text-[#3d5947] sm:text-xs">I’m checking the zone settings now. I’ll update this ticket as soon as I’ve confirmed the fix.</div>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center gap-2 rounded-lg border border-[#e3e9e1] bg-white px-3 py-2.5 text-[10px] text-[#a0aaa2] sm:text-xs">
                      <MessageCircle className="h-3.5 w-3.5" /> Reply to your support team…
                      <span className="ml-auto grid h-6 w-6 place-items-center rounded-md bg-[#16845f] text-white"><ArrowRight className="h-3 w-3" /></span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 right-3 flex items-center gap-2 rounded-lg border border-[#e1e7df] bg-white px-3 py-2.5 shadow-lg sm:right-8">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#e5f2df] text-[#16845f]"><BadgeCheck className="h-4 w-4" /></span>
                <span className="text-[10px] font-semibold text-[#35443a] sm:text-xs">Your store context stays connected</span>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#e5e8e1] bg-white px-5 py-7 sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a948c]">One connected support loop</p>
            <div className="grid grid-cols-3 gap-3 sm:flex sm:items-center sm:gap-8">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-[#39473e] sm:text-sm"><Store className="h-4 w-4 text-[#16845f]" /> Merchants</div>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-[#39473e] sm:text-sm"><Headphones className="h-4 w-4 text-[#d47c63]" /> Specialists</div>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-[#39473e] sm:text-sm"><LockKeyhole className="h-4 w-4 text-[#627ac1]" /> Operations</div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-[#101b17] px-5 py-16 text-white sm:px-8 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col justify-between gap-5 sm:mb-14 sm:flex-row sm:items-end">
              <div className="max-w-2xl">
                <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#b9ed75]">A calmer way to get help</p>
                <h2 className="font-serif text-[34px] leading-tight tracking-[-0.025em] sm:text-[46px]">Support work, connected from the first message.</h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-[#b3c0b7]">From the first store question to a completed service request, keep the people and details in sync.</p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-[10px] border border-white/10 bg-white/10 md:grid-cols-3">
              {highlights.map(({ icon: Icon, number, title, description, accent }) => (
                <article key={number} className="min-h-[238px] bg-[#14221c] p-6 transition-colors hover:bg-[#192a22] sm:p-8">
                  <div className="flex items-center justify-between">
                    <Icon className={`h-6 w-6 ${accent}`} strokeWidth={1.7} />
                    <span className="font-mono text-[11px] text-[#78877c]">{number}</span>
                  </div>
                  <h3 className="mt-9 text-lg font-semibold text-[#f5f7f4]">{title}</h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-[#aebbb1]">{description}</p>
                </article>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-[#b3c0b7]">
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#b9ed75]" /> Access shaped around each role</span>
              <Link href="/start/customer" className="inline-flex items-center gap-2 font-semibold text-[#d2f39e] transition hover:text-white">Explore the merchant portal <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#16845f]">Made for the whole team</p>
              <h2 className="max-w-lg font-serif text-[34px] leading-tight tracking-[-0.025em] text-[#17211d] sm:text-[44px]">The right workspace for every role.</h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-[#626d65]">A clear starting point for store owners, support specialists, and the people who oversee the operation.</p>
            </div>
            <div className="divide-y divide-[#dfe4dc] border-y border-[#dfe4dc]">
              <Link href="/start/customer" className="group flex items-center gap-4 py-5 transition hover:px-2 sm:py-6">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#e5f1df] text-[#16845f]"><Store className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1"><span className="block text-base font-semibold text-[#1c2921]">Merchant portal</span><span className="mt-1 block text-xs leading-5 text-[#6a756d] sm:text-sm">Track tickets, talk with your specialist, and manage store requests.</span></span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#758078] transition group-hover:translate-x-1 group-hover:text-[#16845f]" />
              </Link>
              <Link href="/start/agent" className="group flex items-center gap-4 py-5 transition hover:px-2 sm:py-6">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#f8e9df] text-[#b65f42]"><Headphones className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1"><span className="block text-base font-semibold text-[#1c2921]">Agent workspace</span><span className="mt-1 block text-xs leading-5 text-[#6a756d] sm:text-sm">Manage assigned conversations, customer context, and service work.</span></span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#758078] transition group-hover:translate-x-1 group-hover:text-[#16845f]" />
              </Link>
              <Link href="/start/admin" className="group flex items-center gap-4 py-5 transition hover:px-2 sm:py-6">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#e7eaf5] text-[#596fae]"><LockKeyhole className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1"><span className="block text-base font-semibold text-[#1c2921]">Admin console</span><span className="mt-1 block text-xs leading-5 text-[#6a756d] sm:text-sm">Oversee access, assignments, audit activity, and support operations.</span></span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#758078] transition group-hover:translate-x-1 group-hover:text-[#16845f]" />
              </Link>
            </div>
          </div>
        </section>

        <section className="px-5 pb-16 sm:px-8 sm:pb-24">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-[12px] bg-[#dff0d5] px-6 py-9 sm:flex-row sm:items-center sm:px-10 sm:py-11">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#397254]">Ready when you are</p>
              <h2 className="mt-2 font-serif text-[28px] leading-tight tracking-[-0.02em] text-[#17211d] sm:text-[34px]">Let’s get your store the right support.</h2>
            </div>
            <Link href="/start/customer" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#17211d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#16845f]">
              Start with your store <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e2e6df] bg-white px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-xs text-[#758078] sm:flex-row">
          <Link href="/" className="flex items-center gap-2 font-semibold text-[#29372f]"><ShopifyLogoMark size={22} className="h-[22px] w-[22px] object-contain" /> Shopify Support</Link>
          <span>Merchant support and commerce services</span>
          <Link href="/start/customer" className="font-semibold text-[#397254] hover:text-[#16845f]">Customer sign in</Link>
        </div>
      </footer>
    </div>
  );
}
