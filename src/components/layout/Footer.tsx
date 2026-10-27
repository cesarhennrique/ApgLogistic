import Image from "next/image";
import { site, type Address } from "@/content/site";
import { TransitionLink } from "./TransitionLink";

const links = [
  ...site.nav.flatMap((item) => ("children" in item ? item.children : [item])),
  site.legal.privacy,
];

const linkClass =
  "hover:text-sand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sand-50";

function AddressBlock({ address }: { address: Address }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-sand-50">{address.label}</h2>
      <address className="mt-3 text-sm leading-relaxed text-steel-400 not-italic">
        {address.street}
        <br />
        {address.complement}
        <br />
        {address.district}, {address.city} – {address.state}
        <br />
        {site.ui.zip} {address.zip}
      </address>
    </div>
  );
}

// Cache Components forbids reading the clock while prerendering; "use cache" (default cacheLife,
// revalidates every 15 min) keeps pages static and still rolls the year over on its own.
async function CurrentYear() {
  "use cache";
  return new Date().getFullYear();
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-sand-50/10">
      <div className="site-container grid gap-10 py-14 md:grid-cols-4 md:py-20">
        <div>
          <Image src="/brand/logo-white.svg" alt={site.name} width={4960} height={2953} className="h-12 w-auto" />
          <p className="mt-4 max-w-56 text-sm text-steel-400">{site.tagline}</p>
        </div>
        <AddressBlock address={site.addresses.matriz} />
        <AddressBlock address={site.addresses.filial} />
        <div>
          <h2 className="text-sm font-semibold text-sand-50">{site.ui.phone}</h2>
          <ul className="mt-3 space-y-1 text-sm text-steel-400">
            {site.phones.map((p) => (
              <li key={p.href}>
                <a href={p.href} className={linkClass}>
                  {p.display}
                </a>
              </li>
            ))}
          </ul>
          <h2 className="mt-6 text-sm font-semibold text-sand-50">{site.ui.email}</h2>
          <a href={`mailto:${site.emails.rh}`} className={`mt-3 block text-sm break-all text-steel-400 ${linkClass}`}>
            {site.emails.rh}
          </a>
        </div>
      </div>

      <div className="site-container flex flex-col gap-6 border-t border-sand-50/10 py-8 text-sm text-steel-400 md:flex-row md:items-center md:justify-between">
        <nav aria-label={site.ui.footerNav}>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {links.map((l) => (
              <li key={l.href}>
                <TransitionLink href={l.href} className={linkClass}>
                  {l.label}
                </TransitionLink>
              </li>
            ))}
          </ul>
        </nav>
        <p className="shrink-0">
          © <CurrentYear /> {site.name}
        </p>
      </div>
    </footer>
  );
}
