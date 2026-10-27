import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { site, type NavLink } from "@/content/site";

const page = site.nav.find((item): item is NavLink => "href" in item && item.href === "/contato")!;

export const metadata = { title: page.label };

export default function Page() {
  return <PagePlaceholder title={page.label} />;
}
